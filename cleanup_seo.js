const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clean() {
  const { data: all } = await supabase.from('seo_pages').select('*');
  
  const missing = all.filter(x => !x.seo_title || x.seo_title.trim() === '');
  let count = 0;
  for (let m of missing) {
     let withSlash = m.page_path.endsWith('/') ? m.page_path : m.page_path + '/';
     let withoutSlash = m.page_path.endsWith('/') ? m.page_path.slice(0, -1) : m.page_path;
     
     let good = all.find(x => (x.page_path === withSlash || x.page_path === withoutSlash) && x.id !== m.id && x.seo_title && x.seo_title.trim() !== '');
     
     if (good) {
       await supabase.from('seo_pages').update({
         seo_title: good.seo_title,
         seo_description: good.seo_description,
         schema_type: good.schema_type
       }).eq('id', m.id);
       
       await supabase.from('seo_pages').delete().eq('id', good.id);
       count++;
     } else {
       let name = m.page_path.split('/').filter(x => x).pop();
       if (name) {
         name = name.replace(/-/g, ' ');
         name = name.charAt(0).toUpperCase() + name.slice(1);
         await supabase.from('seo_pages').update({
           seo_title: name,
           seo_description: `Explore ${name} on Anantya.ai`
         }).eq('id', m.id);
         count++;
       }
     }
  }
  
  // Cleanup duplicates and trailing slashes
  const { data: currentAll } = await supabase.from('seo_pages').select('*');
  const pathMap = new Map();
  for (let row of currentAll) {
     let cleanPath = row.page_path.endsWith('/') && row.page_path !== '/' ? row.page_path.slice(0, -1) : row.page_path;
     if (pathMap.has(cleanPath)) {
        let existing = pathMap.get(cleanPath);
        if (existing.page_path.endsWith('/')) {
           await supabase.from('seo_pages').delete().eq('id', existing.id);
           pathMap.set(cleanPath, row);
        } else {
           await supabase.from('seo_pages').delete().eq('id', row.id);
        }
     } else {
        pathMap.set(cleanPath, row);
        if (row.page_path.endsWith('/') && row.page_path !== '/') {
           await supabase.from('seo_pages').update({ page_path: cleanPath }).eq('id', row.id);
        }
     }
  }

  console.log(`Fixed ${count} missing rows and cleaned up duplicates/trailing slashes.`);
}
clean();
