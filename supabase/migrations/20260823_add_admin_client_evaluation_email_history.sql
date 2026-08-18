-- Minimal audit history for explicit admin-sent client evaluation emails.
create table if not exists public.admin_dog_evaluation_email_sends (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.admin_dog_evaluations(id) on delete cascade,
  recipient_email text not null,
  sent_by_clerk_user_id text not null,
  included_trainer_notes boolean not null default false,
  pdf_attached boolean not null default false,
  sent_at timestamptz not null default now()
);

create index if not exists admin_dog_evaluation_email_sends_evaluation_idx
  on public.admin_dog_evaluation_email_sends (evaluation_id, sent_at desc);

alter table public.admin_dog_evaluation_email_sends enable row level security;
