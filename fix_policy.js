const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Anantya@321@db.fbvhuxtbdrpwwdhjgkvk.supabase.co:5432/postgres'
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Create the policy
    await client.query(`
      CREATE POLICY "Enable read access for all users"
      ON public.schemas
      FOR SELECT
      USING (true);
    `);
    console.log('Policy created successfully!');
  } catch (err) {
    console.error('Error creating policy:', err);
  } finally {
    await client.end();
  }
}

main();
