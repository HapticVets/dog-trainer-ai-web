-- Phase 5A: explicit, private-by-default publication layer for kennel records.
alter table public.admin_litters
  add column if not exists is_public boolean not null default false,
  add column if not exists public_slug text,
  add column if not exists public_title text,
  add column if not exists public_summary text,
  add column if not exists public_status text,
  add column if not exists public_updated_at timestamptz;

create unique index if not exists admin_litters_public_slug_unique
  on public.admin_litters (public_slug)
  where public_slug is not null;

alter table public.admin_litter_puppies
  add column if not exists is_public boolean not null default false,
  add column if not exists public_name text,
  add column if not exists public_summary text,
  add column if not exists public_status text,
  add column if not exists public_price numeric,
  add column if not exists public_color text,
  add column if not exists public_updated_at timestamptz;

alter table public.admin_puppy_media
  add column if not exists is_public boolean not null default false,
  add column if not exists public_caption text,
  add column if not exists is_public_primary boolean not null default false,
  add column if not exists public_updated_at timestamptz;

create unique index if not exists admin_puppy_media_public_primary_unique
  on public.admin_puppy_media (puppy_id)
  where is_public_primary = true;

create table if not exists public.admin_puppy_public_development_summaries (
  id uuid primary key default gen_random_uuid(),
  puppy_id uuid not null references public.admin_litter_puppies(id) on delete cascade,
  development_week integer not null check (development_week > 0),
  summary text not null check (char_length(trim(summary)) > 0),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_puppy_public_development_summaries_public_idx
  on public.admin_puppy_public_development_summaries (puppy_id, development_week desc)
  where is_public = true;

alter table public.admin_puppy_public_development_summaries enable row level security;
