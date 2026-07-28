fetch('https://anantya.ai/blog/whatsapp-usernames-for-brands?nocache=' + Date.now())
  .then(r => r.text())
  .then(html => {
    const scripts = html.match(/<script type="application\/ld\+json"(.*?)<\/script>/gs);
    console.log(`Found ${scripts ? scripts.length : 0} JSON-LD scripts.`);
    if (scripts) {
      scripts.forEach((s, i) => {
        console.log(`\n--- Script ${i + 1} ---`);
        if (s.includes('BlogPosting')) {
          console.log('✅ Found BlogPosting!');
        } else if (s.includes('FAQPage')) {
          console.log('Found FAQPage');
        }
        // Print the first 100 characters to verify
        console.log(s.substring(0, 150) + '...');
      });
    }
  });
