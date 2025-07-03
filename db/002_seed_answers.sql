-- Seed all questions from the AEP document
-- Note: There are 16 questions total, not 14 as originally specified
insert into public.answers (id) values
  -- Section 1: Performance Standards & Measurement
  ('customer-success-definition'),
  ('performance-ownership'),
  ('validation-methods'),
  
  -- Section 2: Configuration & Customer Experience  
  ('configuration-simplification'),
  ('feedback-mechanisms'),
  ('planning-tools'),
  
  -- Section 3: Monitoring & Proactive Intervention
  ('intervention-strategy'),
  ('monitoring-granularity'),
  ('response-model'),
  
  -- Section 4: Responsibility & Ownership Framework
  ('customer-ownership'),
  ('carbon-ownership'),
  ('shared-ownership'),
  ('accountability'),
  
  -- Section 5: Technical Implementation & Team Structure
  ('development-priorities')
on conflict (id) do nothing;