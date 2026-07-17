/**
 * Utility function to trigger a frontend build asynchronously.
 * This calls the /api/trigger-build endpoint which securely invokes the webhook.
 */
export async function triggerBuild() {
  try {
    // Fire and forget - we don't await the response to avoid blocking the UI
    fetch('/api/trigger-build', {
      method: 'POST',
    }).catch(err => {
      console.error('Failed to trigger background build request:', err);
    });
  } catch (error) {
    console.error('Error initiating build trigger:', error);
  }
}
