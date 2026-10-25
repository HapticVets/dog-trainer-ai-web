begin;
alter table public.booking_requests drop constraint booking_requests_status_check;
alter table public.booking_requests add constraint booking_requests_status_check check(status in ('pending','awaiting_payment','approved','declined','cancelled','expired','payment_review'));
alter table public.booking_requests
  add column amount_due_cents integer,
  add column amount_paid_cents integer not null default 0,
  add column payment_currency text,
  add column payment_due_at timestamptz,
  add column invoice_prepared_at timestamptz,
  add column stripe_invoice_id text unique,
  add column stripe_customer_id text,
  add column invoice_url text,
  add column invoice_number text,
  add column invoice_sent_at timestamptz,
  add column paid_at timestamptz;
create unique index booking_one_payment_hold on public.booking_requests(slot_id) where status in ('awaiting_payment','approved');
alter table public.booking_mail drop constraint booking_mail_kind_check;
alter table public.booking_mail add constraint booking_mail_kind_check check(kind in ('owner','approved','declined','cancelled','expired','paid_owner','payment_issue'));
create table public.booking_payment_events(event_id text primary key,request_id uuid not null references public.booking_requests(id),invoice_id text not null,created_at timestamptz not null default now());
alter table public.booking_payment_events enable row level security;
revoke all on public.booking_payment_events from anon,authenticated;
grant all on public.booking_payment_events to service_role;

create function public.booking_invoice_prepare(p_request uuid,p_due_at timestamptz) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r booking_requests; s booking_slots;
begin
  perform pg_advisory_xact_lock(80261025);
  select * into r from booking_requests where id=p_request for update;
  if not found then raise exception 'Request not found.'; end if;
  if r.status='awaiting_payment' then return to_jsonb(r); end if;
  if r.status<>'pending' then raise exception 'This request has already been decided.'; end if;
  if r.details->>'service'<>'Private training' then raise exception 'Only a single private training lesson uses this invoice flow.'; end if;
  select * into s from booking_slots where id=r.slot_id for update;
  if s.state<>'open' or s.starts_at<=now()+interval '5 minutes' or p_due_at>least(s.starts_at,now()+interval '48 hours') or p_due_at<=now() then raise exception 'Choose a future available appointment and payment deadline.'; end if;
  if exists(select 1 from booking_requests where slot_id=s.id and id<>r.id and status in ('awaiting_payment','approved')) then raise exception 'That time is already held or booked.'; end if;
  update booking_requests set status='awaiting_payment',amount_due_cents=12000,payment_currency='usd',payment_due_at=p_due_at,invoice_prepared_at=now(),updated_at=now() where id=r.id returning * into r;
  return to_jsonb(r);
end $$;

create function public.booking_invoice_attach(p_request uuid,p_invoice text,p_customer text,p_url text default null,p_number text default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r booking_requests;
begin
  perform pg_advisory_xact_lock(80261025);
  select * into r from booking_requests where id=p_request for update;
  if not found or r.status<>'awaiting_payment' then raise exception 'No invoice hold exists for this request.'; end if;
  if r.stripe_invoice_id is not null and r.stripe_invoice_id<>p_invoice then raise exception 'A different invoice is already attached.'; end if;
  if p_invoice not like 'in_%' or p_customer not like 'cus_%' or (p_url is not null and p_url not like 'https://invoice.stripe.com/%') then raise exception 'Invalid Stripe invoice details.'; end if;
  update booking_requests set stripe_invoice_id=p_invoice,stripe_customer_id=p_customer,invoice_url=coalesce(p_url,invoice_url),invoice_number=coalesce(p_number,invoice_number),updated_at=now() where id=r.id returning * into r;
  return to_jsonb(r);
end $$;

create function public.booking_invoice_paid(p_request uuid,p_invoice text,p_amount integer,p_total integer,p_currency text,p_event text,p_paid_at timestamptz) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r booking_requests; s booking_slots; good boolean;
begin
  perform pg_advisory_xact_lock(80261025);
  select * into r from booking_requests where id=p_request for update;
  if not found or r.stripe_invoice_id is distinct from p_invoice then raise exception 'Invoice does not match this booking.'; end if;
  if exists(select 1 from booking_payment_events where event_id=p_event) then return to_jsonb(r); end if;
  insert into booking_payment_events(event_id,request_id,invoice_id) values(p_event,r.id,p_invoice);
  if r.paid_at is not null then return to_jsonb(r); end if;
  select * into s from booking_slots where id=r.slot_id for update;
  good := r.status='awaiting_payment' and s.state='open' and s.starts_at>now()
    and p_total=r.amount_due_cents and p_amount>=r.amount_due_cents and p_currency=r.payment_currency
    and p_paid_at is not null and p_paid_at<=r.payment_due_at
    and not exists(select 1 from booking_requests where slot_id=r.slot_id and id<>r.id and status in ('approved','awaiting_payment'));
  update booking_requests set amount_paid_cents=p_amount,paid_at=coalesce(p_paid_at,now()),status=case when good then 'approved' else 'payment_review' end,updated_at=now() where id=r.id returning * into r;
  if good then
    insert into booking_mail(request_id,kind) values(r.id,'approved'),(r.id,'paid_owner') on conflict do nothing;
  else insert into booking_mail(request_id,kind) values(r.id,'payment_issue') on conflict do nothing;
  end if;
  return to_jsonb(r);
end $$;

create function public.booking_invoice_voided(p_request uuid,p_invoice text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r booking_requests;
begin
  perform pg_advisory_xact_lock(80261025);
  select * into r from booking_requests where id=p_request for update;
  if not found or r.stripe_invoice_id is distinct from p_invoice then raise exception 'Invoice does not match this booking.'; end if;
  if r.status='awaiting_payment' and r.paid_at is null then
    update booking_requests set status='expired',updated_at=now() where id=r.id returning * into r;
    insert into booking_mail(request_id,kind) values(r.id,'expired') on conflict do nothing;
  end if;
  return to_jsonb(r);
end $$;

create or replace function public.booking_decide(p_request uuid,p_action text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r booking_requests;
begin
  perform pg_advisory_xact_lock(80261025);
  select * into r from booking_requests where id=p_request for update;
  if not found then raise exception 'Request not found.'; end if;
  if p_action='approved' then raise exception 'Send the lesson invoice; confirmation requires verified payment.'; end if;
  if p_action not in ('declined','cancelled') then raise exception 'Invalid decision.'; end if;
  if r.status=p_action then return to_jsonb(r); end if;
  if r.status='awaiting_payment' and r.stripe_invoice_id is not null then raise exception 'Void the unpaid Stripe invoice before releasing this time.'; end if;
  if p_action='declined' and r.status not in ('pending','expired','awaiting_payment') then raise exception 'This request cannot be declined.'; end if;
  update booking_requests set status=p_action,updated_at=now() where id=r.id returning * into r;
  update booking_mail set state='superseded' where request_id=r.id and kind not in ('owner','paid_owner','payment_issue') and state in ('pending','sending');
  insert into booking_mail(request_id,kind) values(r.id,p_action) on conflict do nothing;
  return to_jsonb(r);
end $$;

create or replace function public.booking_claim_mail(p_request uuid) returns setof public.booking_mail
language plpgsql security definer set search_path=public as $$
begin
  return query update booking_mail m set state='sending',leased_until=now()+interval '2 minutes',attempts=attempts+1
    from booking_requests r where m.request_id=p_request and r.id=m.request_id
    and (m.state='pending' or (m.state='sending' and m.leased_until<now()))
    and (m.kind in ('owner','paid_owner','payment_issue') or m.kind=r.status or (m.kind='expired' and r.status='expired')) returning m.*;
end $$;
revoke all on function public.booking_invoice_prepare(uuid,timestamptz),public.booking_invoice_attach(uuid,text,text,text,text),public.booking_invoice_paid(uuid,text,integer,integer,text,text,timestamptz),public.booking_invoice_voided(uuid,text) from public,anon,authenticated;
grant execute on function public.booking_invoice_prepare(uuid,timestamptz),public.booking_invoice_attach(uuid,text,text,text,text),public.booking_invoice_paid(uuid,text,integer,integer,text,text,timestamptz),public.booking_invoice_voided(uuid,text) to service_role;
create or replace function public.booking_available() returns table(id uuid,starts_at timestamptz,ends_at timestamptz)
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
  and not exists(select 1 from booking_requests r join booking_slots b on b.id=r.slot_id where r.status in ('awaiting_payment','approved')
    and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(t.starts_at,t.ends_at,'[)'))
  order by t.starts_at;
$$;

create or replace function public.booking_slot(p_start timestamptz default null,p_end timestamptz default null,p_slot uuid default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare s booking_slots;
begin
  perform pg_advisory_xact_lock(80261025);
  if p_slot is not null then
    if exists(select 1 from booking_requests where slot_id=p_slot and status in ('approved','awaiting_payment')) then raise exception 'Cancel the approved appointment before removing this time.'; end if;
    update booking_slots set state='blocked' where id=p_slot returning * into s;
    if not found then raise exception 'Time not found.'; end if;
  else
    if p_start is null or p_end is null or p_start<=now() or p_start>now()+interval '180 days' then raise exception 'Choose a future time within 180 days.'; end if;
    insert into booking_slots(starts_at,ends_at) values(p_start,p_end) returning * into s;
  end if;
  return to_jsonb(s);
end $$;

create or replace function public.booking_block(p_start timestamptz,p_end timestamptz) returns jsonb
language plpgsql security definer set search_path=public as $$
declare s booking_slots;
begin
  perform pg_advisory_xact_lock(80261025);
  if p_start is null or p_end<>p_start+interval '1 hour' or p_start<=now() then raise exception 'Choose a future one-hour time.'; end if;
  if exists(select 1 from booking_requests r join booking_slots b on b.id=r.slot_id where r.status in ('approved','awaiting_payment') and tstzrange(b.starts_at,b.ends_at,'[)')&&tstzrange(p_start,p_end,'[)')) then raise exception 'Cancel the approved appointment before closing its time.'; end if;
  select * into s from booking_slots where starts_at=p_start and ends_at=p_end;
  if found then update booking_slots set state='blocked' where id=s.id returning * into s;
  else insert into booking_slots(id,starts_at,ends_at,state) values(booking_regular_id(p_start),p_start,p_end,'blocked') returning * into s;
  end if;
  return to_jsonb(s);
end $$;

create function public.booking_invoice_attention(p_request uuid) returns void
language sql security definer set search_path=public as $$
  insert into booking_mail(request_id,kind) values(p_request,'payment_issue') on conflict do nothing;
$$;
revoke all on function public.booking_invoice_attention(uuid) from public,anon,authenticated;
grant execute on function public.booking_invoice_attention(uuid) to service_role;

commit;
