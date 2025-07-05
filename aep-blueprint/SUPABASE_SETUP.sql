-- ===================================================================
-- AEP Blueprint Database Setup - Run this in Supabase SQL Editor
-- ===================================================================

-- Step 1: Create the progress tracking views
-- These views calculate completion progress for sections and the overall document

-- Section-level progress view
CREATE OR REPLACE VIEW public.v_section_progress AS
SELECT
  q.section_id,
  COALESCE(
    COUNT(*) FILTER (WHERE a.status = 'final') * 1.0
    + COUNT(*) FILTER (WHERE a.status = 'draft') * 0.5,
    0
  ) as score,
  COUNT(q.id) as total
FROM public.questions q
LEFT JOIN public.answers a ON a.question_id = q.id
GROUP BY q.section_id;

-- Document-level progress view  
CREATE OR REPLACE VIEW public.v_doc_progress AS
SELECT
  COALESCE(
    COUNT(*) FILTER (WHERE a.status = 'final') * 1.0
    + COUNT(*) FILTER (WHERE a.status = 'draft') * 0.5,
    0
  ) as score,
  COUNT(q.id) as total
FROM public.questions q
LEFT JOIN public.answers a ON a.question_id = q.id;

-- Step 2: Grant proper permissions
GRANT SELECT ON public.v_section_progress TO authenticated;
GRANT SELECT ON public.v_doc_progress TO authenticated;

-- Step 3: Add enhanced content columns to answers table (if not already added)
ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'text';

ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS media_urls TEXT[];

ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS chart_config JSONB;

ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS interactive_data JSONB;

-- Step 4: Create media files table for enhanced content
CREATE TABLE IF NOT EXISTS public.media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID REFERENCES public.answers(question_id) ON DELETE CASCADE,
    file_type VARCHAR(50), -- 'image', 'video', 'document', 'chart_data'
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create chart data table for data visualizations
CREATE TABLE IF NOT EXISTS public.chart_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID REFERENCES public.answers(question_id) ON DELETE CASCADE,
    chart_type VARCHAR(50), -- 'pie', 'bar', 'line', 'scatter', etc.
    chart_config JSONB, -- Chart.js configuration
    data_source VARCHAR(100), -- 'manual', 'supabase_query', 'external_api'
    query_config JSONB, -- For dynamic data sources
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Enable RLS on new tables
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_data ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for media files
CREATE POLICY "read_media_files" ON public.media_files 
FOR SELECT USING (true);

CREATE POLICY "write_own_media_files" ON public.media_files 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.answers a 
        WHERE a.question_id = answer_id 
        AND a.updated_by = auth.uid()
    )
);

-- Step 8: Create RLS policies for chart data
CREATE POLICY "read_chart_data" ON public.chart_data 
FOR SELECT USING (true);

CREATE POLICY "write_own_chart_data" ON public.chart_data 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.answers a 
        WHERE a.question_id = answer_id 
        AND a.updated_by = auth.uid()
    )
);

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_files_answer_id ON public.media_files(answer_id);
CREATE INDEX IF NOT EXISTS idx_chart_data_answer_id ON public.chart_data(answer_id);
CREATE INDEX IF NOT EXISTS idx_answers_content_type ON public.answers(content_type);

-- Step 10: Verify setup with test queries
-- Run these separately to verify everything is working:

-- Test the views:
-- SELECT * FROM public.v_section_progress LIMIT 5;
-- SELECT * FROM public.v_doc_progress;

-- Test the enhanced columns:
-- SELECT content_type, media_urls, chart_config FROM public.answers LIMIT 5;

-- ===================================================================
-- Instructions:
-- 1. Copy this entire SQL script
-- 2. Go to your Supabase dashboard: https://supabase.com/dashboard
-- 3. Navigate to your project > SQL Editor
-- 4. Paste this script and click "Run"
-- 5. Verify no errors appear
-- 6. Return to your app and test again
-- ===================================================================