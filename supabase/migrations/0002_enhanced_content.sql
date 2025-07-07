-- Sprint 2: Enhanced Content System

-- First, create the missing progress views
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

-- Enhanced content storage
alter table public.answers add column if not exists content_type varchar(50) default 'text';
alter table public.answers add column if not exists media_urls text[];
alter table public.answers add column if not exists chart_config jsonb;
alter table public.answers add column if not exists interactive_data jsonb;

-- Media files table
create table if not exists public.media_files (
    id uuid primary key default gen_random_uuid(),
    answer_id uuid references public.answers(question_id) on delete cascade,
    file_type varchar(50), -- 'image', 'video', 'document', 'chart_data'
    file_url text,
    file_name text,
    file_size bigint,
    mime_type varchar(100),
    created_at timestamptz default now()
);

-- Chart data table
create table if not exists public.chart_data (
    id uuid primary key default gen_random_uuid(),
    answer_id uuid references public.answers(question_id) on delete cascade,
    chart_type varchar(50), -- 'pie', 'bar', 'line', 'scatter', etc.
    chart_config jsonb, -- Chart.js configuration
    data_source varchar(100), -- 'manual', 'supabase_query', 'external_api'
    query_config jsonb, -- For dynamic data sources
    created_at timestamptz default now()
);

-- Enable RLS on new tables
alter table public.media_files enable row level security;
alter table public.chart_data enable row level security;

-- RLS policies for media files
create policy "read media files" on public.media_files for select using (true);
create policy "write own media files" on public.media_files for all using (
    exists (
        select 1 from public.answers a 
        where a.question_id = answer_id 
        and a.updated_by = auth.uid()
    )
);

-- RLS policies for chart data
create policy "read chart data" on public.chart_data for select using (true);
create policy "write own chart data" on public.chart_data for all using (
    exists (
        select 1 from public.answers a 
        where a.question_id = answer_id 
        and a.updated_by = auth.uid()
    )
);

-- Indexes for performance
create index if not exists idx_media_files_answer_id on public.media_files(answer_id);
create index if not exists idx_chart_data_answer_id on public.chart_data(answer_id);
create index if not exists idx_answers_content_type on public.answers(content_type);