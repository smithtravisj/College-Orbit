import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const now = new Date();

  // Get or create rate limit record
  let rateLimit = await prisma.rateLimit.findUnique({
    where: {
      userId_endpoint: {
        userId,
        endpoint,
      },
    },
  });

  // If record exists and window has passed, reset it
  if (rateLimit && rateLimit.resetAt < now) {
    rateLimit = await prisma.rateLimit.update({
      where: {
        userId_endpoint: {
          userId,
          endpoint,
        },
      },
      data: {
        count: 0,
        resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS),
      },
    });
  }

  // If no record exists, create one
  if (!rateLimit) {
    rateLimit = await prisma.rateLimit.create({
      data: {
        userId,
        endpoint,
        count: 0,
        resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS),
      },
    });
  }

  // Increment request count
  rateLimit = await prisma.rateLimit.update({
    where: {
      userId_endpoint: {
        userId,
        endpoint,
      },
    },
    data: {
      count: rateLimit.count + 1,
    },
  });

  const allowed = rateLimit.count <= RATE_LIMIT_MAX_REQUESTS;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - rateLimit.count);

  return {
    allowed,
    remaining,
    resetAt: rateLimit.resetAt,
  };
}

export function createRateLimitResponse(resetAt: Date) {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      resetAt: resetAt.toISOString(),
    },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil(
          (resetAt.getTime() - Date.now()) / 1000
        ).toString(),
      },
    }
  );
}

export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetAt: Date
): NextResponse {
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetAt.toISOString());
  return response;
}
