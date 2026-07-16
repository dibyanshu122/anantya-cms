import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, fullName, role } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server misconfiguration: Missing Supabase keys' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // 2. Insert into cms_users
    const { error: cmsUserError } = await supabase.from('cms_users').insert([{
      id: userId,
      email,
      full_name: fullName,
      role,
      is_active: true
    }]);

    if (cmsUserError) {
      console.error('Error inserting cms_user:', cmsUserError);
    }

    // 3. Insert into authors table for Blog writing
    const slug = slugify(fullName, { lower: true, strict: true }) + '-' + Math.floor(Math.random() * 1000);
    const { error: authorError } = await supabase.from('authors').insert([{
      name: fullName,
      email,
      slug,
      is_active: true
    }]);

    if (authorError) {
      console.error('Error inserting author:', authorError);
    }

    return res.status(200).json({ message: 'User created successfully', user: authData.user });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
