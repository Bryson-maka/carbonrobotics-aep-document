-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Sections
create table public.sections (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    order_idx int not null,
    created_at timestamptz default now()
);

-- Questions
create table public.questions (
    id uuid primary key default gen_random_uuid(),
    section_id uuid references public.sections on delete cascade,
    prompt text not null,
    order_idx int not null,
    created_at timestamptz default now()
);

-- Answers
create table public.answers (
    question_id uuid primary key references public.questions on delete cascade,
    content jsonb,
    status text check (status in ('draft','final')) default 'draft',
    updated_by uuid,
    updated_at timestamptz default now()
);

-- History
create table public.answer_history (
    id uuid primary key default gen_random_uuid(),
    question_id uuid references public.questions on delete cascade,
    content jsonb,
    status text,
    updated_by uuid,
    changed_at timestamptz default now()
);

-- Indexes for sorting
create index sections_order_idx on public.sections(order_idx);
create index questions_order_idx on public.questions(section_id, order_idx);

-- Trigger function
create or replace function public.log_answer_history()
returns trigger as $$
begin
  insert into public.answer_history (question_id, content, status, updated_by)
  values (new.question_id, new.content, new.status, new.updated_by);
  return new;
end;
$$ language plpgsql;

create trigger trg_answers_history
after insert or update on public.answers
for each row execute function public.log_answer_history();

-- Enable RLS
alter table public.sections enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.answer_history enable row level security;

-- RLS Policies
-- SECTIONS & QUESTIONS (read-only)
create policy "read sections" on public.sections for select using (true);
create policy "read questions" on public.questions for select using (true);

-- ANSWERS
create policy "read answers" on public.answers for select using (true);
create policy "write own answers"
  on public.answers
  for insert, update
  with check (auth.uid() = updated_by);

-- ANSWER HISTORY
create policy "history insert via trigger"
  on public.answer_history
  for insert
  with check (true);