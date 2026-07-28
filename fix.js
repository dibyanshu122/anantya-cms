const fs = require('fs');
let c = fs.readFileSync('src/pages/blogs/[id].js', 'utf8');
const searchStr = `
  const executeRestore = () => {
    if (!confirmRestore) return;
    setContent(confirmRestore.content);
    setTitle(confirmRestore.title);
    setShowRevisions(false);
    toast.success('Revision restored. Click Save to apply.');
    setConfirmRestore(null);
  };
`;
c = c.replace(searchStr, '');
c = c.replace('const handleGenerateClick', `  const executeRestore = () => {
    if (!confirmRestore) return;
    setContent(confirmRestore.content);
    setTitle(confirmRestore.title);
    setShowRevisions(false);
    toast.success('Revision restored. Click Save to apply.');
    setConfirmRestore(null);
  };

  const handleGenerateClick`);
fs.writeFileSync('src/pages/blogs/[id].js', c);
