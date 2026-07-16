const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Anantya@321@db.fbvhuxtbdrpwwdhjgkvk.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  
  const query = `
    CREATE TABLE IF NOT EXISTS public.announcements (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      link TEXT,
      background_color VARCHAR(50) DEFAULT '#018E9E',
      text_color VARCHAR(50) DEFAULT '#FFFFFF',
      is_active BOOLEAN DEFAULT false,
      type VARCHAR(50) DEFAULT 'banner',
      image_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;
  
  try {
    await client.query(query);
    console.log("Table 'announcements' created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await client.end();
  }
}

run();
