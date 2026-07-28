const fs = require('fs');
const content = fs.readFileSync('C:/Users/Admin/Downloads/Anantya.ai-production/Anantya.ai-production/src/pages/blog.js', 'utf8');

const objects = content.match(/\{[\s\S]*?link:\s*["'][^"']+["'][\s\S]*?\}/g);
const pages = [];

if (objects) {
  for (const obj of objects) {
    const linkMatch = obj.match(/link:\s*["']([^"']+)["']/);
    
    // Attempt to match title spanning multiple lines or single line
    const titleMatch = obj.match(/title:\s*["']([\s\S]*?)["']/);
    
    if (linkMatch) {
      let path = linkMatch[1];
      let name = titleMatch ? titleMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : path;
      pages.push({ path, name });
    }
  }
}

// Additional static pages
const staticPages = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/features', name: 'Features' },
  { path: '/industries', name: 'Industries' },
  { path: '/integrations', name: 'Integrations' },
  { path: '/use-cases', name: 'Use Cases' },
];

for (const p of staticPages) {
  if (!pages.find(x => x.path === p.path)) {
    pages.push(p);
  }
}

console.log('Total pages found:', pages.length);
fs.writeFileSync('extracted.json', JSON.stringify(pages, null, 2));
