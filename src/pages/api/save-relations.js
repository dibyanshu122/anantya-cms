import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { blogId, categoryIds, tagIds } = req.body;

  if (!blogId) {
    return res.status(400).json({ message: 'Missing blogId' });
  }

  try {
    // 1. Delete existing relations
    await supabase.from('blog_categories').delete().eq('blog_id', blogId);
    await supabase.from('blog_tags').delete().eq('blog_id', blogId);

    // 2. Insert new categories
    if (categoryIds && categoryIds.length > 0) {
      const catInserts = categoryIds.map(cid => ({ blog_id: blogId, category_id: cid }));
      const { error: catError } = await supabase.from('blog_categories').insert(catInserts);
      if (catError) throw catError;
    }

    // 3. Insert new tags
    if (tagIds && tagIds.length > 0) {
      const tagInserts = tagIds.map(tid => ({ blog_id: blogId, tag_id: tid }));
      const { error: tagError } = await supabase.from('blog_tags').insert(tagInserts);
      if (tagError) throw tagError;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving relations:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
