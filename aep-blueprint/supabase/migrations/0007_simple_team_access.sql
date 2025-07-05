-- Simple Team Access Migration
-- All Carbon Robotics team members get full access to everything
-- No role management needed initially

-- Create basic user profiles table for tracking only
create table if not exists public.user_profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    created_at timestamptz default now(),
    last_seen timestamptz default now()
);

-- Enable RLS on user profiles
alter table public.user_profiles enable row level security;

-- Everyone can view all profiles (for future features like "who's online")
create policy "team can view all profiles" 
on public.user_profiles for select 
using (auth.jwt() ->> 'email' like '%@carbonrobotics.com');

-- Users can update their own profile
create policy "users can update own profile" 
on public.user_profiles for update 
using (auth.uid() = id);

-- Create function to auto-create user profile on first login
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update RLS policies for universal team access
-- Remove any existing restrictive policies

-- SECTIONS: All team members can do everything
drop policy if exists "read sections" on public.sections;
drop policy if exists "admin can modify sections" on public.sections;
create policy "team full access sections"
on public.sections
for all
using (auth.jwt() ->> 'email' like '%@carbonrobotics.com');

-- QUESTIONS: All team members can do everything  
drop policy if exists "read questions" on public.questions;
drop policy if exists "admin can modify questions" on public.questions;
drop policy if exists "editors can add questions" on public.questions;
create policy "team full access questions"
on public.questions
for all
using (auth.jwt() ->> 'email' like '%@carbonrobotics.com');

-- ANSWERS: All team members can do everything
drop policy if exists "read answers" on public.answers;
drop policy if exists "write own answers" on public.answers;
drop policy if exists "write answers based on role" on public.answers;
create policy "team full access answers"
on public.answers
for all
using (auth.jwt() ->> 'email' like '%@carbonrobotics.com');

-- ANSWER HISTORY: Read access for all team members
drop policy if exists "history insert via trigger" on public.answer_history;
drop policy if exists "admin read history" on public.answer_history;
create policy "team can read history"
on public.answer_history
for select
using (auth.jwt() ->> 'email' like '%@carbonrobotics.com');

create policy "history insert via trigger"
on public.answer_history
for insert
with check (true);

-- MEDIA FILES: All team members can do everything
drop policy if exists "read media files" on public.media_files;
drop policy if exists "write own media files" on public.media_files;
drop policy if exists "editors can manage media files" on public.media_files;
create policy "team full access media"
on public.media_files
for all
using (auth.jwt() ->> 'email' like '%@carbonrobotics.com');

-- CHART DATA: All team members can do everything
drop policy if exists "read chart data" on public.chart_data;
drop policy if exists "write own chart data" on public.chart_data;
drop policy if exists "editors can manage chart data" on public.chart_data;
create policy "team full access charts"
on public.chart_data
for all
using (auth.jwt() ->> 'email' like '%@carbonrobotics.com');

-- Update answer tracking to include user info (simplified)
alter table public.answers 
add column if not exists created_by uuid references auth.users(id),
add column if not exists created_at timestamptz default now();

-- Update answer history to track user email
alter table public.answer_history 
add column if not exists user_email text;

-- Simplified history trigger that works with any user
create or replace function public.log_answer_history()
returns trigger as $$
begin
  insert into public.answer_history (question_id, content, status, updated_by, user_email)
  values (
    new.question_id, 
    new.content, 
    new.status, 
    new.updated_by,
    (select email from auth.users where id = new.updated_by)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- Update functions to set user tracking
create or replace function public.set_user_context()
returns trigger as $$
begin
  -- Set updated_by and created_by for answers
  if TG_TABLE_NAME = 'answers' then
    if TG_OP = 'INSERT' then
      new.created_by = auth.uid();
      new.created_at = now();
    end if;
    new.updated_by = auth.uid();
    new.updated_at = now();
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Apply user context trigger to answers
drop trigger if exists set_user_context_answers on public.answers;
create trigger set_user_context_answers
  before insert or update on public.answers
  for each row execute function public.set_user_context();

-- Update user profile last_seen on any activity
create or replace function public.update_last_seen()
returns trigger as $$
begin
  update public.user_profiles 
  set last_seen = now() 
  where id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

-- Apply last_seen trigger to main tables
drop trigger if exists update_last_seen_sections on public.sections;
create trigger update_last_seen_sections
  after insert or update on public.sections
  for each row execute function public.update_last_seen();

drop trigger if exists update_last_seen_questions on public.questions;  
create trigger update_last_seen_questions
  after insert or update on public.questions
  for each row execute function public.update_last_seen();

drop trigger if exists update_last_seen_answers on public.answers;
create trigger update_last_seen_answers
  after insert or update on public.answers
  for each row execute function public.update_last_seen();

-- Simple view for team activity (useful for later)
create or replace view public.v_team_activity as
select 
  up.email,
  up.full_name,
  up.created_at as joined_at,
  up.last_seen,
  case 
    when up.last_seen > now() - interval '5 minutes' then 'online'
    when up.last_seen > now() - interval '1 hour' then 'recently_active'
    else 'offline'
  end as status
from public.user_profiles up
order by up.last_seen desc;

-- Grant access to team activity view
grant select on public.v_team_activity to authenticated;

comment on table public.user_profiles is 'Simple user tracking for Carbon Robotics AEP team. All team members have full access to all content.';