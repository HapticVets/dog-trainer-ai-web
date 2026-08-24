create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null check (char_length(btrim(client_name)) between 1 and 120),
  dog_name text check (dog_name is null or char_length(btrim(dog_name)) <= 120),
  rating integer check (rating is null or rating between 1 and 5),
  testimonial text not null check (char_length(btrim(testimonial)) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_featured boolean not null default false,
  source text check (source is null or char_length(btrim(source)) <= 120),
  client_email text check (client_email is null or char_length(btrim(client_email)) <= 254),
  photo_path text,
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 2000),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_clerk_user_id text,
  updated_at timestamptz not null default now(),
  constraint testimonials_featured_only_when_approved check (not is_featured or status = 'approved')
);

create index if not exists testimonials_status_submitted_at_idx
  on public.testimonials (status, submitted_at desc);

create index if not exists testimonials_featured_submitted_at_idx
  on public.testimonials (is_featured, submitted_at desc)
  where is_featured = true;

alter table public.testimonials enable row level security;
