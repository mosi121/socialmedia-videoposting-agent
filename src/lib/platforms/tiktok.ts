import { PublishResult } from './youtube';

/**
 * TikTok Content Posting API (Direct Post & Pull From URL)
 */

export interface TikTokPublishParams {
  accessToken: string;
  videoUrl: string; // Public HTTPS URL from Supabase Storage
  caption: string;
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
}

/**
 * Publishes a video to TikTok via the official Content Posting API v2
 */
export async function publishToTikTok(params: TikTokPublishParams): Promise<PublishResult> {
  try {
    const {
      accessToken,
      videoUrl,
      caption,
      privacyLevel = 'PUBLIC_TO_EVERYONE',
      disableComment = false,
      disableDuet = false,
      disableStitch = false,
    } = params;

    // 1. Initialize Direct Video Post with PULL_FROM_URL (TikTok fetches directly from Supabase Storage)
    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: caption.slice(0, 2200),
          privacy_level: privacyLevel,
          disable_duet: disableDuet,
          disable_stitch: disableStitch,
          disable_comment: disableComment,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      }),
    });

    const initData = await initRes.json();

    if (!initRes.ok || initData.error?.code !== 'ok') {
      throw new Error(`TikTok Direct Post failed: ${initData.error?.message || JSON.stringify(initData)}`);
    }

    const publishId = initData.data?.publish_id;

    // 2. Poll TikTok publish status for up to 30 seconds
    let status = 'PROCESSING';
    let attempts = 0;
    const maxAttempts = 10;

    while (status !== 'PUBLISH_COMPLETE' && status !== 'FAILED' && attempts < maxAttempts) {
      attempts++;
      await new Promise((res) => setTimeout(res, 3000));

      const statusRes = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publish_id: publishId }),
      });

      const statusData = await statusRes.json();
      if (statusData.data?.status) {
        status = statusData.data.status;
      }
    }

    if (status === 'FAILED') {
      throw new Error('TikTok reported video processing failed on their servers.');
    }

    return {
      success: true,
      platform: 'tiktok',
      postId: publishId,
      postUrl: `https://www.tiktok.com/@me`, // Direct post link is provided via TikTok inbox or profile
    };
  } catch (error: any) {
    return {
      success: false,
      platform: 'tiktok',
      error: error.message || 'TikTok publishing error',
    };
  }
}
