const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GH_PAT = process.env.GH_PAT;
const GH_REPO = process.env.GH_REPO;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GH_PAT || !GH_REPO) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function autoPublish() {
  console.log("Checking for scheduled posts...");
  const now = new Date().toISOString();

  // Find all scheduled posts where scheduled_at is less than or equal to current time
  const { data: scheduledPosts, error: fetchError } = await supabase
    .from('blogs')
    .select('id, title, scheduled_at')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now);

  if (fetchError) {
    console.error("Error fetching scheduled posts:", fetchError);
    process.exit(1);
  }

  if (!scheduledPosts || scheduledPosts.length === 0) {
    console.log("No scheduled posts ready to be published.");
    return;
  }

  console.log(`Found ${scheduledPosts.length} post(s) to publish.`);
  const postIds = scheduledPosts.map(p => p.id);

  // Update status to 'published' and set published_at to the scheduled_at time
  const { error: updateError } = await supabase
    .from('blogs')
    .update({ 
      status: 'published',
      published_at: now
    })
    .in('id', postIds);

  if (updateError) {
    console.error("Error updating posts to published:", updateError);
    process.exit(1);
  }

  console.log("Posts updated in database. Triggering frontend build...");

  // Trigger GitHub Action to build the frontend
  try {
    const response = await fetch(`https://api.github.com/repos/${GH_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GH_PAT}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        event_type: 'cms-content-update',
        client_payload: {
          triggered_at: now,
          trigger_source: 'auto-publish-cron'
        },
      }),
    });

    if (response.status === 204) {
      console.log('Build triggered successfully via GitHub Actions');
    } else {
      const text = await response.text();
      console.error(`GitHub API error: ${response.status}`, text);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error triggering GitHub Actions:', error);
    process.exit(1);
  }

  console.log("Auto-publish job completed successfully.");
}

autoPublish();
