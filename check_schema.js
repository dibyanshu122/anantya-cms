const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.fbvhuxtbdrpwwdhjgkvk:Anantya%40321@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres' });
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cms_users';");
  console.log(res.rows);
  await client.end();
}
run();
