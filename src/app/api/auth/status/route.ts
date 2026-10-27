import { NextRequest, NextResponse } from 'next/server';
import { getSocialAccountsForUser } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email')?.toLowerCase().trim() || '';

    const hasGoogleEnv = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const hasMetaEnv = Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
    const hasTikTokEnv = Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
    const hasGeminiEnv = Boolean(process.env.GEMINI_API_KEY);

    // Fetch user-specific social account connections from database
    let accounts: any[] = [];
    if (userEmail) {
      accounts = await getSocialAccountsForUser(userEmail);
    }

    // Accurate check: only true if there is an active access_token in the database
    const isConnected = (platform: string) =>
      accounts.some((a) => a.platform === platform && a.is_connected && Boolean(a.access_token));

    const getAccountName = (platform: string, fallback: string) =>
      accounts.find((a) => a.platform === platform && a.is_connected)?.account_name || fallback;

    const fbAccount = accounts.find((a) => a.platform === 'facebook' && a.is_connected && Boolean(a.access_token));
    const igAccount = accounts.find((a) => a.platform === 'instagram' && a.is_connected && Boolean(a.access_token));

    // Extract pages from Facebook metadata or fallback to current account
    const fbPages = fbAccount?.metadata?.pages || (fbAccount ? [{ id: fbAccount.account_id, name: fbAccount.account_name }] : []);
    
    // Extract Instagram accounts from Instagram metadata, or from FB metadata linked accounts, or fallback
    let igAccounts = igAccount?.metadata?.accounts || [];
    if (igAccounts.length === 0 && fbAccount?.metadata?.pages) {
      igAccounts = fbAccount.metadata.pages
        .filter((p: any) => p.instagram?.id)
        .map((p: any) => ({
          id: p.instagram.id,
          username: p.instagram.username,
          pageId: p.id,
          pageName: p.name,
        }));
    }
    if (igAccounts.length === 0 && igAccount) {
      igAccounts = [{ id: igAccount.account_id, username: igAccount.account_name }];
    }

    const isMetaConnected = Boolean(fbAccount || igAccount);

    return NextResponse.json({
      gemini: {
        configured: hasGeminiEnv,
        model: 'gemini-3.5-flash-lite',
        status: hasGeminiEnv ? 'ready' : 'missing_key',
      },
      meta: {
        configured: hasMetaEnv,
        connected: isMetaConnected,
        pages: fbPages,
        selectedPageId: fbAccount?.account_id || '',
        instagramAccounts: igAccounts,
        selectedIgId: igAccount?.account_id || '',
      },
      youtube: {
        configured: hasGoogleEnv,
        connected: isConnected('youtube'),
        accountName: getAccountName('youtube', 'YouTube Channel'),
      },
      instagram: {
        configured: hasMetaEnv,
        connected: isConnected('instagram'),
        accountName: getAccountName('instagram', 'Instagram Account'),
        accountId: igAccount?.account_id || '',
        accounts: igAccounts,
        selectedIgId: igAccount?.account_id || '',
      },
      facebook: {
        configured: hasMetaEnv,
        connected: isConnected('facebook'),
        accountName: getAccountName('facebook', 'Facebook Page'),
        accountId: fbAccount?.account_id || '',
        pages: fbPages,
        selectedPageId: fbAccount?.account_id || '',
      },
      tiktok: {
        configured: hasTikTokEnv,
        connected: isConnected('tiktok'),
        accountName: getAccountName('tiktok', 'TikTok Profile'),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
