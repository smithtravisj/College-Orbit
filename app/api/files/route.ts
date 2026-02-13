import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import convert from 'heic-convert';
import { checkPremiumAccess } from '@/lib/subscription';

// POST - Upload a file (converts to base64 data URL)
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // File uploads require premium
    const premiumCheck = await checkPremiumAccess(userId);
    if (!premiumCheck.allowed) {
      return NextResponse.json(
        { error: 'premium_required', message: 'File uploads are a Premium feature. Upgrade to upload files.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Limit file size to 5MB for database storage
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    let mimeType = file.type || 'application/octet-stream';
    let fileName = file.name;
    let fileSize = file.size;

    // Convert HEIC/HEIF to JPEG on the server
    const isHeic = mimeType === 'image/heic' || mimeType === 'image/heif' ||
                   fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif');

    if (isHeic) {
      try {
        console.log('[POST /api/files] Converting HEIC to JPEG...');
        const jpegBuffer = await convert({
          buffer: buffer,
          format: 'JPEG',
          quality: 0.9,
        });
        buffer = Buffer.from(jpegBuffer);
        mimeType = 'image/jpeg';
        fileName = fileName.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
        fileSize = buffer.length;
        console.log('[POST /api/files] HEIC converted successfully, new size:', fileSize);
      } catch (heicError) {
        console.error('[POST /api/files] HEIC conversion failed:', heicError);
        return NextResponse.json({ error: 'Failed to convert HEIC file' }, { status: 400 });
      }
    }

    // Convert to base64 data URL
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      file: {
        name: fileName,
        url: dataUrl,
        size: fileSize,
      },
    });
  } catch (error) {
    console.error('[POST /api/files] Error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// DELETE - No-op for base64 files (they're deleted when removed from the entity)
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // For base64 files stored in database, deletion happens when the entity is updated
    // This endpoint just returns success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/files] Error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
