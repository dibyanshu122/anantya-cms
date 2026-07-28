const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const pagesDir = 'C:/Users/Admin/Downloads/Anantya.ai-production/Anantya.ai-production/src/pages';
const blogFile = path.join(pagesDir, 'blog.js');

const pagesToInsert = [];

// 1. Get all static Next.js pages
const files = fs.readdirSync(pagesDir);
for (const file of files) {
  if (file.endsWith('.js') && !file.startsWith('_') && file !== '404.js') {
    let route = file === 'index.js' ? '/' : `/${file.replace('.js', '')}`;
    let name = file === 'index.js' ? 'Home' : file.replace('.js', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    pagesToInsert.push({ path: route, name: name });
  }
}

// 2. Get hardcoded blogs
const content = fs.readFileSync(blogFile, 'utf8');
const objects = content.match(/\{[\s\S]*?link:\s*["'][^"']+["'][\s\S]*?\}/g);
if (objects) {
  for (const obj of objects) {
    const linkMatch = obj.match(/link:\s*["']([^"']+)["']/);
    const titleMatch = obj.match(/title:\s*["']([\s\S]*?)["']/);
    if (linkMatch) {
      let route = linkMatch[1];
      let name = titleMatch ? titleMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : route;
      // only add if not already added
      if (!pagesToInsert.find(p => p.path === route)) {
        pagesToInsert.push({ path: route, name: name });
      }
    }
  }
}

console.log('Total pages found to sync:', pagesToInsert.length);

async function syncToDB() {
  const { data: existing } = await supabase.from('seo_pages').select('page_path');
  const existingPaths = new Set(existing.map(e => e.page_path));
  
  const toInsert = [];
  for (const p of pagesToInsert) {
    if (!existingPaths.has(p.path)) {
      toInsert.push({
        page_name: p.name.substring(0, 255),
        page_path: p.path,
        schema_type: p.path.startsWith('/blog/') ? 'Article' : 'WebPage'
      });
    }
  }
  
  console.log(`Found ${existingPaths.size} already in DB. Need to insert ${toInsert.length} new pages.`);
  
  if (toInsert.length > 0) {
    // Insert in batches
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50);
      const { error } = await supabase.from('seo_pages').insert(batch);
      if (error) {
        console.error('Error inserting batch:', error);
      } else {
        console.log(`Inserted batch ${i/50 + 1}`);
      }
    }
    console.log('Successfully synced all missing pages!');
  } else {
    console.log('All pages are already in the DB.');
  }
}

syncToDB();
