create table if not exists public.admin_litters (
  id uuid primary key default gen_random_uuid(), litter_code text not null unique, name text not null,
  sire_dog_id text, dam_dog_id text, breeding_date date, estimated_due_date date, birth_date date, expected_go_home_date date,
  status text not null default 'planned' check (status in ('planned','bred','pregnancy_confirmed','born','raising','ready','completed')),
  breeder_notes text, created_by_clerk_user_id text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.admin_litter_puppies (
  id uuid primary key default gen_random_uuid(), litter_id uuid not null, puppy_code text not null unique, temporary_name text,
  collar_color text, sex text, color text, coat text, birth_weight numeric, birth_weight_unit text check (birth_weight_unit in ('oz','lb')),
  status text not null default 'available' check (status in ('available','reserved','retained','sold','placed','evaluation_hold')),
  breeder_notes text, profile_image_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.admin_puppy_weights (
  id uuid primary key default gen_random_uuid(), puppy_id uuid not null, weight numeric not null, unit text not null check (unit in ('oz','lb')),
  recorded_at timestamptz not null default now(), recorded_by_clerk_user_id text not null
);
create table if not exists public.admin_puppy_notes (
  id uuid primary key default gen_random_uuid(), puppy_id uuid not null, note text not null check (char_length(trim(note)) > 0),
  created_by_clerk_user_id text not null, created_at timestamptz not null default now()
);
create index if not exists admin_litter_puppies_litter_idx on public.admin_litter_puppies (litter_id, puppy_code);
create index if not exists admin_puppy_weights_puppy_idx on public.admin_puppy_weights (puppy_id, recorded_at desc);
create index if not exists admin_puppy_notes_puppy_idx on public.admin_puppy_notes (puppy_id, created_at desc);
alter table public.admin_litters enable row level security;
alter table public.admin_litter_puppies enable row level security;
alter table public.admin_puppy_weights enable row level security;
alter table public.admin_puppy_notes enable row level security;
