const { Client } = require('pg');

async function fixMissingSeo() {
  const connectionString = 'postgresql://postgres.fbvhuxtbdrpwwdhjgkvk:Anantya%40321@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // Fetch all pages with missing SEO
    const res = await client.query("SELECT id, page_name, page_path FROM seo_pages WHERE seo_title = '' OR seo_title IS NULL");
    const missingPages = res.rows;
    
    console.log(`Found ${missingPages.length} pages with missing SEO. Fixing...`);
    
    for (const page of missingPages) {
      let title = '';
      let description = '';
      let name = page.page_name;
      
      // Clean up names like "WhatsAppTemplateMessages" -> "WhatsApp Template Messages"
      name = name.replace(/([A-Z])/g, ' $1').trim();
      
      if (name.toLowerCase().includes('industry')) {
        let indName = name.replace(/industry/i, '').trim();
        title = `${indName} Industry WhatsApp Solutions | Anantya.ai`;
        description = `Transform your ${indName} business with Anantya.ai's WhatsApp Business API. Automate support, drive sales, and engage customers seamlessly on WhatsApp.`;
      } 
      else if (name.toLowerCase().includes('how to')) {
        title = `${name} | Anantya.ai Guide`;
        description = `Step-by-step guide on ${name.toLowerCase()} using Anantya.ai. Master our WhatsApp Business API platform with easy tutorials.`;
      }
      else if (name.toLowerCase().includes('partner')) {
        title = `${name} Program | Anantya.ai`;
        description = `Join the Anantya.ai ${name} program. Partner with a leading WhatsApp Business Solution Provider to grow your revenue and offer cutting-edge solutions.`;
      }
      else {
        title = `${name} | Anantya.ai - WhatsApp Business API Platform`;
        description = `Explore ${name} on Anantya.ai. Enhance your customer communication, automate marketing, and streamline support with our powerful WhatsApp platform.`;
      }
      
      // Ensure lengths are reasonable
      if (title.length > 60) title = title.substring(0, 57) + '...';
      if (description.length > 160) description = description.substring(0, 157) + '...';
      
      await client.query(
        "UPDATE seo_pages SET seo_title = $1, seo_description = $2, updated_at = NOW() WHERE id = $3",
        [title, description, page.id]
      );
      
      console.log(`Updated ${page.page_path} -> Title: ${title}`);
    }
    
    console.log('✅ All missing SEO tags have been generated and updated successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

fixMissingSeo();
