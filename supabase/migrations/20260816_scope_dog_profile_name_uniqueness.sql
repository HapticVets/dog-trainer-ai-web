-- The legacy unique index also applies to internal admin records. Keep the
-- customer safeguard while allowing personal, client, and breeding records to
-- use real-world duplicate dog names.
alter table public.dog_profiles
  drop constraint if exists idx_dog_profiles_user_name_unique;

drop index if exists public.idx_dog_profiles_user_name_unique;

create unique index if not exists dog_profiles_customer_user_name_unique_idx
  on public.dog_profiles (clerk_user_id, name)
  where record_type is null;
