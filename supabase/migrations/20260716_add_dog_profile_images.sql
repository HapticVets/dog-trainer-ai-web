-- Private, server-mediated storage for dog profile photos.
alter table public.dog_profiles
  add column if not exists profile_image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dog-profile-images',
  'dog-profile-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- No client storage policies are created intentionally. The application uses the
-- service-role client only after verifying Clerk ownership of dog_profiles rows.
