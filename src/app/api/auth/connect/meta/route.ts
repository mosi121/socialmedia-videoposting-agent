import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/url';

/**
 * Initiates Meta (Facebook & Instagram) OAuth Flow
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('email') || '';
  const platform = searchParams.get('platform') || 'meta'; // 'instagram' or 'facebook' or 'meta'

  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: 'META_APP_ID is not configured in .env.local' }, { status: 500 });
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/callback/facebook`;
  const scope = [
    'email',
    'public_profile',
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    'instagram_basic',
    'instagram_content_publish',
  ].join(',');

  const state = JSON.stringify({ email: userEmail, platform });

  const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
