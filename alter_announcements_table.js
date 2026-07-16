const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Anantya@321@db.fbvhuxtbdrpwwdhjgkvk.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  
  const query = `
    ALTER TABLE public.announcements
    ADD COLUMN IF NOT EXISTS button_text VARCHAR(50) DEFAULT 'Learn More',
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS target_pages TEXT DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS position VARCHAR(50) DEFAULT 'center',
    ADD COLUMN IF NOT EXISTS delay_time INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS scroll_percentage INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0;
  `;
  
  try {
    await client.query(query);
    console.log("Table 'announcements' altered successfully.");
  } catch (err) {
    console.error("Error altering table:", err);
  } finally {
    await client.end();
  }
}

run();
