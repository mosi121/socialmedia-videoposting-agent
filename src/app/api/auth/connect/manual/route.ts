import { NextRequest, NextResponse } from 'next/server';
import { saveSocialAccount } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userEmail, platform, accessToken, accountName, accountId } = await req.json();

    if (!userEmail || !platform || !accessToken) {
      return NextResponse.json({ error: 'userEmail, platform, and accessToken are required' }, { status: 400 });
    }

    await saveSocialAccount({
      userEmail,
      platform,
      accountName: accountName || `${platform.toUpperCase()} Account`,
      accountId: accountId || '',
      accessToken,
    });

    return NextResponse.json({ success: true, message: `${platform.toUpperCase()} connected successfully!` });
  } catch (err: any) {
    return NextResponse.json({ error: 'Not connected. Try later.' }, { status: 500 });
  }
}
