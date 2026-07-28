const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sitemap = fs.readFileSync('C:/Users/Admin/Downloads/Anantya.ai-production/Anantya.ai-production/sitemap.xml', 'utf8');
const blogFile = fs.readFileSync('C:/Users/Admin/Downloads/Anantya.ai-production/Anantya.ai-production/src/pages/blog.js', 'utf8');

// extract blog info
const blogs = {};
const objects = blogFile.match(/\{[\s\S]*?link:\s*["'][^"']+["'][\s\S]*?\}/g);
if (objects) {
  for (const obj of objects) {
    const linkMatch = obj.match(/link:\s*["']([^"']+)["']/);
    const titleMatch = obj.match(/title:\s*["']([\s\S]*?)["']/);
    const descMatch = obj.match(/description:\s*["']([\s\S]*?)["']/);
    if (linkMatch) {
      let route = linkMatch[1];
      if (route.endsWith('/')) route = route.slice(0, -1);
      
      let title = titleMatch ? titleMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : '';
      let desc = descMatch ? descMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : '';
      blogs[route] = { title, desc };
    }
  }
}

// extract sitemap urls
const urlsMatch = sitemap.match(/<loc>(.*?)<\/loc>/g);
const toUpsert = [];
for (let m of urlsMatch) {
  let url = m.replace('<loc>', '').replace('</loc>', '').trim();
  url = url.replace('https://anantya.ai', '');
  if (url === '') url = '/';
  let path = url;
  if (path.endsWith('/') && path !== '/') {
    path = path.slice(0, -1); // remove trailing slash
  }
  if (!url.startsWith('/')) url = '/' + url;
  
  // Try to find blog info
  let blogInfo = blogs[path];
  
  let name = path === '/' ? 'Home' : path.split('/').pop().replace(/-/g, ' ');
  name = name.charAt(0).toUpperCase() + name.slice(1);
  
  let seoTitle = blogInfo ? blogInfo.title : name;
  let seoDesc = blogInfo ? blogInfo.desc : `Explore ${name} on Anantya.ai`;
  
  if (!seoTitle) seoTitle = name;
  if (!seoDesc) seoDesc = seoTitle;

  toUpsert.push({
    page_path: url, 
    page_name: name.substring(0, 255),
    seo_title: seoTitle.substring(0, 255),
    seo_description: seoDesc.substring(0, 500),
    schema_type: path.startsWith('/blog') ? 'Article' : 'WebPage'
  });
}

// add blogs that might not be in sitemap but are in blog.js
for (let path in blogs) {
   if (!toUpsert.find(u => u.page_path === path || u.page_path === path + '/')) {
      let name = path.split('/').pop().replace(/-/g, ' ');
      name = name.charAt(0).toUpperCase() + name.slice(1);
      let blogInfo = blogs[path];
      let seoTitle = blogInfo ? blogInfo.title : name;
      let seoDesc = blogInfo ? blogInfo.desc : `Explore ${name} on Anantya.ai`;
      
      toUpsert.push({
        page_path: path,
        page_name: name.substring(0, 255),
        seo_title: seoTitle.substring(0, 255),
        seo_description: seoDesc.substring(0, 500),
        schema_type: 'Article'
      });
   }
}

// deduplicate by page_path
const map = new Map();
for (let item of toUpsert) {
  map.set(item.page_path, item);
}
const finalToUpsert = Array.from(map.values());

async function run() {
  console.log(`Updating/Inserting ${finalToUpsert.length} records...`);
  let count = 0;
  for (let b of finalToUpsert) {
      const { data: ext } = await supabase.from('seo_pages').select('id').eq('page_path', b.page_path).maybeSingle();
      if (ext) {
         await supabase.from('seo_pages').update({ seo_title: b.seo_title, seo_description: b.seo_description }).eq('id', ext.id);
      } else {
         await supabase.from('seo_pages').insert([b]);
      }
      count++;
      if (count % 20 === 0) console.log(`Processed ${count}...`);
  }
  console.log(`Total processed: ${count}`);
}
run();
