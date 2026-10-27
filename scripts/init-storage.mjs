import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Connecting to Supabase at:', supabaseUrl);

async function initStorage() {
  try {
    const listRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!listRes.ok) {
      console.error('Failed to list buckets:', await listRes.text());
      return;
    }

    const buckets = await listRes.json();
    console.log('Existing buckets:', buckets.map(b => b.name));

    if (!buckets.some(b => b.name === 'videos')) {
      console.log("Creating public bucket 'videos'...");
      await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'videos',
          name: 'videos',
          public: true,
          allowed_mime_types: ['video/mp4', 'video/quicktime', 'video/webm'],
        }),
      });
      console.log("Bucket 'videos' created.");
    }

    if (!buckets.some(b => b.name === 'thumbnails')) {
      console.log("Creating public bucket 'thumbnails'...");
      await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'thumbnails',
          name: 'thumbnails',
          public: true,
          allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      });
      console.log("Bucket 'thumbnails' created.");
    }
    console.log('Storage initialization complete!');
  } catch (err) {
    console.error('Error initializing storage:', err);
  }
}

initStorage();
