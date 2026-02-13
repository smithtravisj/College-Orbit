import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';

/**
 * Search endpoint for notes with support for:
 * - Full-text search across title, plainText, tags, course code/name, folder name
 * - Filtering by folder and course
 * - Field-weighted relevance scoring
 *
 * Query parameters:
 * - q: search query (required if using search)
 * - folder: folder ID to filter by (optional)
 * - course: course ID to filter by (optional)
 * - tags: comma-separated tag names to filter by (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const folderParam = searchParams.get('folder');
    const courseParam = searchParams.get('course');
    const tagsParam = searchParams.get('tags');

    // Build where clause
    const whereClause: any = {
      userId,
    };

    if (folderParam) {
      whereClause.folderId = folderParam;
    }

    if (courseParam) {
      whereClause.courseId = courseParam;
    }

    // Fetch all notes with their relations
    let notes = await prisma.note.findMany({
      where: whereClause,
      include: {
        course: { select: { id: true, code: true, name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    // Client-side filtering and scoring if query provided
    if (query) {
      const lowerQuery = query.toLowerCase();

      notes = notes
        .map((note) => {
          let score = 0;

          // Title match (3x weight)
          if (note.title.toLowerCase().includes(lowerQuery)) {
            score += 3;
            // Boost if it starts with query
            if (note.title.toLowerCase().startsWith(lowerQuery)) {
              score += 2;
            }
          }

          // Content match (1x weight)
          if (note.plainText?.toLowerCase().includes(lowerQuery)) {
            score += 1;
          }

          // Tags match (2x weight)
          const noteTags = Array.isArray(note.tags) ? note.tags : [];
          if (noteTags.some((t: any) => String(t).toLowerCase().includes(lowerQuery))) {
            score += 2;
          }

          // Course code/name match (2x weight)
          if (note.course) {
            if (note.course.code.toLowerCase().includes(lowerQuery)) {
              score += 2;
            }
            if (note.course.name.toLowerCase().includes(lowerQuery)) {
              score += 2;
            }
          }

          // Folder name match (1.5x weight)
          if (note.folder?.name.toLowerCase().includes(lowerQuery)) {
            score += 1.5;
          }

          return { note, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ note }) => note);
    }

    // Filter by tags if provided
    if (tagsParam) {
      const tagsToFilter = tagsParam.split(',').map((t) => t.trim().toLowerCase());
      notes = notes.filter((note) => {
        const noteTags = Array.isArray(note.tags) ? note.tags : [];
        return noteTags.some((t: any) => tagsToFilter.includes(String(t).toLowerCase()));
      });
    }

    // Sort by pinned and date
    notes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json({
      notes,
      count: notes.length,
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    return NextResponse.json(
      { error: 'Failed to search notes' },
      { status: 500 }
    );
  }
}
