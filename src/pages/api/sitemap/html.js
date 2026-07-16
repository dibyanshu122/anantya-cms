import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.anantya.ai';

    const { data: seoPages } = await supabase.from('seo_pages').select('slug, seo_title');
    const { data: blogs } = await supabase.from('blogs').select('slug, title').eq('status', 'published');

    const urls = [];

    if (seoPages) {
      seoPages.forEach(page => {
        urls.push({
          url: `${SITE_URL}${page.slug === '/' ? '' : page.slug}`,
          title: page.seo_title || page.slug
        });
      });
    }

    if (blogs) {
      blogs.forEach(blog => {
        urls.push({
          url: `${SITE_URL}/blog/${blog.slug}`,
          title: blog.title
        });
      });
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HTML Sitemap - Anantya.ai</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
          h1 { color: #018E9E; }
          ul { list-style: none; padding: 0; }
          li { margin-bottom: 0.5rem; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .section { margin-top: 2rem; }
        </style>
      </head>
      <body>
        <h1>HTML Sitemap</h1>
        
        <div class="section">
          <h2>Pages</h2>
          <ul>
            ${seoPages?.map(p => `<li><a href="${SITE_URL}${p.slug === '/' ? '' : p.slug}">${p.seo_title || p.slug}</a></li>`).join('') || ''}
          </ul>
        </div>
        
        <div class="section">
          <h2>Blog Posts</h2>
          <ul>
            ${blogs?.map(b => `<li><a href="${SITE_URL}/blog/${b.slug}">${b.title}</a></li>`).join('') || ''}
          </ul>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send('Error generating HTML sitemap: ' + err.message);
  }
}
