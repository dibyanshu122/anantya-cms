require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  const { data: categories } = await supabase.from('categories').select('name');
  const { data: tags } = await supabase.from('tags').select('name');
  const { data: authors } = await supabase.from('authors').select('name');
  
  console.log("=== Categories ===");
  console.log(categories?.map(c => c.name).join(", "));
  
  console.log("\n=== Tags ===");
  console.log(tags?.map(t => t.name).join(", "));
  
  console.log("\n=== Authors ===");
  console.log(authors?.map(a => a.name).join(", "));
}

checkData();
