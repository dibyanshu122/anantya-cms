export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO; // e.g. NosNia-Tech-Pvt-Ltd/Anantya.ai

  if (!githubToken || !githubRepo) {
    console.error('GITHUB_PAT or GITHUB_REPO is not configured.');
    return res.status(500).json({ message: 'GitHub credentials not configured' });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        event_type: 'cms-content-update',
        client_payload: {
          triggered_at: new Date().toISOString(),
        },
      }),
    });

    // GitHub returns 204 No Content on success
    if (response.status === 204) {
      return res.status(200).json({ message: 'Build triggered successfully via GitHub Actions' });
    } else {
      const text = await response.text();
      console.error(`GitHub API error: ${response.status}`, text);
      return res.status(500).json({ message: `GitHub API responded with ${response.status}` });
    }
  } catch (error) {
    console.error('Error triggering GitHub Actions:', error);
    return res.status(500).json({ message: 'Internal Server Error during build trigger' });
  }
}
