const { Client } = require('pg');

async function runMigration() {
  const connectionString = 'postgresql://postgres.fbvhuxtbdrpwwdhjgkvk:Anantya%40321@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.blog_comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
        author_name TEXT NOT NULL,
        author_email TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Comments table created');
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
runMigration();
