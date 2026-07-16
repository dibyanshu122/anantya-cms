require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('cms_users').select('*').limit(1);
  console.log('Query result:', data, 'Error:', error);
  
  // Let's also try to insert a test user to see the exact error
  const { data: insertData, error: insertError } = await supabase.from('cms_users').insert([{
    full_name: 'Test',
    email: 'test@example.com',
    role: 'admin',
    is_active: true
  }]);
  
  console.log('Insert test:', insertData, 'Insert Error:', insertError);
}

main();
