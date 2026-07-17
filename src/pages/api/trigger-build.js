export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const webhookUrl = process.env.DEPLOY_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('DEPLOY_WEBHOOK_URL is not configured in environment variables.');
    return res.status(500).json({ message: 'Webhook URL not configured' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Webhook triggered but returned status: ${response.status}`);
      return res.status(500).json({ message: 'Failed to trigger webhook on remote server' });
    }

    return res.status(200).json({ message: 'Build triggered successfully' });
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return res.status(500).json({ message: 'Internal Server Error during webhook trigger' });
  }
}
