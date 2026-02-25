import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import libre from 'libreoffice-convert';
import { promisify } from 'util';

const convertWithOptions = promisify(libre.convertWithOptions);

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const format = (formData.get('format') as string) || 'pptx';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Limit file size to 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const ext = `.${format}`;
    const outputBuffer = await convertWithOptions(inputBuffer, ext, undefined, {
      sofficeAdditionalArgs: ['--invisible', '--nologo', '--nofirststartwizard'],
    });

    const mimeTypes: Record<string, string> = {
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      pdf: 'application/pdf',
    };

    const base64 = Buffer.from(outputBuffer).toString('base64');

    return NextResponse.json({
      data: base64,
      mimeType: mimeTypes[format] || 'application/octet-stream',
      format,
    });
  } catch (error) {
    console.error('[POST /api/convert/ppt] Error:', error);

    const message = error instanceof Error && error.message?.includes('ENOENT')
      ? '.ppt conversion is not available — LibreOffice is required. Please use a .pptx file instead.'
      : 'Failed to convert PowerPoint file.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
