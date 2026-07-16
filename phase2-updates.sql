-- Phase 2 Supabase Schema Updates

-- Add columns to blogs
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS readability_score DECIMAL DEFAULT 0.0;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS keyword_density DECIMAL DEFAULT 0.0;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

-- Add columns to seo_pages
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS readability_score DECIMAL DEFAULT 0.0;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS keyword_density DECIMAL DEFAULT 0.0;

-- Create seo_audits table
CREATE TABLE IF NOT EXISTS public.seo_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'running',
  total_pages INTEGER DEFAULT 0,
  issues_found INTEGER DEFAULT 0,
  report_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
