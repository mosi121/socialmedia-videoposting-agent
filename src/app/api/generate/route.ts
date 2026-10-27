import { NextRequest, NextResponse } from 'next/server';
import { generateSocialContent } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, userNotes, tone, isShortForm } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Video topic or title is required' }, { status: 400 });
    }

    const socialPack = await generateSocialContent({
      topic,
      userNotes,
      tone,
      isShortForm: isShortForm !== false,
    });

    return NextResponse.json({
      success: true,
      data: socialPack,
    });
  } catch (error: any) {
    console.error('AI Generation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate social media content pack' },
      { status: 500 }
    );
  }
}
