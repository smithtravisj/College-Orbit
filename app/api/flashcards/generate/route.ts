import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkPremiumAccess } from '@/lib/subscription';
import OpenAI from 'openai';

const MAX_CHARS = 60000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for images
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

const SYSTEM_PROMPT = `You are an expert study assistant that creates high-quality flashcards from lecture notes and study materials.

Rules:
- Create as many flashcards as needed to thoroughly cover ALL the material — typically 3-5 cards per major topic or lecture
- For lengthy notes covering multiple lectures/chapters, generate 40-80+ cards
- Each flashcard should test a single concept, definition, or fact
- The "front" should be a clear question or prompt
- The "back" should be a concise, accurate answer
- Include cards for: definitions, key facts, formulas, processes, comparisons, and specific examples mentioned in the notes
- Don't skip over details — if the notes mention specific numbers, dates, or examples, make cards for them
- Cover the key topics from the material evenly
- Keep answers concise (1-3 sentences max)

Return a JSON object with a "cards" key containing an array of objects, each with "front" and "back" string fields.`;

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Import the core lib directly to avoid pdf-parse's index.js which tries to open a test file
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdf = require('pdf-parse/lib/pdf-parse');
  const data = await pdf(buffer);
  return data.text;
}

export const POST = withRateLimit(async function(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI generation is not configured' },
        { status: 500 }
      );
    }

    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const accessCheck = await checkPremiumAccess(userId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: 'premium_required', message: accessCheck.message },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawText = formData.get('text') as string | null;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size must be under 10MB' },
          { status: 400 }
        );
      }

      const isImage = IMAGE_TYPES.includes(file.type);
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        return NextResponse.json(
          { error: 'Supported file types: PDF, PNG, JPG, WebP, GIF' },
          { status: 400 }
        );
      }

      if (isImage) {
        // Send image directly to vision model
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Create flashcards from these lecture notes/study material in the image:' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ];
      } else {
        // PDF — extract text
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const text = await extractPdfText(buffer);

          if (!text || text.trim().length < 50) {
            return NextResponse.json(
              { error: 'Could not extract enough text from this PDF. It may be scanned or image-based — try uploading it as an image instead.' },
              { status: 400 }
            );
          }

          const trimmed = text.trim();
          const truncated = trimmed.length > MAX_CHARS;
          const inputText = truncated ? trimmed.slice(0, MAX_CHARS) : trimmed;

          const userPrompt = truncated
            ? `Create flashcards from these lecture notes (note: content was truncated due to length):\n\n${inputText}`
            : `Create flashcards from these lecture notes:\n\n${inputText}`;

          messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ];
        } catch (pdfError) {
          console.error('PDF parse error:', pdfError);
          return NextResponse.json(
            { error: 'Could not read this PDF file. Try uploading as an image or pasting the text manually.' },
            { status: 400 }
          );
        }
      }
    } else if (rawText) {
      const text = rawText.trim();

      if (!text || text.length < 50) {
        return NextResponse.json(
          { error: 'Please provide more content to generate flashcards (at least a few sentences)' },
          { status: 400 }
        );
      }

      const truncated = text.length > MAX_CHARS;
      const inputText = truncated ? text.slice(0, MAX_CHARS) : text;

      const userPrompt = truncated
        ? `Create flashcards from these lecture notes (note: content was truncated due to length):\n\n${inputText}`
        : `Create flashcards from these lecture notes:\n\n${inputText}`;

      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ];
    } else {
      return NextResponse.json(
        { error: 'Please provide text or upload a file' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI. Please try again.' },
        { status: 503 }
      );
    }

    let parsed: { cards?: { front: string; back: string }[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
    const validCards = cards
      .filter((c) => typeof c.front === 'string' && typeof c.back === 'string'
        && c.front.trim() && c.back.trim())
      .map((c) => ({ front: c.front.trim(), back: c.back.trim() }));

    if (validCards.length === 0) {
      return NextResponse.json(
        { error: 'Could not generate flashcards from this content. Try providing more detailed notes.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ cards: validCards });
  } catch (error) {
    console.error('Error generating flashcards:', error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'AI service is busy. Please try again in a moment.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'AI service error. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
});
