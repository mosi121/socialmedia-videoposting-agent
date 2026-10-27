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

    return NextResponse.json({
      gemini: {
        configured: hasGeminiEnv,
        model: 'gemini-3.5-flash-lite',
        status: hasGeminiEnv ? 'ready' : 'missing_key',
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
      },
      facebook: {
        configured: hasMetaEnv,
        connected: isConnected('facebook'),
        accountName: getAccountName('facebook', 'Facebook Page'),
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
