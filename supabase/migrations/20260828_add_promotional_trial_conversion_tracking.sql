create table if not exists public.promotional_trial_conversion_events (
  id uuid primary key default gen_random_uuid(),
  promotional_trial_code_id uuid not null references public.promotional_trial_codes(id) on delete cascade,
  clerk_user_id text not null,
  event_type text not null check (event_type in ('trial_upgrade_cta_clicked', 'trial_converted_to_premium')),
  stripe_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists promotional_trial_conversion_events_trial_created_at_idx
  on public.promotional_trial_conversion_events (promotional_trial_code_id, created_at desc);

create index if not exists promotional_trial_conversion_events_type_created_at_idx
  on public.promotional_trial_conversion_events (event_type, created_at desc);

create unique index if not exists promotional_trial_conversion_events_one_paid_conversion_per_trial
  on public.promotional_trial_conversion_events (promotional_trial_code_id)
  where event_type = 'trial_converted_to_premium';

alter table public.promotional_trial_conversion_events enable row level security;
