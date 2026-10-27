import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for public / authenticated user actions in browser or server components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend server operations (bypasses RLS, manages buckets, stores encrypted tokens)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const STORAGE_BUCKET_VIDEOS = 'videos';
export const STORAGE_BUCKET_THUMBNAILS = 'thumbnails';

export interface SocialAccountRecord {
  id?: string;
  user_email: string;
  platform: 'youtube' | 'instagram' | 'facebook' | 'tiktok';
  account_name: string;
  account_id?: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number | null;
  is_connected: boolean;
  metadata?: Record<string, any>;
  updated_at?: string;
}

/**
 * Saves or updates a social account record scoped strictly to a userEmail.
 * Works seamlessly with both jsonb metadata and direct columns.
 */
export async function saveSocialAccount(params: {
  userEmail: string;
  platform: string;
  accountName?: string;
  accountId?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number | null;
  metadata?: Record<string, any>;
}) {
  const email = params.userEmail.toLowerCase().trim();
  const plat = params.platform.toLowerCase().trim();

  // 1. Check for existing record for (platform, user_email)
  const { data: existingList } = await supabaseAdmin
    .from('social_accounts')
    .select('id, metadata')
    .eq('platform', plat)
    .eq('metadata->>user_email', email);

  const existingRow = existingList?.[0];
  const existingId = existingRow?.id;
  const mergedMetadata = {
    ...(existingRow?.metadata || {}),
    user_email: email,
    ...(params.metadata || {}),
  };

  if (existingId) {
    const { error } = await supabaseAdmin
      .from('social_accounts')
      .update({
        account_name: params.accountName || `${plat.toUpperCase()} Account`,
        account_id: params.accountId || '',
        access_token: params.accessToken,
        refresh_token: params.refreshToken || '',
        expires_at: params.expiresAt || null,
        is_connected: true,
        metadata: mergedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingId);

    if (error) throw error;
    return existingId;
  } else {
    const { data: newRow, error } = await supabaseAdmin
      .from('social_accounts')
      .insert({
        platform: plat,
        account_name: params.accountName || `${plat.toUpperCase()} Account`,
        account_id: params.accountId || '',
        access_token: params.accessToken,
        refresh_token: params.refreshToken || '',
        expires_at: params.expiresAt || null,
        is_connected: true,
        metadata: mergedMetadata,
        updated_at: new Date().toISOString(),
      })
      .select('id');

    if (error) throw error;
    return newRow?.[0]?.id;
  }
}

/**
 * Retrieves all connected social accounts belonging strictly to a userEmail.
 */
export async function getSocialAccountsForUser(userEmail: string) {
  const email = userEmail.toLowerCase().trim();
  if (!email) return [];

  const { data, error } = await supabaseAdmin
    .from('social_accounts')
    .select('*')
    .eq('metadata->>user_email', email);

  if (error) {
    console.warn('Error fetching social accounts for user:', error);
    return [];
  }
  return data || [];
}
