-- Sprint 2 Required Patches

-- 1. Set default auth.uid() for answers.updated_by (if not already set)
alter table public.answers 
  alter column updated_by set default auth.uid();

-- 2. Add missing admin read policy for answer_history
create policy "admin read history"
  on public.answer_history for select
  using (exists (select 1
                 from auth.users u
                 where u.id = auth.uid()
                   and 'admin' = any(u.raw_user_meta_data->'roles')));

-- 3. Update progress views to include percent calculation
create or replace view public.v_section_progress as
select
  section_id,
  score,
  total,
  case 
    when total = 0 then 0
    else round(score / total * 100)::int
  end as percent
from (
  select
    q.section_id,
    count(*) filter (where a.status = 'final') * 1.0
      + count(*) filter (where a.status = 'draft') * 0.5
      as score,
    count(*) as total
  from questions q
  left join answers a on a.question_id = q.id
  group by q.section_id
) s;

create or replace view public.v_doc_progress as
select
  score,
  total,
  case 
    when total = 0 then 0
    else round(score / total * 100)::int
  end as percent
from (
  select
    count(*) filter (where a.status = 'final') * 1.0
      + count(*) filter (where a.status = 'draft') * 0.5
      as score,
    count(*) as total
  from questions q
  left join answers a on a.question_id = q.id
) s;

-- 4. Update role enforcement for editor/admin consistency
-- First drop the old policy
drop policy if exists "write own answers" on public.answers;

-- Create new policy supporting both editor and admin roles
create policy "write answers (editor,admin)"
  on public.answers
  for insert, update
  with check (
    auth.uid() = updated_by
    and (
      'editor' = any(coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '{}')::text[])
      or 'admin' = any(coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '{}')::text[])
    )
  );

-- 5. Create Supabase Storage bucket for images (this needs to be done via Dashboard)
-- Bucket name: aep-media
-- Public read access enabled
-- RLS policy for authenticated uploads