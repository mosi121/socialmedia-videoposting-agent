import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ONLY these two users are authorized to use this tool
const AUTHORIZED_USERS: Record<string, { name: string; passwordHashOrPlain: string; role: string }> = {
  'amorousbrood@gmail.com': {
    name: 'Amorous Brood',
    passwordHashOrPlain: '0304880mM@',
    role: 'creator',
  },
  'fatimamohsinkhokhar29@gmail.com': {
    name: 'Fatima Mohsin Khokhar',
    role: 'creator',
    passwordHashOrPlain: '0304880mM@',
  },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Strict Whitelist Check: Reject any unauthorized email
    const authorizedProfile = AUTHORIZED_USERS[cleanEmail];
    if (!authorizedProfile) {
      return NextResponse.json(
        { error: 'Access denied. This tool is private and restricted to authorized team members only.' },
        { status: 403 }
      );
    }

    // 2. Validate Password against Supabase Auth
    let userSessionToken = '';
    let supabaseUserId = '';

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (authData?.user && authData?.session) {
      userSessionToken = authData.session.access_token;
      supabaseUserId = authData.user.id;
    } else {
      // Fallback check against verified password
      if (password === authorizedProfile.passwordHashOrPlain) {
        userSessionToken = `team_session_${Buffer.from(cleanEmail).toString('base64')}_${Date.now()}`;
        supabaseUserId = `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      } else {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
      }
    }

    // Return isolated user profile with unique identifier
    const user = {
      id: supabaseUserId,
      email: cleanEmail,
      name: authorizedProfile.name,
      role: authorizedProfile.role,
    };

    return NextResponse.json({
      success: true,
      user,
      token: userSessionToken,
    });
  } catch (error: any) {
    console.error('Auth login error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
