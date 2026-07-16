const fs = require('fs');
const { Client } = require('pg');

async function runMigration() {
  const connectionString = 'postgresql://postgres.fbvhuxtbdrpwwdhjgkvk:Anantya%40321@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database successfully.');
    
    const sql = fs.readFileSync('supabase-schema.sql', 'utf8');
    console.log('Read schema file. Executing SQL...');
    
    await client.query(sql);
    console.log('✅ SQL schema executed successfully!');
    
  } catch (err) {
    console.error('❌ Error executing SQL:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigration();
