-- Sprint 1 Follow-ups

-- 1. Set default auth.uid() for answers.updated_by
alter table public.answers alter column updated_by set default auth.uid();

-- 2. Add index for realtime merge speed
create index answers_question_id_updated_at_idx on public.answers (question_id, updated_at desc);

-- 3. Expose answer_history to Admins (read-only)
create policy "admin read history"
  on public.answer_history for select
  using (exists (select 1
                 from auth.users u
                 where u.id = auth.uid()
                   and 'admin' = any(u.raw_user_meta_data->'roles')));