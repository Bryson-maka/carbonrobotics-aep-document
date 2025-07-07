// Database types - single source of truth
// These should ideally be generated from Supabase schema

export interface DatabaseSection {
  id: string;
  title: string;
  description: string | null;
  order_idx: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseQuestion {
  id: string;
  section_id: string;
  prompt: string;
  order_idx: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAnswer {
  id: string;
  question_id: string;
  content: string | null;
  status: 'draft' | 'final';
  content_type: 'text' | 'chart' | 'media' | 'interactive';
  chart_config: Record<string, unknown> | null;
  media_urls: string[] | null;
  interactive_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Domain types - what the app uses
export interface Section extends Omit<DatabaseSection, 'created_at' | 'updated_at'> {
  questions?: Question[];
}

export interface Question extends Omit<DatabaseQuestion, 'created_at' | 'updated_at'> {
  answers?: Answer[];
}

export interface Answer extends Omit<DatabaseAnswer, 'created_at' | 'updated_at' | 'content' | 'chart_config' | 'interactive_data'> {
  content: Record<string, unknown> | null;
  chart_config: Record<string, unknown> | null;
  interactive_data: Record<string, unknown> | null;
}

// API Input types
export interface CreateSectionInput {
  title: string;
  description?: string;
  order_idx?: number;
  [key: string]: unknown;
}

export interface UpdateSectionInput {
  title?: string;
  description?: string;
  order_idx?: number;
  [key: string]: unknown;
}

export interface CreateQuestionInput {
  section_id: string;
  prompt: string;
  order_idx?: number;
  [key: string]: unknown;
}

export interface UpdateQuestionInput {
  prompt?: string;
  order_idx?: number;
  [key: string]: unknown;
}

// Service response types
export interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}