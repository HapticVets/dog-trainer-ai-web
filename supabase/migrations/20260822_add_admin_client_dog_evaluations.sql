-- Shared admin-only templates and immutable Client Dog evaluation records.
create table if not exists public.admin_evaluation_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  config jsonb not null default '{"sections": []}'::jsonb,
  is_archived boolean not null default false,
  created_by_clerk_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_evaluation_templates_active_idx
  on public.admin_evaluation_templates (is_archived, updated_at desc);

alter table public.admin_evaluation_templates enable row level security;

create table if not exists public.admin_dog_evaluations (
  id uuid primary key default gen_random_uuid(),
  dog_id text not null,
  template_id uuid references public.admin_evaluation_templates(id) on delete set null,
  template_name text,
  title text not null check (char_length(trim(title)) > 0),
  evaluation_date timestamptz not null default now(),
  evaluator_clerk_user_id text not null,
  config_snapshot jsonb not null default '{"sections": []}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  trainer_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_dog_evaluations_dog_date_idx
  on public.admin_dog_evaluations (dog_id, evaluation_date desc, created_at desc);

alter table public.admin_dog_evaluations enable row level security;
