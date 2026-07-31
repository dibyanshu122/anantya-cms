require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
CREATE POLICY "Enable read access for all users" ON "public"."blog_categories" AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."blog_tags" AS PERMISSIVE FOR SELECT TO public USING (true);
`;

// There might not be an exec_sql RPC, so let's just bypass RLS in the website's getStaticProps instead!
