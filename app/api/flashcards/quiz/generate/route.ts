import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkPremiumAccess } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a quiz generator for flashcard study. Given a set of flashcard pairs (front/back), generate quiz questions to test the student's knowledge.

Rules:
- Generate a mix of multiple-choice (mc) and short-answer (short) questions
- For multiple-choice: provide exactly 4 options with 1 correct answer. Use other cards' answers as plausible distractors when possible.
- For short-answer: the correct answer should be concise (1-5 words ideally)
- Questions should test understanding, not just rote memorization
- Base questions directly on the flashcard content
- Generate enough questions to thoroughly cover the material (3-20 questions depending on deck size). Aim for roughly 1 question per 1-2 cards, up to 20 max.
- Return valid JSON with a "questions" array containing objects with:
  - "id": string (q1, q2, etc.)
  - "type": "mc" or "short"
  - "question": string
  - "options": string[] (only for mc type, exactly 4 options)
  - "correctAnswer": string (must exactly match one of the options for mc type)`;

export const POST = withRateLimit(async function(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Quiz generation is not configured' },
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
    const { deckId } = body;

    if (!deckId) {
      return NextResponse.json({ error: 'Deck ID is required' }, { status: 400 });
    }

    // Fetch the deck with cards
    const deck = await prisma.flashcardDeck.findFirst({
      where: { id: deckId, userId },
      include: {
        cards: {
          select: { front: true, back: true },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (deck.cards.length < 4) {
      return NextResponse.json(
        { error: 'At least 4 cards are needed to generate a quiz' },
        { status: 400 }
      );
    }

    // Build the card content for the prompt
    const cardContent = deck.cards
      .map((c, i) => `${i + 1}. Front: ${c.front}\n   Back: ${c.back}`)
      .join('\n');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Generate quiz questions from these ${deck.cards.length} flashcards:\n\n${cardContent}` },
      ],
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI. Please try again.' },
        { status: 503 }
      );
    }

    try {
      const parsed = JSON.parse(content);
      const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      return NextResponse.json({
        questions: questions.map((q: any, i: number) => ({
          id: String(q.id || `q${i + 1}`),
          type: q.type === 'short' ? 'short' : 'mc',
          question: String(q.question || ''),
          options: q.type === 'mc' && Array.isArray(q.options) ? q.options.map(String) : undefined,
          correctAnswer: String(q.correctAnswer || ''),
        })).filter((q: any) => q.question.length > 0 && q.correctAnswer.length > 0),
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error generating quiz:', error);

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
      { error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
});
