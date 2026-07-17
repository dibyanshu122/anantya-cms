require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const tablesToCheck = [
  'blogs', 'categories', 'blog_categories', 'authors', 'tags', 'blog_tags',
  'blog_faqs', 'blog_revisions', 'breadcrumbs', 'blog_comments', 'redirects',
  'redirect_logs', 'seo_pages', 'seo_audits', 'robots_txt', 'schemas',
  'sitemap_logs', 'cms_users', 'announcements'
];

async function check() {
  const missing = [];
  const existing = [];

  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error && error.code === '42P01') { // 42P01 is undefined_table
      missing.push(table);
    } else if (error) {
       console.log(`Error checking ${table}: ${error.message} (${error.code})`);
       if(error.message.includes("relation") && error.message.includes("does not exist")) {
           missing.push(table);
       } else {
           existing.push(table);
       }
    } else {
      existing.push(table);
    }
  }

  console.log("\\n--- DATABASE AUDIT RESULTS ---");
  console.log("✅ Existing Tables:", existing.join(', '));
  console.log("❌ Missing Tables:", missing.join(', '));
}

check();
