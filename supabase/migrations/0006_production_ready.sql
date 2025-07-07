-- Production-Ready Multi-User Setup
-- This migration fixes RLS policies and adds user management for production deployment

-- Create users profile table for team management
create table if not exists public.user_profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    role text check (role in ('admin', 'editor', 'viewer')) default 'editor',
    team text default 'aep', -- For future team segregation if needed
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS on user profiles
alter table public.user_profiles enable row level security;

-- RLS Policies for user profiles
create policy "users can view all team profiles" 
on public.user_profiles for select 
using (auth.jwt() ->> 'email' like '%@carbonrobotics.com');

create policy "users can update own profile" 
on public.user_profiles for update 
using (auth.uid() = id);

-- Create function to auto-create user profile on first login
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    case 
      when new.email = 'bryson@carbonrobotics.com' then 'admin'
      else 'editor'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update existing answer RLS policies to use user profiles for role checking
drop policy if exists "write own answers" on public.answers;
create policy "write answers based on role"
on public.answers
for all
using (
  exists (
    select 1 from public.user_profiles up 
    where up.id = auth.uid() 
    and up.role in ('admin', 'editor')
  )
);

-- Add admin policies for sections and questions management
-- Admins can modify sections
drop policy if exists "admin can modify sections" on public.sections;
create policy "admin can modify sections"
on public.sections
for all
using (
  exists (
    select 1 from public.user_profiles up 
    where up.id = auth.uid() 
    and up.role = 'admin'
  )
);

-- Admins can modify questions
drop policy if exists "admin can modify questions" on public.questions;
create policy "admin can modify questions"
on public.questions
for all
using (
  exists (
    select 1 from public.user_profiles up 
    where up.id = auth.uid() 
    and up.role = 'admin'
  )
);

-- Allow editors to create new questions within existing sections
create policy "editors can add questions"
on public.questions
for insert
with check (
  exists (
    select 1 from public.user_profiles up 
    where up.id = auth.uid() 
    and up.role in ('admin', 'editor')
  )
);

-- Update answer tracking to include user info
alter table public.answers 
add column if not exists created_by uuid references public.user_profiles(id),
add column if not exists created_at timestamptz default now();

-- Update answer history to track user info
alter table public.answer_history 
add column if not exists user_email text;

-- Update the history trigger to capture user email
create or replace function public.log_answer_history()
returns trigger as $$
begin
  insert into public.answer_history (question_id, content, status, updated_by, user_email)
  values (
    new.question_id, 
    new.content, 
    new.status, 
    new.updated_by,
    (select email from public.user_profiles where id = new.updated_by)
  );
  return new;
end;
$$ language plpgsql;

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- Ensure all new tables have proper RLS policies for media and chart data
drop policy if exists "write own media files" on public.media_files;
create policy "editors can manage media files"
on public.media_files
for all
using (
  exists (
    select 1 from public.user_profiles up 
    where up.id = auth.uid() 
    and up.role in ('admin', 'editor')
  )
);

drop policy if exists "write own chart data" on public.chart_data;
create policy "editors can manage chart data"
on public.chart_data
for all
using (
  exists (
    select 1 from public.user_profiles up 
    where up.id = auth.uid() 
    and up.role in ('admin', 'editor')
  )
);

-- Create admin view for user management
create or replace view public.v_user_management as
select 
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.team,
  up.created_at,
  up.updated_at,
  au.last_sign_in_at,
  au.email_confirmed_at
from public.user_profiles up
left join auth.users au on au.id = up.id
order by up.created_at desc;

-- Grant access to the user management view for admins only
create policy "admins can view user management"
on public.user_profiles for select
using (
  exists (
    select 1 from public.user_profiles admin_up 
    where admin_up.id = auth.uid() 
    and admin_up.role = 'admin'
  )
);

-- Comment on the approach
comment on table public.user_profiles is 'User profiles for role-based access control in the AEP Blueprint system. This is a shared document system where all team members can see the same content but have different editing permissions based on their role.';