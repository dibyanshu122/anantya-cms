import { supabase, supabaseAdmin } from '../../../lib/supabase';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const db = supabaseAdmin || supabase;
    
    // 1. Fetch all blogs to scan HTML content
    const { data: blogs, error } = await db
      .from('blogs')
      .select('id, title, content');

    if (error) throw error;

    let totalImages = 0;
    let missingAltCount = 0;
    let totalLinks = 0;
    let externalLinks = 0;

    // 2. Scan HTML using cheerio
    for (const blog of (blogs || [])) {
      if (!blog.content) continue;
      
      const $ = cheerio.load(blog.content);
      
      // Analyze images
      $('img').each((i, el) => {
        totalImages++;
        const alt = $(el).attr('alt');
        if (!alt || alt.trim() === '') {
          missingAltCount++;
        }
      });

      // Analyze links
      $('a').each((i, el) => {
        totalLinks++;
        const href = $(el).attr('href');
        if (href && (href.startsWith('http') || href.startsWith('https'))) {
          if (!href.includes('anantya.ai')) {
            externalLinks++;
          }
        }
      });
    }

    // 3. Save report to seo_audits table
    const reportData = {
      images: { total: totalImages, missingAlt: missingAltCount },
      links: { total: totalLinks, external: externalLinks, broken: 0 } // Broken link checking takes too long for synchronous API, keeping it 0 for now
    };

    const { data: audit, error: auditErr } = await db
      .from('seo_audits')
      .insert([{
        status: 'completed',
        total_pages: blogs?.length || 0,
        issues_found: missingAltCount,
        report_data: reportData
      }])
      .select()
      .single();

    if (auditErr) throw auditErr;

    return res.status(200).json(audit);

  } catch (error) {
    console.error('Scan Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
