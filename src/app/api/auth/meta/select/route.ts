import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Allows the creator to switch the active Facebook Page or Instagram Account
 * without needing to re-authenticate with Meta.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, pageId, igAccountId } = body;

    const email = userEmail?.toLowerCase()?.trim();
    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    // 1. Switch Active Facebook Page
    if (pageId) {
      const { data: fbRows } = await supabaseAdmin
        .from('social_accounts')
        .select('*')
        .eq('platform', 'facebook')
        .eq('metadata->>user_email', email);

      const fbRow = fbRows?.[0];
      if (!fbRow) {
        return NextResponse.json({ error: 'Facebook account not found' }, { status: 404 });
      }

      const pages = fbRow.metadata?.pages || [];
      const targetPage = pages.find((p: any) => p.id === pageId);

      if (!targetPage) {
        return NextResponse.json({ error: `Page ${pageId} not found in user's authorized pages` }, { status: 404 });
      }

      // Update Facebook active row
      await supabaseAdmin
        .from('social_accounts')
        .update({
          account_id: targetPage.id,
          account_name: targetPage.name,
          access_token: targetPage.accessToken,
          metadata: {
            ...fbRow.metadata,
            selected_page_id: targetPage.id,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', fbRow.id);

      // If this page is linked to an Instagram account, auto-link it for convenience
      if (targetPage.instagram?.id) {
        const { data: igRows } = await supabaseAdmin
          .from('social_accounts')
          .select('*')
          .eq('platform', 'instagram')
          .eq('metadata->>user_email', email);

        const igRow = igRows?.[0];
        if (igRow) {
          await supabaseAdmin
            .from('social_accounts')
            .update({
              account_id: targetPage.instagram.id,
              account_name: targetPage.instagram.username,
              access_token: targetPage.accessToken,
              metadata: {
                ...igRow.metadata,
                selected_ig_id: targetPage.instagram.id,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', igRow.id);
        }
      }
    }

    // 2. Switch Active Instagram Account explicitly
    if (igAccountId) {
      const { data: igRows } = await supabaseAdmin
        .from('social_accounts')
        .select('*')
        .eq('platform', 'instagram')
        .eq('metadata->>user_email', email);

      const igRow = igRows?.[0];
      if (igRow) {
        const accounts = igRow.metadata?.accounts || [];
        const targetIg = accounts.find((a: any) => a.id === igAccountId);
        if (targetIg) {
          await supabaseAdmin
            .from('social_accounts')
            .update({
              account_id: targetIg.id,
              account_name: targetIg.username,
              access_token: targetIg.accessToken,
              metadata: {
                ...igRow.metadata,
                selected_ig_id: targetIg.id,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', igRow.id);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Active Meta destination updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to switch Meta destination' }, { status: 500 });
  }
}
