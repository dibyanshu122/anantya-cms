require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Auth API...');
console.log('URL:', supabaseUrl);
console.log('Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('Attempting login with admin@anantya.ai...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@anantya.ai',
      password: 'admin@123',
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
    } else {
      console.log('✅ Login successful!');
      console.log('User ID:', data.user.id);
      console.log('Access Token:', data.session.access_token.substring(0, 20) + '...');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testLogin();
