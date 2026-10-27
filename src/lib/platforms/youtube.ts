/**
 * YouTube Data API v3 Video & Shorts Publisher
 */

export interface YouTubePublishParams {
  accessToken: string;
  refreshToken?: string;
  title: string;
  description: string;
  tags?: string[];
  videoUrl: string; // Public or accessible video URL (e.g. Supabase storage)
  privacyStatus?: 'public' | 'unlisted' | 'private';
  isShort?: boolean;
}

export interface PublishResult {
  success: boolean;
  platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok';
  postId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * Refreshes an expired Google OAuth access token using the stored refresh token
 */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured in .env.local');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh Google access token: ${errorData}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Publishes a video / short to YouTube using the YouTube Data API v3 Resumable Upload
 */
export async function publishToYouTube(params: YouTubePublishParams): Promise<PublishResult> {
  try {
    let activeToken = params.accessToken;

    // 1. Prepare snippet and metadata
    let formattedTitle = params.title;
    let formattedDescription = params.description;

    if (params.isShort) {
      if (!formattedTitle.toLowerCase().includes('#shorts')) {
        formattedTitle = `${formattedTitle.slice(0, 90)} #Shorts`;
      }
      if (!formattedDescription.toLowerCase().includes('#shorts')) {
        formattedDescription = `${formattedDescription}\n\n#Shorts`;
      }
    }

    const metadata = {
      snippet: {
        title: formattedTitle.slice(0, 100),
        description: formattedDescription.slice(0, 5000),
        tags: params.tags?.slice(0, 30) || [],
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: params.privacyStatus || 'public',
        selfDeclaredMadeForKids: false,
      },
    };

    // 2. Fetch the video binary from staging storage
    const videoResponse = await fetch(params.videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download staged video from ${params.videoUrl}`);
    }
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoSize = videoBuffer.byteLength;

    // 3. Initiate Resumable Upload Session
    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': videoSize.toString(),
          'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (initRes.status === 401 && params.refreshToken) {
      // Token expired, refresh and retry once
      const refreshed = await refreshGoogleAccessToken(params.refreshToken);
      activeToken = refreshed.accessToken;
      return publishToYouTube({ ...params, accessToken: activeToken });
    }

    if (!initRes.ok) {
      const err = await initRes.text();
      throw new Error(`YouTube upload initiation failed: ${err}`);
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('YouTube did not return a valid upload session Location header');
    }

    // 4. Upload Video Binary
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoSize.toString(),
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      throw new Error(`YouTube video binary upload failed: ${uploadErr}`);
    }

    const uploadData = await uploadRes.json();
    const videoId = uploadData.id;

    return {
      success: true,
      platform: 'youtube',
      postId: videoId,
      postUrl: params.isShort
        ? `https://www.youtube.com/shorts/${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (error: any) {
    return {
      success: false,
      platform: 'youtube',
      error: error.message || 'Unknown YouTube publishing error',
    };
  }
}
