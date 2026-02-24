import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkPremiumAccess } from '@/lib/subscription';

// GET all recipes for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });

  const recipes = await prisma.recipe.findMany({
    where: { userId },
    include: { ingredients: { orderBy: { order: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ recipes });
});

// POST create new recipe with nested ingredients
export const POST = withRateLimit(async function(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });

  const accessCheck = await checkPremiumAccess(userId);
  if (!accessCheck.allowed) {
    return NextResponse.json(
      { error: 'premium_required', message: accessCheck.message },
      { status: 403 }
    );
  }

  const data = await req.json();
  if (!data.title || data.title.trim().length === 0) {
    return NextResponse.json({ error: 'Recipe title is required' }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: {
      userId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      servings: data.servings ? parseInt(data.servings) : null,
      prepTime: data.prepTime ? parseInt(data.prepTime) : null,
      cookTime: data.cookTime ? parseInt(data.cookTime) : null,
      instructions: data.instructions?.trim() || null,
      steps: data.steps || null,
      sourceUrl: data.sourceUrl?.trim() || null,
      imageUrl: data.imageUrl || null,
      tags: data.tags || null,
      isFavorite: data.isFavorite || false,
      ingredients: {
        create: (data.ingredients || []).map((ing: { name: string; quantity?: number; unit?: string; notes?: string }, i: number) => ({
          name: ing.name.trim(),
          quantity: ing.quantity ? parseFloat(String(ing.quantity)) : null,
          unit: ing.unit?.trim() || null,
          notes: ing.notes?.trim() || null,
          order: i,
        })),
      },
    },
    include: { ingredients: { orderBy: { order: 'asc' } } },
  });

  return NextResponse.json({ recipe }, { status: 201 });
});
