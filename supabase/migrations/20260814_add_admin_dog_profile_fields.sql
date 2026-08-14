-- Keeps existing customer profiles unchanged while allowing admin-owned internal records.
alter table public.dog_profiles
  add column if not exists record_type text,
  add column if not exists client_owner_name text,
  add column if not exists client_owner_email text,
  add column if not exists client_owner_phone text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dog_profiles_record_type_check'
  ) then
    alter table public.dog_profiles
      add constraint dog_profiles_record_type_check
      check (record_type is null or record_type in ('personal', 'client', 'breeding'));
  end if;
end $$;

create index if not exists dog_profiles_internal_record_type_idx
  on public.dog_profiles (clerk_user_id, record_type)
  where record_type is not null;
