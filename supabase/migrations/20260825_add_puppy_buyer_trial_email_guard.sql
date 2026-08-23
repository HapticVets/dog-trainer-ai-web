update public.promotional_trial_codes
set buyer_email = lower(trim(buyer_email))
where buyer_email is not null;

alter table public.promotional_trial_codes
  add constraint promotional_trial_codes_puppy_buyer_email_required
  check (
    trial_type <> 'puppy_buyer'
    or (
      buyer_email is not null
      and char_length(trim(buyer_email)) > 3
      and puppy_id is not null
      and litter_id is not null
    )
  );

create unique index if not exists promotional_trial_codes_one_active_puppy_invitation
  on public.promotional_trial_codes (puppy_id)
  where trial_type = 'puppy_buyer' and status in ('available', 'redeemed');

drop function if exists public.redeem_promotional_trial_code(text, text, text);

create function public.redeem_promotional_trial_code(
  p_code text,
  p_clerk_user_id text,
  p_redeemed_by_email text,
  p_verified_emails text[]
)
returns table(result text, trial_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial public.promotional_trial_codes%rowtype;
  v_expires_at timestamptz;
begin
  select *
  into v_trial
  from public.promotional_trial_codes
  where code = upper(trim(p_code))
  for update;

  if not found then
    return query select 'not_found'::text, null::timestamptz;
    return;
  end if;

  if v_trial.revoked_at is not null or v_trial.status = 'revoked' then
    return query select 'revoked'::text, null::timestamptz;
    return;
  end if;

  if v_trial.status <> 'available' or v_trial.redeemed_by_clerk_user_id is not null then
    return query select 'claimed'::text, null::timestamptz;
    return;
  end if;

  if v_trial.trial_type = 'puppy_buyer' and not exists (
    select 1
    from unnest(coalesce(p_verified_emails, array[]::text[])) as verified_email
    where lower(trim(verified_email)) = lower(trim(v_trial.buyer_email))
  ) then
    return query select 'buyer_email_mismatch'::text, null::timestamptz;
    return;
  end if;

  if exists (
    select 1
    from public.promotional_trial_codes
    where redeemed_by_clerk_user_id = p_clerk_user_id
  ) then
    return query select 'account_used'::text, null::timestamptz;
    return;
  end if;

  v_expires_at := now() + make_interval(days => v_trial.trial_days);

  begin
    update public.promotional_trial_codes
    set
      status = 'redeemed',
      redeemed_by_clerk_user_id = p_clerk_user_id,
      redeemed_by_email = nullif(lower(trim(p_redeemed_by_email)), ''),
      redeemed_at = now(),
      expires_at = v_expires_at
    where id = v_trial.id;
  exception when unique_violation then
    return query select 'account_used'::text, null::timestamptz;
    return;
  end;

  return query select 'redeemed'::text, v_expires_at;
end;
$$;

revoke all on function public.redeem_promotional_trial_code(text, text, text, text[]) from public;
grant execute on function public.redeem_promotional_trial_code(text, text, text, text[]) to service_role;
