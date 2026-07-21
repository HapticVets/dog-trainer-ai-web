create table if not exists public.dog_timeline_events (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  dog_id text not null,
  event_type text not null check (
    event_type in (
      'profile_created',
      'session_logged',
      'goal_updated',
      'consistency_update',
      'assessment_completed',
      'phase_updated',
      'progress_update',
      'milestone_reached',
      'profile_updated'
    )
  ),
  title text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  source_type text,
  source_id text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists dog_timeline_events_dog_occurred_at_idx
  on public.dog_timeline_events (dog_id, occurred_at desc, id desc);

create index if not exists dog_timeline_events_user_dog_idx
  on public.dog_timeline_events (clerk_user_id, dog_id);

create index if not exists dog_timeline_events_source_idx
  on public.dog_timeline_events (source_type, source_id)
  where source_type is not null and source_id is not null;

create unique index if not exists dog_timeline_events_unique_source_event_idx
  on public.dog_timeline_events (dog_id, event_type, source_type, source_id)
  where source_type is not null and source_id is not null;

-- Timeline records are accessed only through authenticated server routes that
-- verify Clerk ownership. No browser-facing policies are required or created.
alter table public.dog_timeline_events enable row level security;
