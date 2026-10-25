begin;
create table public.booking_hours (
  weekday integer primary key check(weekday between 1 and 7),
  opens_at time not null,
  closes_at time not null,
  check(closes_at>opens_at)
);
insert into public.booking_hours values
  (1,'09:00','17:00'),(2,'09:00','17:00'),(3,'09:00','17:00'),
  (4,'09:00','17:00'),(5,'09:00','17:00'),(6,'10:00','13:00');
alter table public.booking_hours enable row level security;
revoke all on public.booking_hours from anon,authenticated;
grant all on public.booking_hours to service_role;

-- Stable UUIDs allow an unbooked regular time to remain virtual until requested.
create function public.booking_regular_id(p_start timestamptz) returns uuid
language sql immutable set search_path=public as $$
  select overlay(overlay(md5('patriot-k9:'||to_char(p_start at time zone 'UTC','YYYY-MM-DD"T"HH24:MI')) placing '5' from 13 for 1) placing '8' from 17 for 1)::uuid;
$$;
create function public.booking_available() returns table(id uuid,starts_at timestamptz,ends_at timestamptz)
language sql stable security definer set search_path=public as $$
  with dates as (
    select (now() at time zone 'America/New_York')::date+i as day from generate_series(0,60) i
  ), times as (
    select t as starts_at,t+interval '1 hour' as ends_at
    from dates d join booking_hours h on h.weekday=extract(isodow from d.day)
    cross join lateral generate_series((d.day+h.opens_at) at time zone 'America/New_York',
      ((d.day+h.closes_at) at time zone 'America/New_York')-interval '1 hour',interval '1 hour') t
    where t>now()
  )
  select coalesce(s.id,booking_regular_id(t.starts_at)),t.starts_at,t.ends_at
  from times t left join booking_slots s on s.starts_at=t.starts_at and s.ends_at=t.ends_at and s.state='open'
  where not exists(select 1 from booking_slots b where tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(t.starts_at,t.ends_at,'[)')
    and (b.state='blocked' or (b.state='open' and (b.starts_at<>t.starts_at or b.ends_at<>t.ends_at))))
  and not exists(select 1 from booking_requests r join booking_slots b on b.id=r.slot_id where r.status='approved'
    and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(t.starts_at,t.ends_at,'[)'))
  order by t.starts_at;
$$;

create or replace function public.booking_request(p_slot uuid,p_submission uuid,p_details jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare candidate record; r booking_requests;
begin
  perform pg_advisory_xact_lock(80261025);
  select * into r from booking_requests where submission_id=p_submission;
  if found then return to_jsonb(r); end if;
  if coalesce(p_details->>'email','')='' then raise exception 'Email is required.'; end if;
  select * into candidate from booking_available() a where a.id=p_slot;
  if not found then raise exception 'That time is no longer available. Please choose another time.'; end if;
  insert into booking_slots(id,starts_at,ends_at) values(candidate.id,candidate.starts_at,candidate.ends_at) on conflict(id) do nothing;
  insert into booking_requests(slot_id,submission_id,details) values(p_slot,p_submission,p_details) returning * into r;
  insert into booking_mail(request_id,kind) values(r.id,'owner');
  return to_jsonb(r);
end $$;

-- Allows an authorized owner/assistant to close a regular hour without an admin UI.
create function public.booking_block(p_start timestamptz,p_end timestamptz) returns jsonb
language plpgsql security definer set search_path=public as $$
declare s booking_slots;
begin
  perform pg_advisory_xact_lock(80261025);
  if p_start is null or p_end<>p_start+interval '1 hour' or p_start<=now() then raise exception 'Choose a future one-hour time.'; end if;
  if exists(select 1 from booking_requests r join booking_slots b on b.id=r.slot_id where r.status='approved' and tstzrange(b.starts_at,b.ends_at,'[)')&&tstzrange(p_start,p_end,'[)')) then raise exception 'Cancel the approved appointment before closing its time.'; end if;
  select * into s from booking_slots where starts_at=p_start and ends_at=p_end;
  if found then update booking_slots set state='blocked' where id=s.id returning * into s;
  else insert into booking_slots(id,starts_at,ends_at,state) values(booking_regular_id(p_start),p_start,p_end,'blocked') returning * into s;
  end if;
  return to_jsonb(s);
end $$;
revoke all on function public.booking_regular_id(timestamptz),public.booking_available(),public.booking_block(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.booking_regular_id(timestamptz),public.booking_available(),public.booking_block(timestamptz,timestamptz) to service_role;
commit;
