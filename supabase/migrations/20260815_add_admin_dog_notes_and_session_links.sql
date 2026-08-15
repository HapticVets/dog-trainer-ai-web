-- Internal trainer notes for shared Patriot K9 admin case files.
create table if not exists public.admin_dog_notes (
  id uuid primary key default gen_random_uuid(),
  dog_id text not null,
  created_by_clerk_user_id text not null,
  note text not null check (char_length(trim(note)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_dog_notes_dog_created_at_idx
  on public.admin_dog_notes (dog_id, created_at desc);

alter table public.admin_dog_notes enable row level security;

create table if not exists public.admin_training_sessions (
  id uuid primary key default gen_random_uuid(),
  dog_id text not null,
  created_by_clerk_user_id text not null,
  session_number integer not null check (session_number > 0),
  title text not null,
  status text not null default 'planned' check (status in ('draft', 'planned', 'completed')),
  objectives text not null default '',
  training_plan text not null default '',
  trainer_focus text,
  progression_goal text,
  what_went_well text,
  challenges text,
  recovery_notes text,
  homework text,
  additional_notes text,
  outcome text check (outcome in ('strong', 'improving', 'needs_work', 'regression_concern')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists admin_training_sessions_dog_session_number_idx
  on public.admin_training_sessions (dog_id, session_number);

create index if not exists admin_training_sessions_dog_status_created_at_idx
  on public.admin_training_sessions (dog_id, status, created_at desc);

alter table public.admin_training_sessions enable row level security;

-- Existing session logs remain intact. New logs can safely be associated with a
-- specific dog profile instead of relying on a potentially non-unique dog name.
alter table public.session_logs
  add column if not exists dog_profile_id text;

create index if not exists session_logs_dog_profile_created_at_idx
  on public.session_logs (dog_profile_id, created_at desc)
  where dog_profile_id is not null;
