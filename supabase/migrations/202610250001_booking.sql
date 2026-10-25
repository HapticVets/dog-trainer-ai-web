begin;
create table public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  state text not null default 'open' check (state in ('open','blocked')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at <= starts_at + interval '4 hours'),
  exclude using gist (tstzrange(starts_at,ends_at,'[)') with &&) where (state='open')
);
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  slot_id uuid not null references public.booking_slots(id),
  details jsonb not null,
  status text not null default 'pending' check(status in ('pending','approved','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index booking_one_approval on public.booking_requests(slot_id) where status='approved';
create index booking_pending on public.booking_requests(status,created_at);
create table public.booking_mail (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.booking_requests(id),
  kind text not null check(kind in ('owner','approved','declined','cancelled')),
  state text not null default 'pending' check(state in ('pending','sending','sent','superseded')),
  leased_until timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  unique(request_id,kind)
);
alter table public.booking_slots enable row level security;
alter table public.booking_requests enable row level security;
alter table public.booking_mail enable row level security;
revoke all on public.booking_slots,public.booking_requests,public.booking_mail from anon,authenticated;
grant all on public.booking_slots,public.booking_requests,public.booking_mail to service_role;

-- All changes share one lock; approve and request both recheck the live slot.
create function public.booking_request(p_slot uuid,p_submission uuid,p_details jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare s booking_slots; r booking_requests;
begin
  perform pg_advisory_xact_lock(80261025);
  select * into r from booking_requests where submission_id=p_submission;
  if found then return to_jsonb(r); end if;
  select * into s from booking_slots where id=p_slot and state='open' and starts_at>now();
  if not found or exists(select 1 from booking_requests where slot_id=p_slot and status='approved') then
    raise exception 'That time is no longer available. Please choose another time.' using errcode='P0001';
  end if;
  if coalesce(p_details->>'email','')='' then raise exception 'Email is required.'; end if;
  insert into booking_requests(slot_id,submission_id,details) values(p_slot,p_submission,p_details) returning * into r;
  insert into booking_mail(request_id,kind) values(r.id,'owner');
  return to_jsonb(r);
end $$;

create function public.booking_decide(p_request uuid,p_action text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r booking_requests; s booking_slots;
begin
  perform pg_advisory_xact_lock(80261025);
  select * into r from booking_requests where id=p_request for update;
  if not found then raise exception 'Request not found.'; end if;
  if p_action not in ('approved','declined','cancelled') then raise exception 'Invalid action.'; end if;
  if r.status=p_action then return to_jsonb(r); end if;
  if exists(select 1 from booking_mail where request_id=r.id and state='sending' and leased_until>now()) then raise exception 'Email is still being delivered. Please retry in two minutes.'; end if;
  if p_action in ('approved','declined') and r.status<>'pending' then raise exception 'This request has already been decided.'; end if;
  if p_action='cancelled' and r.status<>'approved' then raise exception 'Only an approved appointment can be cancelled.'; end if;
  select * into s from booking_slots where id=r.slot_id for update;
  if p_action='approved' then
    if s.state<>'open' or s.starts_at<=now() or exists(select 1 from booking_requests where slot_id=s.id and status='approved') then
      raise exception 'That time is no longer available.';
    end if;
  end if;
  update booking_requests set status=p_action,updated_at=now() where id=r.id returning * into r;
  update booking_mail set state='superseded' where request_id=r.id and kind<>'owner' and state in ('pending','sending');
  insert into booking_mail(request_id,kind) values(r.id,p_action) on conflict do nothing;
  return to_jsonb(r);
end $$;

create function public.booking_slot(p_start timestamptz default null,p_end timestamptz default null,p_slot uuid default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare s booking_slots;
begin
  perform pg_advisory_xact_lock(80261025);
  if p_slot is not null then
    if exists(select 1 from booking_requests where slot_id=p_slot and status='approved') then raise exception 'Cancel the approved appointment before removing this time.'; end if;
    update booking_slots set state='blocked' where id=p_slot returning * into s;
    if not found then raise exception 'Time not found.'; end if;
  else
    if p_start is null or p_end is null or p_start<=now() or p_start>now()+interval '180 days' then raise exception 'Choose a future time within 180 days.'; end if;
    insert into booking_slots(starts_at,ends_at) values(p_start,p_end) returning * into s;
  end if;
  return to_jsonb(s);
end $$;

create function public.booking_claim_mail(p_request uuid) returns setof public.booking_mail
language plpgsql security definer set search_path=public as $$
begin
  -- A lease prevents simultaneous retries; provider idempotency covers uncertain sends.
  return query update booking_mail m set state='sending',leased_until=now()+interval '2 minutes',attempts=attempts+1
    from booking_requests r where m.request_id=p_request and r.id=m.request_id
    and (m.state='pending' or (m.state='sending' and m.leased_until<now()))
    and (m.kind='owner' or m.kind=r.status)
    returning m.*;
end $$;
revoke all on function public.booking_request(uuid,uuid,jsonb),public.booking_decide(uuid,text),public.booking_slot(timestamptz,timestamptz,uuid),public.booking_claim_mail(uuid) from public,anon,authenticated;
grant execute on function public.booking_request(uuid,uuid,jsonb),public.booking_decide(uuid,text),public.booking_slot(timestamptz,timestamptz,uuid),public.booking_claim_mail(uuid) to service_role;
commit;
