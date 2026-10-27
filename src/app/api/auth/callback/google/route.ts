import { NextRequest, NextResponse } from 'next/server';
import { saveSocialAccount } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/url';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  let userEmail = '';
  try {
    if (stateParam) {
      const parsed = JSON.parse(stateParam);
      userEmail = parsed.email || '';
    }
  } catch (e) {}

  if (error || !code) {
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'OAUTH_AUTH_RESULT', success: false, platform: 'youtube', error: 'Not connected. Try later.' }, '*');
        window.close();
      </script><p>Failed to connect YouTube. You can close this window.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/callback/google`;

    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange Google OAuth code');
    }

    // 2. Fetch Channel info using access_token
    let channelTitle = 'YouTube Channel';
    let channelId = '';
    try {
      const channelRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      const channelData = await channelRes.json();
      if (channelData?.items?.[0]) {
        channelTitle = channelData.items[0].snippet.title;
        channelId = channelData.items[0].id;
      }
    } catch (e) {}

    // 3. Save into Supabase using user-scoped helper
    if (userEmail) {
      await saveSocialAccount({
        userEmail,
        platform: 'youtube',
        accountName: channelTitle,
        accountId: channelId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || '',
        expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      });
    }

    // Return popup close script with success
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'OAUTH_AUTH_RESULT', success: true, platform: 'youtube', accountName: '${channelTitle}' }, '*');
        window.close();
      </script><p>YouTube connected successfully! Closing...</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err: any) {
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'OAUTH_AUTH_RESULT', success: false, platform: 'youtube', error: 'Not connected. Try later.' }, '*');
        window.close();
      </script><p>Not connected. Try later.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
