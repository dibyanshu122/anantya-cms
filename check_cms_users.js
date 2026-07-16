require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('cms_users').select('id').limit(1);
  if (error && error.code === '42P01') {
    console.log('cms_users table does not exist. Please create it.');
  } else if (error) {
    console.error('Error:', error);
  } else {
    console.log('cms_users table exists!');
  }
}

main();
