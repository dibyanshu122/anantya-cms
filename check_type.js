require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: seoData, error: seoErr } = await supabase.from('seo_pages').select('robots_index').limit(1);
  const { data: blogData, error: blogErr } = await supabase.from('blogs').select('robots_index').limit(1);
  console.log("SEO:", seoData, seoErr);
  console.log("Blogs:", blogData, blogErr);
}
run();
