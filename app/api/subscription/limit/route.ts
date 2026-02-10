import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkFeatureLimit } from '@/lib/subscription';
import { withRateLimit } from '@/lib/withRateLimit';

export const GET = withRateLimit(async function (req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const feature = searchParams.get('feature');

    if (!feature || !['notes', 'courses'].includes(feature)) {
      return NextResponse.json({ error: 'Invalid feature parameter' }, { status: 400 });
    }

    const result = await checkFeatureLimit(userId, feature as 'notes' | 'courses');

    return NextResponse.json({
      current: result.current,
      limit: result.limit === Infinity ? null : result.limit,
      allowed: result.allowed,
    });
  } catch (error) {
    console.error('Error checking feature limit:', error);
    return NextResponse.json(
      { error: 'Failed to check feature limit' },
      { status: 500 }
    );
  }
});
