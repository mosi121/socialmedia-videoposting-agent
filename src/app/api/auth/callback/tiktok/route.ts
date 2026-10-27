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
        window.opener.postMessage({ type: 'OAUTH_AUTH_RESULT', success: false, platform: 'tiktok', error: 'Not connected. Try later.' }, '*');
        window.close();
      </script><p>Not connected. Try later.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/callback/tiktok`;

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.data?.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange TikTok code for access token');
    }

    const accessToken = tokenData.data.access_token;
    const refreshToken = tokenData.data.refresh_token || '';
    const openId = tokenData.data.open_id || '';

    // 2. Save in Supabase using saveSocialAccount
    if (userEmail) {
      await saveSocialAccount({
        userEmail,
        platform: 'tiktok',
        accountName: 'TikTok Profile',
        accountId: openId,
        accessToken,
        refreshToken,
      });
    }

    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'OAUTH_AUTH_RESULT', success: true, platform: 'tiktok', accountName: 'TikTok Connected' }, '*');
        window.close();
      </script><p>TikTok connected successfully! Closing...</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err: any) {
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'OAUTH_AUTH_RESULT', success: false, platform: 'tiktok', error: 'Not connected. Try later.' }, '*');
        window.close();
      </script><p>Not connected. Try later.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
