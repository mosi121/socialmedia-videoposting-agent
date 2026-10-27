import { NextRequest, NextResponse } from 'next/server';
import { publishToYouTube } from '@/lib/platforms/youtube';
import { publishToInstagramReels, publishToFacebookPage } from '@/lib/platforms/meta';
import { publishToTikTok } from '@/lib/platforms/tiktok';
import { getSocialAccountsForUser } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      videoUrl,
      platforms,
      contentPack,
      userEmail, // Specific authenticated user
    } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const cleanUserEmail = userEmail?.toLowerCase()?.trim() || '';

    // Fetch this specific user's connected accounts from Supabase
    let accounts: any[] = [];
    if (cleanUserEmail) {
      accounts = await getSocialAccountsForUser(cleanUserEmail);
    }

    const getAccount = (platform: string) => accounts.find((a) => a.platform === platform && a.is_connected);

    const results: Record<string, any> = {};
    const publishPromises: Promise<any>[] = [];

    // 1. YouTube Publishing
    if (platforms?.youtube && contentPack?.youtube) {
      const ytAccount = getAccount('youtube');
      if (ytAccount?.access_token) {
        publishPromises.push(
          publishToYouTube({
            accessToken: ytAccount.access_token,
            refreshToken: ytAccount.refresh_token,
            title: contentPack.youtube.title,
            description: `${contentPack.youtube.description}\n\n${contentPack.youtube.hashtags?.join(' ') || ''}`,
            tags: contentPack.youtube.hashtags?.map((t: string) => t.replace('#', '')),
            videoUrl,
            isShort: contentPack.youtube.isShort,
          }).then((res) => {
            results.youtube = res;
          })
        );
      } else {
        results.youtube = {
          success: false,
          platform: 'youtube',
          error: `YouTube channel not connected yet for ${cleanUserEmail || 'this user'}.`,
        };
      }
    }

    // 2. Instagram Publishing
    if (platforms?.instagram && contentPack?.instagram) {
      const igAccount = getAccount('instagram');
      if (igAccount?.access_token && igAccount?.account_id) {
        publishPromises.push(
          publishToInstagramReels({
            accessToken: igAccount.access_token,
            instagramAccountId: igAccount.account_id,
            videoUrl,
            caption: `${contentPack.instagram.description}\n\n${contentPack.instagram.hashtags?.join(' ') || ''}`,
          }).then((res) => {
            results.instagram = res;
          })
        );
      } else {
        results.instagram = {
          success: false,
          platform: 'instagram',
          error: `Instagram account not connected yet for ${cleanUserEmail || 'this user'}.`,
        };
      }
    }

    // 3. Facebook Publishing
    if (platforms?.facebook && contentPack?.facebook) {
      const fbAccount = getAccount('facebook');
      if (fbAccount?.access_token && fbAccount?.account_id) {
        publishPromises.push(
          publishToFacebookPage({
            accessToken: fbAccount.access_token,
            facebookPageId: fbAccount.account_id,
            videoUrl,
            title: contentPack.facebook.title,
            description: `${contentPack.facebook.description}\n\n${contentPack.facebook.discussionQuestion || ''}\n\n${contentPack.facebook.hashtags?.join(' ') || ''}`,
          }).then((res) => {
            results.facebook = res;
          })
        );
      } else {
        results.facebook = {
          success: false,
          platform: 'facebook',
          error: `Facebook Page not connected yet for ${cleanUserEmail || 'this user'}.`,
        };
      }
    }

    // 4. TikTok Publishing
    if (platforms?.tiktok && contentPack?.tiktok) {
      const ttAccount = getAccount('tiktok');
      if (ttAccount?.access_token) {
        publishPromises.push(
          publishToTikTok({
            accessToken: ttAccount.access_token,
            videoUrl,
            caption: `${contentPack.tiktok.title}\n\n${contentPack.tiktok.description || ''}\n\n${contentPack.tiktok.hashtags?.join(' ') || ''}`,
          }).then((res) => {
            results.tiktok = res;
          })
        );
      } else {
        results.tiktok = {
          success: false,
          platform: 'tiktok',
          error: `TikTok account not connected yet for ${cleanUserEmail || 'this user'}.`,
        };
      }
    }

    await Promise.allSettled(publishPromises);

    // Save history scoped to this user
    try {
      await supabaseAdmin.from('video_posts').insert({
        title: contentPack.youtube?.title || contentPack.instagram?.title || 'Video Post',
        raw_video_url: videoUrl,
        created_by: cleanUserEmail,
        status: Object.values(results).some((r) => r.success) ? 'published' : 'failed',
        approved_copy: contentPack,
        platform_results: results,
      });
    } catch (dbErr) {
      console.warn('Could not save post history to database:', dbErr);
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Publish API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch video publishing' },
      { status: 500 }
    );
  }
}
