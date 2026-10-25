-- Run inside a transaction and ROLLBACK. No mail is sent by these database tests.
do $$
declare s jsonb; r1 jsonb; r2 jsonb; blocked jsonb; count_mail integer;
begin
  s := public.booking_slot(date_trunc('day',now())+interval '30 days 14 hours',date_trunc('day',now())+interval '30 days 15 hours');
  begin
    perform public.booking_slot((s->>'starts_at')::timestamptz+interval '30 minutes',(s->>'ends_at')::timestamptz+interval '30 minutes');
    raise exception 'TEST FAILED: overlapping slots accepted';
  exception when exclusion_violation then null;
  end;
  r1 := public.booking_request((s->>'id')::uuid,gen_random_uuid(),'{"email":"booking-test@example.invalid","name":"Test","dogName":"Test"}');
  r2 := public.booking_request((s->>'id')::uuid,gen_random_uuid(),'{"email":"booking-test@example.invalid","name":"Test 2"}');
  if (public.booking_request((s->>'id')::uuid,(r1->>'submission_id')::uuid,'{}')->>'id')<>r1->>'id' then raise exception 'TEST FAILED: duplicate submission'; end if;
  perform public.booking_decide((r1->>'id')::uuid,'approved');
  begin
    perform public.booking_decide((r2->>'id')::uuid,'approved');
    raise exception 'TEST FAILED: double booking';
  exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if;
  end;
  begin
    perform public.booking_request((s->>'id')::uuid,gen_random_uuid(),'{"email":"test@example.invalid"}');
    raise exception 'TEST FAILED: reserved time accepted a request';
  exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if;
  end;
  begin
    perform public.booking_slot(p_slot=>(s->>'id')::uuid);
    raise exception 'TEST FAILED: approved time removed';
  exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if;
  end;
  perform public.booking_claim_mail((r1->>'id')::uuid);
  select count(*) into count_mail from public.booking_claim_mail((r1->>'id')::uuid);
  if count_mail<>0 then raise exception 'TEST FAILED: notification leased twice'; end if;
  begin
    perform public.booking_decide((r1->>'id')::uuid,'cancelled');
    raise exception 'TEST FAILED: status changed during email send';
  exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if;
  end;
  update public.booking_mail set state='sent',leased_until=null where request_id=(r1->>'id')::uuid;
  perform public.booking_decide((r1->>'id')::uuid,'cancelled');
  perform public.booking_decide((r2->>'id')::uuid,'approved');
  perform public.booking_decide((r2->>'id')::uuid,'cancelled');
  perform public.booking_slot(p_slot=>(s->>'id')::uuid);
  begin
    perform public.booking_request((s->>'id')::uuid,gen_random_uuid(),'{"email":"test@example.invalid"}');
    raise exception 'TEST FAILED: blocked time accepted a request';
  exception when raise_exception then if sqlerrm like 'TEST FAILED:%' then raise; end if;
  end;
  if has_function_privilege('anon','public.booking_request(uuid,uuid,jsonb)','execute') then raise exception 'TEST FAILED: anonymous RPC access'; end if;
  if has_table_privilege('authenticated','public.booking_requests','select') then raise exception 'TEST FAILED: non-admin data access'; end if;
end $$;
