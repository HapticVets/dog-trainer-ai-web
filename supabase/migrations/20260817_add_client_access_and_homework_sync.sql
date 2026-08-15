-- Links internal Client Dog records to customer-owned trainer profiles.
create table if not exists public.admin_client_dog_links (
  id uuid primary key default gen_random_uuid(),
  admin_dog_id text not null unique,
  customer_clerk_user_id text not null,
  customer_dog_profile_id text unique,
  created_by_clerk_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_client_dog_links_customer_idx
  on public.admin_client_dog_links (customer_clerk_user_id);

alter table public.admin_client_dog_links enable row level security;

-- Only trainer-approved fields are copied into this customer-facing context.
create table if not exists public.client_homework_context (
  id uuid primary key default gen_random_uuid(),
  admin_dog_id text not null,
  customer_dog_profile_id text not null,
  source_admin_session_id uuid not null,
  homework_focus text not null check (char_length(trim(homework_focus)) > 0),
  homework_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists client_homework_context_active_dog_idx
  on public.client_homework_context (customer_dog_profile_id)
  where active;

create index if not exists client_homework_context_customer_dog_created_idx
  on public.client_homework_context (customer_dog_profile_id, created_at desc);

alter table public.client_homework_context enable row level security;
