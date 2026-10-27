import { NextRequest, NextResponse } from 'next/server';
import { saveSocialAccount } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/url';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  let userEmail = '';
  let targetPlatform = 'instagram';

  try {
    if (stateParam) {
      const parsed = JSON.parse(stateParam);
      userEmail = parsed.email || '';
      if (parsed.platform) targetPlatform = parsed.platform;
    }
  } catch (e) {}

  if (error || !code) {
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'OAUTH_AUTH_RESULT', success: false, platform: '${targetPlatform}', error: 'Not connected. Try later.' }, '*');
        window.close();
      </script><p>Not connected. Try later.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const baseUrl = getBaseUrl(req);
    const redirectUri = `${baseUrl}/api/auth/callback/facebook`;

    // 1. Exchange code for short-lived user access token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || 'Failed to exchange Meta code for access token');
    }

    const userAccessToken = tokenData.access_token;

    // 2. Exchange for long-lived user token (lasts 60 days)
    const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${userAccessToken}`;
    const longRes = await fetch(longLivedUrl);
    const longData = await longRes.json();
    const finalUserToken = longData.access_token || userAccessToken;

    // 3. Fetch user's Facebook Pages and connected Instagram accounts
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${finalUserToken}`
    );
    const pagesData = await pagesRes.json();
    const pages = pagesData.data || [];

    let connectedNames: string[] = [];

    // Save Facebook Page(s) & Instagram accounts using saveSocialAccount
    if (pages.length > 0 && userEmail) {
      for (const page of pages) {
        // Save Facebook Page
        await saveSocialAccount({
          userEmail,
          platform: 'facebook',
          accountName: page.name,
          accountId: page.id,
          accessToken: page.access_token || finalUserToken,
        });
        connectedNames.push(`FB: ${page.name}`);

        // If Page is linked to Instagram Business account
        if (page.instagram_business_account?.id) {
          const igId = page.instagram_business_account.id;
          let igUsername = page.name;
          try {
            const igRes = await fetch(`https://graph.facebook.com/v21.0/${igId}?fields=username&access_token=${finalUserToken}`);
            const igData = await igRes.json();
            if (igData.username) igUsername = `@${igData.username}`;
          } catch (e) {}

          await saveSocialAccount({
            userEmail,
            platform: 'instagram',
            accountName: igUsername,
            accountId: igId,
            accessToken: finalUserToken,
          });
          connectedNames.push(`IG: ${igUsername}`);
        }
      }
    } else if (userEmail) {
      // Save general Meta account if no specific pages exist yet
      await saveSocialAccount({
        userEmail,
        platform: targetPlatform === 'facebook' ? 'facebook' : 'instagram',
        accountName: 'Meta Account',
        accessToken: finalUserToken,
      });
    }

    const label = connectedNames.join(', ') || 'Meta Connected';

    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'OAUTH_AUTH_RESULT', success: true, platform: '${targetPlatform}', accountName: '${label}' }, '*');
        window.close();
      </script><p>${label} connected successfully! Closing...</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err: any) {
    return new Response(
      `<html><body><script>
        window.opener.postMessage({ type: 'OAUTH_AUTH_RESULT', success: false, platform: '${targetPlatform}', error: 'Not connected. Try later.' }, '*');
        window.close();
      </script><p>Not connected. Try later.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
