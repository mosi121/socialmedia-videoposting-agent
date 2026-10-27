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
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}&access_token=${finalUserToken}`
    );
    const pagesData = await pagesRes.json();
    const rawPages = pagesData.data || [];

    const formattedPages: any[] = [];
    const instagramAccounts: any[] = [];

    // Parse and enrich all pages and linked Instagram accounts
    for (const p of rawPages) {
      let igData: any = null;
      if (p.instagram_business_account?.id) {
        const igId = p.instagram_business_account.id;
        let igUsername = p.instagram_business_account.username || '';

        // If username not returned directly in nested field, fetch it
        if (!igUsername) {
          try {
            const igRes = await fetch(
              `https://graph.facebook.com/v21.0/${igId}?fields=username,name&access_token=${finalUserToken}`
            );
            const fetched = await igRes.json();
            if (fetched.username) igUsername = fetched.username;
          } catch (e) {}
        }

        const cleanUsername = igUsername ? (igUsername.startsWith('@') ? igUsername : `@${igUsername}`) : `@${p.name}`;
        igData = {
          id: igId,
          username: cleanUsername,
          pageId: p.id,
          pageName: p.name,
        };

        instagramAccounts.push({
          id: igId,
          username: cleanUsername,
          pageId: p.id,
          pageName: p.name,
          accessToken: p.access_token || finalUserToken,
        });
      }

      formattedPages.push({
        id: p.id,
        name: p.name,
        accessToken: p.access_token || finalUserToken,
        instagram: igData,
      });
    }

    if (userEmail && formattedPages.length > 0) {
      // 1. Save Facebook Pages to Supabase
      const defaultPage = formattedPages[0];
      await saveSocialAccount({
        userEmail,
        platform: 'facebook',
        accountName: defaultPage.name,
        accountId: defaultPage.id,
        accessToken: defaultPage.accessToken,
        metadata: {
          user_access_token: finalUserToken,
          pages: formattedPages,
          selected_page_id: defaultPage.id,
        },
      });

      // 2. Save Instagram Account(s) to Supabase
      if (instagramAccounts.length > 0) {
        const defaultIg = instagramAccounts[0];
        await saveSocialAccount({
          userEmail,
          platform: 'instagram',
          accountName: defaultIg.username,
          accountId: defaultIg.id,
          accessToken: defaultIg.accessToken,
          metadata: {
            user_access_token: finalUserToken,
            accounts: instagramAccounts,
            selected_ig_id: defaultIg.id,
          },
        });
      }
    } else if (userEmail) {
      // Fallback if user authorized profile with no pages yet
      await saveSocialAccount({
        userEmail,
        platform: 'facebook',
        accountName: 'Meta Profile (No Pages Found)',
        accessToken: finalUserToken,
        metadata: {
          user_access_token: finalUserToken,
          pages: [],
        },
      });
    }

    const pagesCount = formattedPages.length;
    const igCount = instagramAccounts.length;
    const label = `Meta Connected (${pagesCount} FB Page${pagesCount === 1 ? '' : 's'}, ${igCount} IG Account${igCount === 1 ? '' : 's'})`;

    return new Response(
      `<html><body><script>
        window.opener.postMessage({
          type: 'OAUTH_AUTH_RESULT',
          success: true,
          platform: 'meta',
          accountName: '${label}',
          pagesCount: ${pagesCount},
          igCount: ${igCount}
        }, '*');
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
