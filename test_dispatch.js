require('dotenv').config({path: '.env.local'});
fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}/dispatches`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  },
  body: JSON.stringify({ event_type: 'cms-content-update' })
})
.then(r => { console.log(r.status); return r.text(); })
.then(console.log)
.catch(console.error);
