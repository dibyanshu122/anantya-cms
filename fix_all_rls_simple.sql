ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.blogs;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.blogs;
CREATE POLICY "Public Read Access" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.blogs FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.authors;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.authors;
CREATE POLICY "Public Read Access" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.authors FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.categories;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.categories;
CREATE POLICY "Public Read Access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.tags;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.tags;
CREATE POLICY "Public Read Access" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.blog_categories;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.blog_categories;
CREATE POLICY "Public Read Access" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.blog_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.blog_tags;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.blog_tags;
CREATE POLICY "Public Read Access" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.blog_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.blog_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.blog_revisions;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.blog_revisions;
CREATE POLICY "Public Read Access" ON public.blog_revisions FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.blog_revisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.blog_faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.blog_faqs;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.blog_faqs;
CREATE POLICY "Public Read Access" ON public.blog_faqs FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.blog_faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.breadcrumbs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.breadcrumbs;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.breadcrumbs;
CREATE POLICY "Public Read Access" ON public.breadcrumbs FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.breadcrumbs FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.redirects;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.redirects;
CREATE POLICY "Public Read Access" ON public.redirects FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.redirects FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.seo_pages;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.seo_pages;
CREATE POLICY "Public Read Access" ON public.seo_pages FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.seo_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.robots_txt ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.robots_txt;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.robots_txt;
CREATE POLICY "Public Read Access" ON public.robots_txt FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.robots_txt FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.schemas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.schemas;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.schemas;
CREATE POLICY "Public Read Access" ON public.schemas FOR SELECT USING (true);
CREATE POLICY "Authenticated Full Access" ON public.schemas FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.redirect_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.redirect_logs;
CREATE POLICY "Authenticated Full Access" ON public.redirect_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.seo_audits;
CREATE POLICY "Authenticated Full Access" ON public.seo_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.sitemap_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.sitemap_logs;
CREATE POLICY "Authenticated Full Access" ON public.sitemap_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.cms_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated Full Access" ON public.cms_users;
CREATE POLICY "Authenticated Full Access" ON public.cms_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Public Insert Comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Authenticated Full Access Comments" ON public.blog_comments;
CREATE POLICY "Public Read Comments" ON public.blog_comments FOR SELECT USING (true);
CREATE POLICY "Public Insert Comments" ON public.blog_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated Full Access Comments" ON public.blog_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
