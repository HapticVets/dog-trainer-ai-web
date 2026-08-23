create table if not exists public.promotional_trial_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  trial_days integer not null default 30 check (trial_days > 0 and trial_days <= 365),
  trial_type text not null default 'general' check (trial_type in ('general', 'puppy_buyer')),
  status text not null default 'available' check (status in ('available', 'redeemed', 'revoked')),
  campaign_name text,
  organization_name text,
  notes text,
  buyer_email text,
  puppy_id uuid,
  litter_id uuid,
  created_by_clerk_user_id text not null,
  created_at timestamptz not null default now(),
  redeemed_by_clerk_user_id text,
  redeemed_by_email text,
  redeemed_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  constraint promotional_trial_codes_redemption_consistency check (
    (status = 'available' and redeemed_by_clerk_user_id is null and redeemed_at is null and expires_at is null)
    or (status = 'redeemed' and redeemed_by_clerk_user_id is not null and redeemed_at is not null and expires_at is not null)
    or status = 'revoked'
  )
);

create unique index if not exists promotional_trial_codes_one_trial_per_account
  on public.promotional_trial_codes (redeemed_by_clerk_user_id)
  where redeemed_by_clerk_user_id is not null;

create index if not exists promotional_trial_codes_status_created_at_idx
  on public.promotional_trial_codes (status, created_at desc);

create index if not exists promotional_trial_codes_buyer_email_idx
  on public.promotional_trial_codes (buyer_email)
  where buyer_email is not null;

alter table public.promotional_trial_codes enable row level security;

create or replace function public.redeem_promotional_trial_code(
  p_code text,
  p_clerk_user_id text,
  p_redeemed_by_email text
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
      redeemed_by_email = nullif(trim(p_redeemed_by_email), ''),
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

revoke all on function public.redeem_promotional_trial_code(text, text, text) from public;
grant execute on function public.redeem_promotional_trial_code(text, text, text) to service_role;
