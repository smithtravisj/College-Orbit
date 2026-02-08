import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkPremiumAccess } from '@/lib/subscription';
import OpenAI from 'openai';

const MAX_CHARS = 60000;

const SYSTEM_PROMPT = `You are an expert study assistant that creates concise, well-structured summaries of lecture notes and study materials.

Your summary should include:
- Key Takeaways: The most important points (3-7 bullets)
- Main Concepts: Brief explanations of core ideas covered
- Important Details: Specific facts, formulas, dates, or definitions worth remembering

Rules:
- Do NOT use any markdown formatting — no #, ##, **, *, or - characters for formatting
- Use plain text only
- Use "HEADING: " prefix on its own line to indicate section headers (e.g. "HEADING: Key Takeaways")
- Use "• " (bullet character) at the start of lines for list items
- Keep it concise but comprehensive — capture everything important
- Organize information logically by topic
- Highlight relationships between concepts when relevant
- Do NOT add information that isn't in the original notes`;

export const POST = withRateLimit(async function(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI summarization is not configured' },
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

    const body = await request.json();
    const text = (body.text || '').trim();

    if (!text || text.length < 30) {
      return NextResponse.json(
        { error: 'Please provide more content to summarize (at least a few sentences).' },
        { status: 400 }
      );
    }

    const truncated = text.length > MAX_CHARS;
    const inputText = truncated ? text.slice(0, MAX_CHARS) : text;

    const generateTitle = !body.title?.trim();

    const userPrompt = truncated
      ? `Summarize these notes (note: content was truncated due to length):\n\n${inputText}`
      : `Summarize these notes:\n\n${inputText}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemContent = generateTitle
      ? SYSTEM_PROMPT + '\n\nAlso generate a short, descriptive title (max 8 words) for these notes. Return a JSON object with "title" and "summary" keys. The summary should still use markdown formatting.'
      : SYSTEM_PROMPT;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      ...(generateTitle ? { response_format: { type: 'json_object' } } : {}),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI. Please try again.' },
        { status: 503 }
      );
    }

    if (generateTitle) {
      try {
        const parsed = JSON.parse(content);
        return NextResponse.json({
          summary: parsed.summary || content,
          title: parsed.title || 'AI Summary',
        });
      } catch {
        return NextResponse.json({ summary: content, title: 'AI Summary' });
      }
    }

    return NextResponse.json({ summary: content });
  } catch (error) {
    console.error('Error summarizing notes:', error);

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
      { error: 'Failed to summarize notes' },
      { status: 500 }
    );
  }
});
