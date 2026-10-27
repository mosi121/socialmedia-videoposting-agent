import { PublishResult } from './youtube';

/**
 * Meta Graph API (Instagram Reels & Facebook Page Video Publishing)
 */

export interface MetaPublishParams {
  accessToken: string; // Long-lived Page Access Token or User Access Token
  videoUrl: string;    // Public HTTPS URL from Supabase Storage
  caption: string;
  title?: string;
  instagramAccountId?: string; // Connected IG Business/Creator Account ID
  facebookPageId?: string;     // Facebook Page ID
}

/**
 * Publishes an Instagram Reel via Meta Graph API Container Workflow
 */
export async function publishToInstagramReels(params: {
  accessToken: string;
  instagramAccountId: string;
  videoUrl: string;
  caption: string;
}): Promise<PublishResult> {
  try {
    const { accessToken, instagramAccountId, videoUrl, caption } = params;

    // 1. Create Media Container
    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: videoUrl,
          caption: caption,
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      throw new Error(`IG Container creation failed: ${JSON.stringify(containerData)}`);
    }

    const creationId = containerData.id;

    // 2. Poll Container Status until ready (Meta encodes & transcodes the video)
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!isReady && attempts < maxAttempts) {
      attempts++;
      await new Promise((res) => setTimeout(res, 3000)); // wait 3s between checks

      const statusRes = await fetch(
        `https://graph.facebook.com/v21.0/${creationId}?fields=status_code&access_token=${accessToken}`
      );
      const statusData = await statusRes.json();

      if (statusData.status_code === 'FINISHED') {
        isReady = true;
      } else if (statusData.status_code === 'ERROR') {
        throw new Error(`Instagram video processing error on Meta servers.`);
      }
    }

    if (!isReady) {
      throw new Error('Timed out waiting for Instagram Reel to finish processing on Meta servers.');
    }

    // 3. Publish the Container
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      throw new Error(`Instagram Media Publish failed: ${JSON.stringify(publishData)}`);
    }

    return {
      success: true,
      platform: 'instagram',
      postId: publishData.id,
      postUrl: `https://www.instagram.com/reel/${publishData.id}`,
    };
  } catch (error: any) {
    return {
      success: false,
      platform: 'instagram',
      error: error.message || 'Instagram publishing error',
    };
  }
}

/**
 * Publishes a Video / Reel to a Facebook Page via Graph API
 */
export async function publishToFacebookPage(params: {
  accessToken: string;
  facebookPageId: string;
  videoUrl: string;
  title?: string;
  description: string;
}): Promise<PublishResult> {
  try {
    const { accessToken, facebookPageId, videoUrl, title, description } = params;

    const postRes = await fetch(
      `https://graph.facebook.com/v21.0/${facebookPageId}/videos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: videoUrl,
          title: title || 'New Video',
          description: description,
          access_token: accessToken,
        }),
      }
    );

    const postData = await postRes.json();
    if (!postRes.ok || !postData.id) {
      throw new Error(`Facebook video publishing failed: ${JSON.stringify(postData)}`);
    }

    return {
      success: true,
      platform: 'facebook',
      postId: postData.id,
      postUrl: `https://www.facebook.com/${facebookPageId}/videos/${postData.id}`,
    };
  } catch (error: any) {
    return {
      success: false,
      platform: 'facebook',
      error: error.message || 'Facebook publishing error',
    };
  }
}
