import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a quiz answer evaluator. Given a question, the correct answer, and a student's answer, determine if the student's answer is correct.

Rules:
- Accept answers that convey the same meaning, even if worded differently
- Accept minor spelling mistakes, abbreviations, and different formatting
- Accept answers that include extra correct details (e.g. "7927 miles" matches "About 7,927 miles")
- Accept synonyms (e.g. "living things" = "living organisms")
- Reject answers that are factually wrong or missing the key concept
- Return JSON: { "correct": true/false }`;

export const POST = withRateLimit(async function(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ correct: false, fallback: true });
    }

    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { question, correctAnswer, userAnswer } = await request.json();

    if (!question || !correctAnswer || !userAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Question: ${question}\nCorrect answer: ${correctAnswer}\nStudent's answer: ${userAnswer}` },
      ],
      temperature: 0,
      max_tokens: 20,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ correct: false, fallback: true });
    }

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({ correct: !!parsed.correct });
    } catch {
      return NextResponse.json({ correct: false, fallback: true });
    }
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return NextResponse.json({ correct: false, fallback: true });
  }
});
