-- Sprint 3: Admin tooling and additional functionality

-- Ensure foreign key constraints exist for proper cascading
-- (These should already exist from previous migrations, but adding for safety)

-- Add RLS policies for admin CRUD operations
create policy "admin can modify sections"
  on public.sections
  for all
  using (
    'admin' = any(coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '{}')::text[])
  );

create policy "admin can modify questions"
  on public.questions
  for all
  using (
    'admin' = any(coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '{}')::text[])
  );

-- Create batch update function for drag & drop ordering
create or replace function public.update_sections_order(section_updates jsonb)
returns void as $$
begin
  update public.sections
  set order_idx = (section_updates->sections.id->>'order_idx')::int
  from jsonb_each(section_updates) as sections(id, data)
  where sections.id = public.sections.id::text;
end;
$$ language plpgsql security definer;

create or replace function public.update_questions_order(question_updates jsonb)
returns void as $$
begin
  update public.questions
  set order_idx = (question_updates->questions.id->>'order_idx')::int
  from jsonb_each(question_updates) as questions(id, data)
  where questions.id = public.questions.id::text;
end;
$$ language plpgsql security definer;

-- Grant execute permissions to authenticated users
grant execute on function public.update_sections_order to authenticated;
grant execute on function public.update_questions_order to authenticated;