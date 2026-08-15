create table if not exists public.admin_puppy_media (
  id uuid primary key default gen_random_uuid(),
  puppy_id uuid not null,
  litter_id uuid not null,
  evaluation_id uuid null,
  media_type text not null check (media_type in ('photo', 'video')),
  storage_path text not null unique,
  thumbnail_path text null,
  development_week integer null check (development_week > 0),
  captured_at timestamptz not null default now(),
  caption text null,
  category text null check (category in ('growth', 'training', 'environmental', 'engagement', 'handling', 'play', 'crate', 'other')),
  uploaded_by_clerk_user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_puppy_media_puppy_week_idx
  on public.admin_puppy_media (puppy_id, development_week desc, captured_at desc);
create index if not exists admin_puppy_media_litter_idx
  on public.admin_puppy_media (litter_id, created_at desc);

alter table public.admin_puppy_media enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'puppy-development-media',
  'puppy-development-media',
  false,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set public = false,
    file_size_limit = 104857600,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

-- No public or client storage policies: all access is mediated by protected admin routes.
