-- Sprint 2: Progress tracking views

-- Section-level progress view
create or replace view public.v_section_progress as
select
  q.section_id,
  count(*) filter (where a.status = 'final') * 1.0
    + count(*) filter (where a.status = 'draft') * 0.5
    as score,
  count(*) as total
from questions q
left join answers a on a.question_id = q.id
group by q.section_id;

-- Document-level progress view
create or replace view public.v_doc_progress as
select
  count(*) filter (where a.status = 'final') * 1.0
    + count(*) filter (where a.status = 'draft') * 0.5
    as score,
  count(*) as total
from questions q
left join answers a on a.question_id = q.id;

-- Grant read access to views
grant select on public.v_section_progress to authenticated;
grant select on public.v_doc_progress to authenticated;