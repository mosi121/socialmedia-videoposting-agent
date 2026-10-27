import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/url';

/**
 * Initiates TikTok OAuth 2.0 Flow
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('email') || '';

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) {
    return NextResponse.json({ error: 'TIKTOK_CLIENT_KEY is not configured in .env.local' }, { status: 500 });
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/callback/tiktok`;
  const scope = 'user.info.basic,video.upload,video.publish';
  const state = JSON.stringify({ email: userEmail });

  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key', clientKey);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
