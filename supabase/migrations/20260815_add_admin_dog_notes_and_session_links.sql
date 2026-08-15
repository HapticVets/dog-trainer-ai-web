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

-- Existing session logs remain intact. New logs can safely be associated with a
-- specific dog profile instead of relying on a potentially non-unique dog name.
alter table public.session_logs
  add column if not exists dog_profile_id text;

create index if not exists session_logs_dog_profile_created_at_idx
  on public.session_logs (dog_profile_id, created_at desc)
  where dog_profile_id is not null;
