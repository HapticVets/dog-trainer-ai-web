create table if not exists public.promotional_trial_feedback (
  id uuid primary key default gen_random_uuid(),
  promotional_trial_code_id uuid not null references public.promotional_trial_codes(id) on delete cascade,
  clerk_user_id text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (promotional_trial_code_id, clerk_user_id)
);

alter table public.promotional_trial_feedback enable row level security;
