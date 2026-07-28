-- Comprehensive RLS Policy Fix for Anantya CMS
-- This script will ensure that your CMS tables are securely accessible.
-- It grants READ access to the public (so your website can build and fetch data)
-- It grants FULL access (Create, Read, Update, Delete) to logged-in CMS users.

-- 1. List of public content tables that need public READ and authenticated FULL ACCESS
DO $$
DECLARE
    t_name text;
    tables text[] := ARRAY[
        'blogs', 'authors', 'categories', 'tags', 
        'blog_categories', 'blog_tags', 'blog_revisions', 'blog_faqs', 
        'breadcrumbs', 'redirects', 'seo_pages', 'robots_txt', 'schemas'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables LOOP
        -- Enable RLS on the table just in case it's not enabled
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);
        
        -- Drop existing generic policies if they exist (to avoid duplicates or conflicts)
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Public Read Access" ON public.%I;', t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%I;', t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Authenticated Full Access" ON public.%I;', t_name);
        EXCEPTION WHEN undefined_object THEN
            -- Ignore errors if policy doesn't exist
        END;
        
        -- Create Public SELECT policy
        EXECUTE format('CREATE POLICY "Public Read Access" ON public.%I FOR SELECT USING (true);', t_name);
        
        -- Create Authenticated ALL policy
        EXECUTE format('CREATE POLICY "Authenticated Full Access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t_name);
    END LOOP;
END $$;


-- 2. List of internal/log tables that should ONLY be accessible to logged-in CMS users
DO $$
DECLARE
    t_name text;
    tables text[] := ARRAY[
        'redirect_logs', 'seo_audits', 'sitemap_logs', 'cms_users'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);
        
        -- Drop existing generic policies
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Authenticated Full Access" ON public.%I;', t_name);
        EXCEPTION WHEN undefined_object THEN
        END;
        
        -- Create Authenticated ALL policy (No public read access for these)
        EXECUTE format('CREATE POLICY "Authenticated Full Access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t_name);
    END LOOP;
END $$;


-- 3. Special case for blog_comments (if you have a commenting system)
-- Visitors (anon) need to be able to INSERT comments, but only authenticated users can edit/delete them.
DO $$
BEGIN
    ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Public Insert Comments" ON public.blog_comments;
    DROP POLICY IF EXISTS "Public Read Comments" ON public.blog_comments;
    DROP POLICY IF EXISTS "Authenticated Full Access Comments" ON public.blog_comments;
    
    -- Allow anyone to read comments
    CREATE POLICY "Public Read Comments" ON public.blog_comments FOR SELECT USING (true);
    
    -- Allow anyone to insert comments
    CREATE POLICY "Public Insert Comments" ON public.blog_comments FOR INSERT WITH CHECK (true);
    
    -- Allow authenticated users full control
    CREATE POLICY "Authenticated Full Access Comments" ON public.blog_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN
    -- Ignore if blog_comments doesn't exist or has issues
END $$;

-- 4. Fix Storage RLS for images (Optional but recommended)
-- This allows anyone to view images, and authenticated users to upload/delete images in the 'images' bucket.
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated CRUD" ON storage.objects;
    
    -- Anyone can read images
    CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
    
    -- Only authenticated CMS users can insert/update/delete images
    CREATE POLICY "Authenticated CRUD" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');
EXCEPTION WHEN others THEN
    -- Ignore if storage.objects doesn't exist in the context
END $$;
