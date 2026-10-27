import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const start = Date.now();
    // Simple ping to Supabase Storage or Database to keep project active
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    const durationMs = Date.now() - start;

    return NextResponse.json({
      status: 'healthy',
      supabase: error ? 'degraded' : 'connected',
      latencyMs: durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
}
