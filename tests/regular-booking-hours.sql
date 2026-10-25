-- Execute alongside the new migration, inside a rollback transaction.
do $$
declare c record; r1 jsonb; r2 jsonb; saturday_count integer;
begin
  if exists(select 1 from booking_available() where extract(isodow from starts_at at time zone 'America/New_York')=7) then raise exception 'TEST FAILED: Sunday offered'; end if;
  if exists(select 1 from booking_available() where extract(isodow from starts_at at time zone 'America/New_York') between 1 and 5 and (extract(hour from starts_at at time zone 'America/New_York')<9 or extract(hour from ends_at at time zone 'America/New_York')>17)) then raise exception 'TEST FAILED: weekday hours'; end if;
  select count(*) into saturday_count from booking_available() where extract(isodow from starts_at at time zone 'America/New_York')=6;
  if saturday_count<3 then raise exception 'TEST FAILED: Saturday missing'; end if;
  if exists(select 1 from booking_available() where extract(isodow from starts_at at time zone 'America/New_York')=6 and (extract(hour from starts_at at time zone 'America/New_York')<10 or extract(hour from ends_at at time zone 'America/New_York')>13)) then raise exception 'TEST FAILED: Saturday hours'; end if;
  if exists(select 1 from booking_available() where starts_at<=now() or ends_at<>starts_at+interval '1 hour') then raise exception 'TEST FAILED: invalid appointment duration'; end if;
  select * into c from booking_available() limit 1;
  if c.id is null then raise exception 'TEST FAILED: regular times missing'; end if;
  if substring(c.id::text,15,1)<>'5' then raise exception 'TEST FAILED: stable UUID version'; end if;
  r1:=booking_request(c.id,gen_random_uuid(),'{"name":"Test","email":"booking-test@example.invalid"}');
  r2:=booking_request(c.id,gen_random_uuid(),'{"name":"Test 2","email":"booking-test@example.invalid"}');
  if not exists(select 1 from booking_available() where id=c.id) then raise exception 'TEST FAILED: pending request reserves time'; end if;
  perform booking_decide((r1->>'id')::uuid,'approved');
  if exists(select 1 from booking_available() where id=c.id) then raise exception 'TEST FAILED: approved time still offered'; end if;
  begin
    perform booking_decide((r2->>'id')::uuid,'approved');
    raise exception 'TEST FAILED: double approval';
  exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if; end;
  begin
    perform booking_request(c.id,gen_random_uuid(),'{"email":"test@example.invalid"}');
    raise exception 'TEST FAILED: stale time accepted';
  exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if; end;
  perform booking_decide((r1->>'id')::uuid,'cancelled');
  if not exists(select 1 from booking_available() where id=c.id) then raise exception 'TEST FAILED: cancellation did not free time'; end if;
  perform booking_block(c.starts_at,c.ends_at);
  if exists(select 1 from booking_available() where id=c.id) then raise exception 'TEST FAILED: closed time offered'; end if;
  if has_function_privilege('anon','public.booking_available()','execute') or has_table_privilege('authenticated','public.booking_hours','select') then raise exception 'TEST FAILED: permissions'; end if;
end $$;
