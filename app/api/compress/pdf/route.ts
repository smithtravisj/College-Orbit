import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { writeFile, readFile, unlink, mkdtemp } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { tmpdir } from 'os';

const execFileAsync = promisify(execFile);

const QUALITY_SETTINGS: Record<string, string> = {
  low: '/screen',      // 72 DPI — max compression
  medium: '/ebook',    // 150 DPI — balanced
  high: '/printer',    // 300 DPI — light compression
};

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

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

    const pdfSettings = QUALITY_SETTINGS[quality] || QUALITY_SETTINGS.medium;

    tempDir = await mkdtemp(join(tmpdir(), 'pdf-compress-'));
    const inputPath = join(tempDir, 'input.pdf');
    const outputPath = join(tempDir, 'output.pdf');

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(inputPath, Buffer.from(arrayBuffer));

    await execFileAsync('gs', [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${pdfSettings}`,
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      `-sOutputFile=${outputPath}`,
      inputPath,
    ], { timeout: 120000 });

    const outputBuffer = await readFile(outputPath);
    const base64 = outputBuffer.toString('base64');

    return NextResponse.json({
      data: base64,
      mimeType: 'application/pdf',
      originalSize: file.size,
      compressedSize: outputBuffer.length,
    });
  } catch (error) {
    console.error('[POST /api/compress/pdf] Error:', error);

    const message = error instanceof Error && error.message?.includes('ENOENT')
      ? 'PDF compression is not available — Ghostscript is required on the server.'
      : 'Failed to compress PDF.';

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempDir) {
      const inputPath = join(tempDir, 'input.pdf');
      const outputPath = join(tempDir, 'output.pdf');
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
      const { rmdir } = await import('fs/promises');
      await rmdir(tempDir).catch(() => {});
    }
  }
}
