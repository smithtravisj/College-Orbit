import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkPremiumAccess } from '@/lib/subscription';
import OpenAI from 'openai';

const MAX_CHARS = 60000;

const SYSTEM_PROMPT = `You are a task planning assistant. Given an assignment or project description, break it down into concrete, actionable subtasks. Each subtask should have a clear description and an estimated time to complete in minutes.

Rules:
- Create 2-5 subtasks. Fewer is better. Each subtask = a real sitting of work, not a tiny action.
- Each subtask should be specific and actionable (start with a verb)
- Time estimates must be AGGRESSIVELY short and realistic for a college student:
  - Quick tasks (short writing, simple lookups, formatting): 3-5 minutes
  - Medium tasks (reading a short article, drafting a paragraph): 5-15 minutes
  - Only longer tasks (writing a full essay, deep research): 15-25 minutes
  - NEVER exceed 25 minutes for a single subtask
- Do NOT inflate estimates — a 150-word post takes 5 minutes, not 15
- Order subtasks logically (dependencies first)
- Do NOT include vague steps like "review" or "finalize" unless specific
- CRITICAL: "Submit", "upload", "turn in", "post", "download", "open" are NEVER their own subtask. They are part of the work. Writing + submitting = ONE step. Reading always includes downloading/opening.
  - GOOD: "Write and submit your 150-word discussion post about BYU's purpose" (one step, ~5m)
  - GOOD: "Read the two assigned articles and note key points" (one step, ~15m)
  - GOOD: "Read a peer's post and submit a thoughtful response" (one step, ~5m)
  - BAD: "Draft post" then "Submit post" (submitting is not a separate task!)
  - BAD: "Download materials" then "Read article" (downloading is not a task!)
- Return valid JSON with a "steps" array containing objects with "text" (string) and "estimatedMinutes" (number) fields`;

export const POST = withRateLimit(async function(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Breakdown is not configured' },
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

    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a more detailed description.' },
        { status: 400 }
      );
    }

    const inputText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Break down this assignment into subtasks:\n\n${inputText}` },
      ],
      temperature: 0.4,
      max_tokens: 2000,
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
      const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
      return NextResponse.json({
        steps: steps.map((s: any) => ({
          text: String(s.text || ''),
          estimatedMinutes: Number(s.estimatedMinutes) || 15,
        })).filter((s: any) => s.text.length > 0),
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error breaking down assignment:', error);

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
      { error: 'Failed to break down assignment' },
      { status: 500 }
    );
  }
});
