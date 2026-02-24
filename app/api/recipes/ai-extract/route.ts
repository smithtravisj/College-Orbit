import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkPremiumAccess } from '@/lib/subscription';
import OpenAI from 'openai';

function buildSystemPrompt(tagList: string[]) {
  return `You are a recipe extraction assistant. Given text (which may be raw recipe text, a pasted webpage, or messy copy-paste), extract a structured recipe.

Return a JSON object with these fields:
- "title": string (the recipe name)
- "description": string or null (a short 1-2 sentence description)
- "servings": number or null
- "prepTime": number or null (in minutes)
- "cookTime": number or null (in minutes)
- "steps": array of step groups, where each step group is { "title": string, "ingredients": [...], "instructions": [...] }
  - "title": a short label for this step group (e.g., "Rice", "Cook Turkey", "Assembly", "Sauce")
  - "ingredients": array of objects with { "name": string, "quantity": number or null, "unit": string or null, "notes": string or null, "category": string } — only the ingredients used in this step
  - "instructions": array of strings — only the instructions for this step
  Group related steps together logically. A simple recipe may have 1-2 groups; a complex recipe may have 3-5.
- "ingredients": flat array of ALL ingredients across all steps, with { "name": string, "quantity": number or null, "unit": string or null, "notes": string or null, "category": string } where category is one of: Produce, Meat & Seafood, Dairy, Spices & Seasonings, Canned Goods, Pasta & Rice, Baking Supplies, Condiments, Bread, Frozen, Beverages, Oils & Cooking Sprays, Other
- "tags": string array (suggest relevant tags from: ${tagList.join(', ')})

Rules:
- Extract ALL ingredients mentioned
- Parse quantities as numbers (e.g., "1/2" → 0.5, "1 1/2" → 1.5)
- Common units: tsp, tbsp, cup, oz, lb, g, kg, ml, L, pinch, clove, can, bunch, piece
- Put prep notes in the "notes" field (e.g., "diced", "minced", "room temperature")
- The "steps" field organizes the recipe into logical groups. The flat "ingredients" field is the complete ingredient list for grocery purposes.
- If the text is clearly not a recipe, return { "error": "Could not identify a recipe in the provided text" }
- Only return valid JSON, no markdown code blocks`;
}

export const POST = withRateLimit(async function(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI extraction is not configured' },
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

    const { text, customTags } = await request.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    let contentToProcess = text.trim();

    // Build tag list including any custom tags
    const tagList = [
      'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Quick', 'Healthy',
      'Meal Prep', 'Comfort Food', 'Budget', 'Vegetarian', 'Vegan', 'Gluten-Free',
      'Dairy-Free', 'One Pot', 'Slow Cooker', 'Air Fryer', 'Grill',
      ...(Array.isArray(customTags) ? customTags : []),
    ];

    // If it looks like a URL, try to fetch the page content
    const urlMatch = contentToProcess.match(/^https?:\/\/\S+$/i);
    let ogImage: string | null = null;
    if (urlMatch) {
      try {
        const response = await fetch(contentToProcess, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          const html = await response.text();
          // Try to extract og:image before stripping HTML
          const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
          if (ogMatch?.[1]) {
            ogImage = ogMatch[1];
          }
          // Strip HTML tags but keep text content
          contentToProcess = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#?\w+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 15000); // Limit to avoid token overflow
        }
      } catch {
        // If fetch fails, pass the URL text as-is to the AI
      }
    } else {
      contentToProcess = contentToProcess.slice(0, 15000);
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(tagList) },
        { role: 'user', content: contentToProcess },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Failed to extract recipe' }, { status: 500 });
    }

    const extracted = JSON.parse(content);

    if (extracted.error) {
      return NextResponse.json({ error: extracted.error }, { status: 400 });
    }

    // Include the source URL and og:image if input was a URL
    if (urlMatch) {
      extracted.sourceUrl = text.trim();
      if (ogImage) {
        extracted.imageUrl = ogImage;
      }
    }

    return NextResponse.json({ recipe: extracted });
  } catch (error) {
    console.error('[AI Recipe Extract] Error:', error);
    return NextResponse.json(
      { error: 'Failed to extract recipe. Please try again.' },
      { status: 500 }
    );
  }
});
