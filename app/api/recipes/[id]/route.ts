import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkPremiumAccess } from '@/lib/subscription';

// GET single recipe
export const GET = withRateLimit(async function(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });

  const { id } = await params;
  const recipe = await prisma.recipe.findFirst({
    where: { id, userId },
    include: { ingredients: { orderBy: { order: 'asc' } } },
  });

  if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });

  return NextResponse.json({ recipe });
});

// PATCH update recipe (delete-all + recreate ingredients in transaction)
export const PATCH = withRateLimit(async function(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });

  const accessCheck = await checkPremiumAccess(userId);
  if (!accessCheck.allowed) {
    return NextResponse.json(
      { error: 'premium_required', message: accessCheck.message },
      { status: 403 }
    );
  }

  const { id } = await params;
  const existing = await prisma.recipe.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });

  const data = await request.json();

  const recipe = await prisma.$transaction(async (tx) => {
    // Delete existing ingredients
    await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });

    // Update recipe and recreate ingredients
    return tx.recipe.update({
      where: { id },
      data: {
        title: data.title?.trim() ?? existing.title,
        description: data.description !== undefined ? (data.description?.trim() || null) : existing.description,
        servings: data.servings !== undefined ? (data.servings ? parseInt(data.servings) : null) : existing.servings,
        prepTime: data.prepTime !== undefined ? (data.prepTime ? parseInt(data.prepTime) : null) : existing.prepTime,
        cookTime: data.cookTime !== undefined ? (data.cookTime ? parseInt(data.cookTime) : null) : existing.cookTime,
        instructions: data.instructions !== undefined ? (data.instructions?.trim() || null) : existing.instructions,
        steps: data.steps !== undefined ? data.steps : existing.steps,
        sourceUrl: data.sourceUrl !== undefined ? (data.sourceUrl?.trim() || null) : existing.sourceUrl,
        imageUrl: data.imageUrl !== undefined ? (data.imageUrl || null) : existing.imageUrl,
        tags: data.tags !== undefined ? data.tags : existing.tags,
        isFavorite: data.isFavorite !== undefined ? data.isFavorite : existing.isFavorite,
        ...(data.ingredients ? {
          ingredients: {
            create: data.ingredients.map((ing: { name: string; quantity?: number; unit?: string; notes?: string }, i: number) => ({
              name: ing.name.trim(),
              quantity: ing.quantity ? parseFloat(String(ing.quantity)) : null,
              unit: ing.unit?.trim() || null,
              notes: ing.notes?.trim() || null,
              order: i,
            })),
          },
        } : {}),
      },
      include: { ingredients: { orderBy: { order: 'asc' } } },
    });
  });

  return NextResponse.json({ recipe });
});

// DELETE recipe
export const DELETE = withRateLimit(async function(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(request);
  if (!userId) return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.recipe.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });

  await prisma.recipe.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
