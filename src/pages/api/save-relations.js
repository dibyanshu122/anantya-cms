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

    // 2. Insert new categories and update blogs table string
    if (categoryIds && categoryIds.length > 0) {
      const catInserts = categoryIds.map(cid => ({ blog_id: blogId, category_id: cid }));
      const { error: catError } = await supabase.from('blog_categories').insert(catInserts);
      if (catError) throw catError;

      // Fetch category names to update the 'categories' column in blogs table for the dashboard UI
      const { data: catData } = await supabase.from('categories').select('name').in('id', categoryIds);
      if (catData && catData.length > 0) {
        const catNamesString = catData.map(c => c.name).join(', ');
        await supabase.from('blogs').update({ categories: catNamesString }).eq('id', blogId);
      }
    } else {
      // Clear the categories column if no categories are selected
      await supabase.from('blogs').update({ categories: null }).eq('id', blogId);
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
