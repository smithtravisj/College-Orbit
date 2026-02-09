import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import JSZip from 'jszip';
import sharp from 'sharp';

const QUALITY_MAP: Record<string, { quality: number; maxDimension: number | null }> = {
  low:    { quality: 40, maxDimension: 1280 },   // max compression
  medium: { quality: 65, maxDimension: 1920 },   // balanced
  high:   { quality: 85, maxDimension: null },    // light compression
};

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.tif', '.webp'];
const MEDIA_DIRS = ['ppt/media/', 'word/media/', 'xl/media/'];

function isCompressibleImage(path: string): boolean {
  const lower = path.toLowerCase();
  return MEDIA_DIRS.some(dir => lower.startsWith(dir)) &&
    IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const quality = (formData.get('quality') as string) || 'medium';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 150 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 150MB' }, { status: 400 });
    }

    const settings = QUALITY_MAP[quality] || QUALITY_MAP.medium;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const imageEntries: string[] = [];
    zip.forEach((relativePath) => {
      if (isCompressibleImage(relativePath)) {
        imageEntries.push(relativePath);
      }
    });

    if (imageEntries.length === 0) {
      return NextResponse.json({
        error: 'No compressible images found in this file.',
      }, { status: 400 });
    }

    for (const imagePath of imageEntries) {
      const originalData = await zip.file(imagePath)!.async('nodebuffer');
      const lower = imagePath.toLowerCase();

      try {
        let pipeline = sharp(originalData);
        const metadata = await pipeline.metadata();

        // Resize if needed
        if (settings.maxDimension && metadata.width && metadata.height) {
          const maxDim = Math.max(metadata.width, metadata.height);
          if (maxDim > settings.maxDimension) {
            pipeline = pipeline.resize({
              width: metadata.width > metadata.height ? settings.maxDimension : undefined,
              height: metadata.height >= metadata.width ? settings.maxDimension : undefined,
              fit: 'inside',
              withoutEnlargement: true,
            });
          }
        }

        let compressedData: Buffer;
        if (lower.endsWith('.png')) {
          compressedData = await pipeline.png({ quality: settings.quality, compressionLevel: 9 }).toBuffer();
        } else if (lower.endsWith('.gif')) {
          // sharp has limited GIF support, skip
          continue;
        } else {
          // JPEG and other formats -> compress as JPEG
          compressedData = await pipeline.jpeg({ quality: settings.quality, mozjpeg: true }).toBuffer();
        }

        // Only use compressed version if it's actually smaller
        if (compressedData.length < originalData.length) {
          zip.file(imagePath, compressedData);
        }
      } catch {
        // If sharp fails on an image, skip it
        continue;
      }
    }

    const compressedBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    const base64 = compressedBuffer.toString('base64');

    // Determine mime type from original filename
    const ext = file.name.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return NextResponse.json({
      data: base64,
      mimeType: mimeTypes[ext || ''] || 'application/octet-stream',
      originalSize: file.size,
      compressedSize: compressedBuffer.length,
    });
  } catch (error) {
    console.error('[POST /api/compress/office] Error:', error);
    return NextResponse.json({ error: 'Failed to compress Office file.' }, { status: 500 });
  }
}
