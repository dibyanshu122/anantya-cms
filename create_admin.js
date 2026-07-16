const fs = require('fs');
const { Client } = require('pg');

async function createAdmin() {
  const connectionString = 'postgresql://postgres.fbvhuxtbdrpwwdhjgkvk:Anantya%40321@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to DB...');
    
    const sql = `
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      
      DO $$
      DECLARE
        new_user_id UUID := gen_random_uuid();
      BEGIN
        -- Insert into auth.users
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
          last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, 
          created_at, updated_at, phone, phone_confirmed_at, confirmation_token, 
          email_change, email_change_token_new, recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
          'admin@anantya.ai', crypt('admin@123', gen_salt('bf')), now(), 
          now(), '{"provider":"email","providers":["email"]}', '{"role": "admin"}', false, 
          now(), now(), NULL, NULL, '', '', '', ''
        );
      
        -- Insert into auth.identities
        INSERT INTO auth.identities (
          id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
        ) VALUES (
          gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, 'admin@anantya.ai')::jsonb, 
          'email', now(), now(), now(), new_user_id::text
        );
      END $$;
    `;
    
    await client.query(sql);
    console.log('✅ Admin user created successfully!');
    
  } catch (err) {
    console.error('❌ Error creating user:', err);
  } finally {
    await client.end();
  }
}

createAdmin();
