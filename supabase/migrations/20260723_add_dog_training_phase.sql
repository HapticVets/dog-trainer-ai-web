create table if not exists public.dog_training_phase (
  id uuid primary key default gen_random_uuid(),
  dog_id text not null unique,
  phase_key text,
  phase_title text,
  phase_description text,
  current_objective text,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  estimated_time_remaining text,
  graduation_requirements jsonb not null default '[]'::jsonb,
  next_phase_key text,
  next_phase_title text,
  next_phase_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dog_training_phase_dog_id_idx
  on public.dog_training_phase (dog_id);

-- Phase records are accessed only through authenticated server routes that
-- verify Clerk ownership of the corresponding dog_profiles record.
alter table public.dog_training_phase enable row level security;
