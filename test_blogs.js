require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('blogs').select('id, title, featured_image_url, featured_image');
  console.log('Blogs:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}

main();
