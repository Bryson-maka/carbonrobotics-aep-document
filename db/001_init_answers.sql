-- One row per question in the live doc
create table if not exists public.answers (
  id         text primary key,                   -- e.g. 'customer-success-definition'
  text       text not null default '',
  status     text not null default 'unanswered', -- 'draft' | 'final' | 'unanswered'
  updated_at timestamptz default now(),
  updated_by uuid
);

-- Row-level security: any verified Carbon Robotics user can read/write
alter table public.answers enable row level security;

create policy "carbon users can edit"
on public.answers
for all
using ( auth.email() ilike '%@carbonrobotics.com' );