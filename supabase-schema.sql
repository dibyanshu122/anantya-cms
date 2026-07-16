-- ============================================================
-- ANANTYA CMS - COMPLETE SUPABASE SCHEMA (Phase 1)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full text search

-- ============================================================
-- 1. USER ROLES (extends Supabase Auth)
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE IF NOT EXISTS public.cms_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'editor',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. AUTHORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  bio TEXT,
  avatar_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. BLOG POSTS
-- ============================================================
CREATE TYPE blog_status AS ENUM ('draft', 'published', 'scheduled', 'archived');

CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT, -- HTML from TipTap editor
  
  -- Author
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  
  -- Status & Dates
  status blog_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Featured Image
  featured_image_url TEXT,
  featured_image_alt TEXT,
  featured_image_title TEXT,
  featured_image_caption TEXT,
  
  -- Blog Options
  is_featured BOOLEAN DEFAULT false,
  is_sticky BOOLEAN DEFAULT false,
  estimated_read_time INTEGER DEFAULT 0, -- in minutes
  
  -- SEO Fields (Module 1 + Module 2)
  seo_title TEXT,
  seo_description TEXT,
  focus_keyword TEXT,
  canonical_url TEXT,
  custom_slug TEXT,
  robots_index BOOLEAN DEFAULT true,
  robots_follow BOOLEAN DEFAULT true,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  twitter_card_image TEXT,
  breadcrumb_title TEXT,
  schema_type TEXT DEFAULT 'BlogPosting',
  
  -- SEO Score (calculated)
  seo_score INTEGER DEFAULT 0,
  
  -- Revision tracking
  revision_count INTEGER DEFAULT 0,
  
  -- Search
  search_vector TSVECTOR
);

-- Blog <-> Categories (many-to-many)
CREATE TABLE IF NOT EXISTS public.blog_categories (
  blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, category_id)
);

-- Blog <-> Tags (many-to-many)
CREATE TABLE IF NOT EXISTS public.blog_tags (
  blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, tag_id)
);

-- Blog Revisions (history)
CREATE TABLE IF NOT EXISTS public.blog_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  content TEXT,
  title TEXT,
  changed_by UUID REFERENCES public.cms_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5.5. BLOG COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'spam', 'trash'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. FAQ SECTION (per blog)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. PAGE-LEVEL SEO (Module 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Page Identity
  page_name TEXT NOT NULL, -- e.g. "WhatsApp Business API"
  page_path TEXT UNIQUE NOT NULL, -- e.g. /whatsapp-business-api
  
  -- SEO Fields
  seo_title TEXT,
  seo_description TEXT,
  focus_keyword TEXT,
  canonical_url TEXT,
  custom_slug TEXT,
  robots_index BOOLEAN DEFAULT true,
  robots_follow BOOLEAN DEFAULT true,
  
  -- Open Graph
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  
  -- Twitter Card
  twitter_card_image TEXT,
  
  -- Breadcrumb
  breadcrumb_title TEXT,
  
  -- Schema
  schema_type TEXT DEFAULT 'WebPage',
  schema_json JSONB,
  
  -- Status
  last_updated_by UUID REFERENCES public.cms_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. SCHEMA MANAGEMENT (Module 7)
-- ============================================================
CREATE TYPE schema_type_enum AS ENUM (
  'Organization', 'Website', 'WebPage', 'Article', 'BlogPosting',
  'FAQ', 'Breadcrumb', 'Product', 'Service', 'LocalBusiness',
  'Video', 'Custom'
);

CREATE TABLE IF NOT EXISTS public.schemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Human readable name
  schema_type schema_type_enum NOT NULL,
  page_path TEXT, -- which page it applies to (null = global)
  schema_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.cms_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. REDIRECT MANAGEMENT (Module 10)
-- ============================================================
CREATE TYPE redirect_type AS ENUM ('301', '302');

CREATE TABLE IF NOT EXISTS public.redirects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  redirect_type redirect_type NOT NULL DEFAULT '301',
  is_active BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.cms_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_url)
);

-- Redirect Logs
CREATE TABLE IF NOT EXISTS public.redirect_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  redirect_id UUID REFERENCES public.redirects(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. BREADCRUMB MANAGEMENT (Module 9)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.breadcrumbs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  breadcrumb_trail JSONB NOT NULL DEFAULT '[]', -- [{label, url}]
  is_manual_override BOOLEAN DEFAULT false,
  schema_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. SITEMAP CONFIGURATION (Module 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sitemap_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  priority DECIMAL(2,1) DEFAULT 0.5, -- 0.0 to 1.0
  change_frequency TEXT DEFAULT 'weekly', -- always,hourly,daily,weekly,monthly,yearly,never
  last_modified DATE DEFAULT CURRENT_DATE,
  is_included BOOLEAN DEFAULT true,
  page_type TEXT DEFAULT 'page', -- 'page', 'blog', 'custom'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sitemap Generation Log
CREATE TABLE IF NOT EXISTS public.sitemap_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  total_urls INTEGER,
  generated_by UUID REFERENCES public.cms_users(id),
  file_content TEXT -- stores last generated sitemap XML
);

-- ============================================================
-- 12. ROBOTS.TXT MANAGEMENT (Module 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.robots_txt (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.cms_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. ANALYTICS CONFIGURATION (Module 8)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Google Analytics 4
  ga4_measurement_id TEXT,
  ga4_enabled BOOLEAN DEFAULT false,
  
  -- Google Tag Manager
  gtm_container_id TEXT,
  gtm_enabled BOOLEAN DEFAULT false,
  
  -- Google Search Console
  gsc_verification_method TEXT, -- 'meta_tag', 'html_file', 'dns'
  gsc_verification_code TEXT,
  gsc_verified BOOLEAN DEFAULT false,
  
  -- Bing Webmaster
  bing_verification_code TEXT,
  bing_enabled BOOLEAN DEFAULT false,
  
  -- Facebook Pixel
  fb_pixel_id TEXT,
  fb_pixel_enabled BOOLEAN DEFAULT false,
  
  updated_by UUID REFERENCES public.cms_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. IMAGE SEO (Module 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase storage URL
  file_size INTEGER, -- bytes
  file_type TEXT, -- image/jpeg, image/webp, etc.
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  title TEXT,
  caption TEXT,
  description TEXT,
  is_webp_converted BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES public.cms_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. SEO ISSUE TRACKING (Module 11 Dashboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seo_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_type TEXT NOT NULL, -- 'missing_title', 'missing_desc', 'missing_alt', 'duplicate_title', etc.
  severity TEXT DEFAULT 'warning', -- 'error', 'warning', 'info'
  page_path TEXT,
  blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_blogs_status ON public.blogs(status);
CREATE INDEX idx_blogs_published_at ON public.blogs(published_at DESC);
CREATE INDEX idx_blogs_slug ON public.blogs(slug);
CREATE INDEX idx_blogs_author ON public.blogs(author_id);
CREATE INDEX idx_blogs_search ON public.blogs USING gin(search_vector);
CREATE INDEX idx_seo_pages_path ON public.seo_pages(page_path);
CREATE INDEX idx_redirects_source ON public.redirects(source_url);
CREATE INDEX idx_schemas_page ON public.schemas(page_path);
CREATE INDEX idx_media_type ON public.media_library(file_type);

-- ============================================================
-- FULL TEXT SEARCH TRIGGER FOR BLOGS
-- ============================================================
CREATE OR REPLACE FUNCTION update_blog_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.excerpt, '') || ' ' ||
    COALESCE(NEW.focus_keyword, '') || ' ' ||
    COALESCE(NEW.seo_description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blogs_search_vector_update
BEFORE INSERT OR UPDATE ON public.blogs
FOR EACH ROW EXECUTE FUNCTION update_blog_search_vector();

-- ============================================================
-- AUTO UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_authors_updated_at BEFORE UPDATE ON public.authors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_seo_pages_updated_at BEFORE UPDATE ON public.seo_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_redirects_updated_at BEFORE UPDATE ON public.redirects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_schemas_updated_at BEFORE UPDATE ON public.schemas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_breadcrumbs_updated_at BEFORE UPDATE ON public.breadcrumbs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_sitemap_updated_at BEFORE UPDATE ON public.sitemap_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.cms_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breadcrumbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read all
CREATE POLICY "Authenticated users can read blogs" ON public.blogs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors can insert blogs" ON public.blogs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Editors can update blogs" ON public.blogs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete blogs" ON public.blogs FOR DELETE TO authenticated USING (true);

CREATE POLICY "All auth users read authors" ON public.authors FOR SELECT TO authenticated USING (true);
CREATE POLICY "All auth users read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "All auth users read tags" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "All auth users read seo_pages" ON public.seo_pages FOR SELECT TO authenticated USING (true);
CREATE POLICY "All auth users write seo_pages" ON public.seo_pages FOR ALL TO authenticated USING (true);
CREATE POLICY "All auth users read schemas" ON public.schemas FOR SELECT TO authenticated USING (true);
CREATE POLICY "All auth users write schemas" ON public.schemas FOR ALL TO authenticated USING (true);
CREATE POLICY "All auth users read redirects" ON public.redirects FOR SELECT TO authenticated USING (true);
CREATE POLICY "All auth users write redirects" ON public.redirects FOR ALL TO authenticated USING (true);
CREATE POLICY "All auth users read breadcrumbs" ON public.breadcrumbs FOR SELECT TO authenticated USING (true);
CREATE POLICY "All auth users write breadcrumbs" ON public.breadcrumbs FOR ALL TO authenticated USING (true);
CREATE POLICY "All auth users read media" ON public.media_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "All auth users upload media" ON public.media_library FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All auth users manage cms_users" ON public.cms_users FOR ALL TO authenticated USING (true);
CREATE POLICY "All auth users manage authors" ON public.authors FOR ALL TO authenticated USING (true);
CREATE POLICY "All auth users manage categories" ON public.categories FOR ALL TO authenticated USING (true);
CREATE POLICY "All auth users manage tags" ON public.tags FOR ALL TO authenticated USING (true);

-- ============================================================
-- SEED DATA - Default Analytics Config
-- ============================================================
INSERT INTO public.analytics_config (ga4_measurement_id, gtm_container_id, gtm_enabled)
VALUES ('G-XXXXXXXXXX', 'GTM-WSPZH8ML', true)
ON CONFLICT DO NOTHING;

-- Default Admin Author
INSERT INTO public.authors (name, slug, email, bio)
VALUES ('Anantya Team', 'anantya-team', 'info@anantya.ai', 'Official Anantya.ai content team')
ON CONFLICT (slug) DO NOTHING;

-- Default Categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('WhatsApp Business', 'whatsapp-business', 'WhatsApp Business API guides and tutorials'),
  ('Marketing', 'marketing', 'WhatsApp marketing strategies and tips'),
  ('Case Studies', 'case-studies', 'Real business case studies'),
  ('Product Updates', 'product-updates', 'Anantya.ai product news and updates'),
  ('Tutorials', 'tutorials', 'Step-by-step how-to guides'),
  ('Industry Insights', 'industry-insights', 'Industry trends and insights')
ON CONFLICT (slug) DO NOTHING;

-- Default Tags
INSERT INTO public.tags (name, slug) VALUES
  ('WhatsApp API', 'whatsapp-api'),
  ('Chatbot', 'chatbot'),
  ('Automation', 'automation'),
  ('Lead Generation', 'lead-generation'),
  ('Customer Support', 'customer-support'),
  ('RCS', 'rcs'),
  ('SMS', 'sms'),
  ('Marketing', 'marketing'),
  ('E-commerce', 'ecommerce'),
  ('Healthcare', 'healthcare')
ON CONFLICT (slug) DO NOTHING;

-- Default Anantya.ai Pages for SEO Manager
INSERT INTO public.seo_pages (page_name, page_path, seo_title, seo_description, robots_index, robots_follow, schema_type) VALUES
  ('Home', '/', 'Conversational Engagement Platform for Businesses | Anantya.ai', 'Anantya.ai is a conversational engagement platform for managing WhatsApp, RCS, SMS, Voice, Marketing, and Support in one place.', true, true, 'WebPage'),
  ('WhatsApp Business API', '/whatsapp-business-api', 'WhatsApp Business API Provider | Anantya.ai', 'Get WhatsApp Business API for your business. Automate messages, send broadcasts and manage customer support.', true, true, 'WebPage'),
  ('About', '/about', 'About Anantya.ai | Conversational AI Platform', 'Learn about Anantya.ai, our mission, team and vision for conversational AI.', true, true, 'WebPage'),
  ('Contact', '/contact', 'Contact Anantya.ai | Get in Touch', 'Contact Anantya.ai for WhatsApp Business API, demos and support.', true, true, 'WebPage'),
  ('Blog', '/blog', 'Blog | WhatsApp Marketing Tips & Guides | Anantya.ai', 'Read the latest WhatsApp marketing guides, tips and tutorials from Anantya.ai.', true, true, 'WebPage'),
  ('Pricing', '/pricing', 'WhatsApp Business API Pricing | Anantya.ai', 'View Anantya.ai WhatsApp Business API pricing plans.', true, true, 'WebPage'),
  ('Integration', '/integration', 'Integrations | Connect Your Tools | Anantya.ai', '60+ integrations with HubSpot, Zoho, Shopify, Zendesk and more.', true, true, 'WebPage'),
  ('Partner With Us', '/partner-with-us', 'Partner Program | Anantya.ai', 'Join Anantya.ai partner program and grow your business.', true, true, 'WebPage'),
  ('WhatsApp Marketing', '/whatsapp-marketing', 'WhatsApp Marketing Platform | Anantya.ai', 'Boost reach and conversions with targeted WhatsApp marketing campaigns.', true, true, 'WebPage'),
  ('WhatsApp Commerce', '/whatsapp-commerce', 'WhatsApp Commerce | Sell on WhatsApp | Anantya.ai', 'Enable seamless browsing-to-buying flows on WhatsApp.', true, true, 'WebPage'),
  ('WhatsApp Support', '/whatsapp-support', 'WhatsApp Customer Support | Anantya.ai', '24x7 multilingual WhatsApp customer support solutions.', true, true, 'WebPage'),
  ('WhatsApp Authentication', '/whatsapp-authentication', 'WhatsApp OTP & Authentication | Anantya.ai', 'Deliver secure, high-speed OTPs via WhatsApp.', true, true, 'WebPage'),
  ('Work With Us', '/work-with-us', 'Careers at Anantya.ai | Join Our Team', 'Join the Anantya.ai team and redefine business communication.', true, true, 'WebPage')
ON CONFLICT (page_path) DO NOTHING;

-- Default robots.txt
INSERT INTO public.robots_txt (content, is_active)
VALUES (
'User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: https://anantya.ai/sitemap.xml
Sitemap: https://anantya.ai/sitemap-blogs.xml',
true
);

-- Default Organization Schema
INSERT INTO public.schemas (name, schema_type, page_path, schema_json, is_active) VALUES (
  'Anantya.ai Organization Schema',
  'Organization',
  '/',
  '{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Anantya.ai",
    "alternateName": "Conversational Engagement Platform for Businesses | Anantya.ai",
    "url": "https://anantya.ai/",
    "logo": "https://ik.imagekit.io/cloy701fl/images/logo.webp",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+971565480273",
      "contactType": "sales",
      "areaServed": ["AE", "SA", "BH", "IN"],
      "availableLanguage": "en"
    },
    "sameAs": [
      "https://www.facebook.com/anantyaai",
      "https://www.instagram.com/anantya.ai",
      "https://www.youtube.com/@Anantyaai",
      "https://www.linkedin.com/company/anantya-ai",
      "https://www.pinterest.com/anantyaai"
    ]
  }',
  true
);

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase Dashboard)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('og-images', 'og-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('author-avatars', 'author-avatars', true);

-- ============================================================
-- DONE! All tables, indexes, triggers, RLS policies created.
-- ============================================================
