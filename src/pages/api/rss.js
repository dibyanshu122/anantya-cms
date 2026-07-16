import { Feed } from 'feed';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.anantya.ai';
    const SITE_TITLE = 'Anantya.ai Blog';
    const SITE_DESC = 'Latest updates, insights, and news from Anantya.ai';

    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('title, slug, excerpt, published_at, authors(name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const items = blogs.map(blog => {
      const url = `${SITE_URL}/blog/${blog.slug}`;
      const pubDate = new Date(blog.published_at).toUTCString();
      const author = blog.authors ? `<author>${blog.authors.name}</author>` : '';
      
      return `
        <item>
          <title><![CDATA[${blog.title}]]></title>
          <link>${url}</link>
          <guid isPermaLink="true">${url}</guid>
          <pubDate>${pubDate}</pubDate>
          <description><![CDATA[${blog.excerpt || ''}]]></description>
          ${author}
        </item>
      `;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
        <channel>
          <title>${SITE_TITLE}</title>
          <link>${SITE_URL}</link>
          <description>${SITE_DESC}</description>
          <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml" />
          <language>en-us</language>
          ${items}
        </channel>
      </rss>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(rss);
  } catch (err) {
    res.status(500).send('Error generating RSS feed');
  }
}
