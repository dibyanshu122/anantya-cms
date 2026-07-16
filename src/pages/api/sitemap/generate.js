import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseUrl = 'https://anantya.ai';
    let urlCount = 0;
    
    // 1. Fetch static SEO pages
    const { data: seoPages, error: seoError } = await supabaseAdmin
      .from('seo_pages')
      .select('path, updated_at, robots_index')
      .eq('robots_index', true);
      
    if (seoError) throw seoError;

    // 2. Fetch published blogs
    const { data: blogs, error: blogsError } = await supabaseAdmin
      .from('blogs')
      .select('slug, updated_at, robots_index')
      .eq('status', 'published')
      .eq('robots_index', true);
      
    if (blogsError) throw blogsError;

    // 3. Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    seoPages.forEach(page => {
      // Avoid doubling slashes
      const loc = page.path === '/' ? baseUrl : `${baseUrl}${page.path.startsWith('/') ? page.path : '/' + page.path}`;
      const priority = page.path === '/' ? '1.0' : '0.8';
      
      xml += `  <url>\n`;
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <lastmod>${new Date(page.updated_at).toISOString()}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `  </url>\n`;
      urlCount++;
    });

    // Add blogs
    blogs.forEach(blog => {
      const loc = `${baseUrl}/blog/${blog.slug}`;
      xml += `  <url>\n`;
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <lastmod>${new Date(blog.updated_at).toISOString()}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
      urlCount++;
    });

    xml += `</urlset>`;

    // 4. Log the generation
    await supabaseAdmin
      .from('sitemap_logs')
      .insert([{
        generated_at: new Date().toISOString(),
        url_count: urlCount,
        file_url: '/sitemap.xml'
      }]);

    // Send the response
    return res.status(200).json({ xml, urlCount });
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
