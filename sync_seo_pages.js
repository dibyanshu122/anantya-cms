const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function syncSeoPages() {
  const pagesDir = path.join(__dirname, '../src/pages');
  
  // 1. Read all files in src/pages recursively
  function getFiles(dir, prefix = '') {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (!['api', 'blog', 'integrations'].includes(file)) {
            results = results.concat(getFiles(filePath, prefix + '/' + file));
        }
      } else {
        if (file.endsWith('.js') && !file.startsWith('_') && file !== '404.js' && !file.includes('[slug]')) {
            results.push(prefix + '/' + file);
        }
      }
    });
    return results;
  }

  const jsFiles = getFiles(pagesDir);
  
  // 2. Map files to routes and page names
  const allRoutes = jsFiles.map(file => {
    let route = file.replace('.js', '');
    if (route === '/index') {
        route = '/';
    }
    
    // Generate a readable name
    let name = route === '/' ? 'Home' : route.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return { path: route, name: name };
  });

  // 3. Connect to DB
  const connectionString = 'postgresql://postgres.fbvhuxtbdrpwwdhjgkvk:Anantya%40321@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // 4. Get existing routes
    const existingRes = await client.query('SELECT page_path FROM seo_pages');
    const existingPaths = new Set(existingRes.rows.map(r => r.page_path));
    
    // 5. Filter missing routes
    const missingRoutes = allRoutes.filter(r => !existingPaths.has(r.path));
    
    console.log(`Found ${allRoutes.length} total valid routes.`);
    console.log(`Found ${existingPaths.size} routes already in DB.`);
    console.log(`Inserting ${missingRoutes.length} new routes...`);
    
    // 6. Insert missing routes
    for (const r of missingRoutes) {
      await client.query(
        'INSERT INTO seo_pages (page_name, page_path, seo_title, seo_description) VALUES ($1, $2, $3, $4)',
        [r.name, r.path, '', '']
      );
      console.log(`+ Added: ${r.path}`);
    }
    
    console.log('✅ SEO pages sync completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

syncSeoPages();
