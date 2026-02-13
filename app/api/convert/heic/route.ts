import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import convert from 'heic-convert';

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string) || 'JPEG';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Limit file size to 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert HEIC to target format
    const outputFormat = format.toUpperCase() === 'PNG' ? 'PNG' : 'JPEG';
    const convertedBuffer = await convert({
      buffer: buffer,
      format: outputFormat,
      quality: 0.92,
    });

    const mimeType = outputFormat === 'PNG' ? 'image/png' : 'image/jpeg';
    const extension = outputFormat === 'PNG' ? '.png' : '.jpg';
    const newFileName = file.name.replace(/\.heic$/i, extension).replace(/\.heif$/i, extension);

    // Return as base64
    const base64 = Buffer.from(convertedBuffer).toString('base64');

    return NextResponse.json({
      data: base64,
      mimeType,
      fileName: newFileName,
    });
  } catch (error) {
    console.error('[POST /api/convert/heic] Error:', error);
    return NextResponse.json(
      { error: 'Failed to convert HEIC file. Make sure it is a valid HEIC image.' },
      { status: 500 }
    );
  }
}
