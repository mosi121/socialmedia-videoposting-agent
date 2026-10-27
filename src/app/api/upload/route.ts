import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, STORAGE_BUCKET_VIDEOS } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Verify it is a video
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Uploaded file must be a video' }, { status: 400 });
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `uploads/${timestamp}_${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_VIDEOS)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return NextResponse.json({ error: `Storage upload failed: ${error.message}` }, { status: 500 });
    }

    // Get Public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET_VIDEOS)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('Video upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error while uploading video' },
      { status: 500 }
    );
  }
}
