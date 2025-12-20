import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { checkRateLimit, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rateLimit';

type Handler = (...args: any[]) => Promise<NextResponse>;

export function withRateLimit(handler: Handler): Handler {
  return async (...args: any[]): Promise<NextResponse> => {
    const req = args[0] instanceof NextRequest ? args[0] : null;
    try {
      // If no request found, just call the handler (shouldn't happen)
      if (!req) {
        return handler(...args);
      }

      // Get user ID from either JWT token or session
      let userId: string | null = null;

      // Try JWT token first (for routes using getToken pattern)
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (token?.id) {
        userId = token.id as string;
      }

      // If no JWT token, try server session
      if (!userId) {
        const session = await getServerSession(authConfig);
        if (session?.user?.id) {
          userId = session.user.id;
        }
      }

      // If no user found, skip rate limiting for unauthenticated requests
      // (e.g., signup endpoint)
      if (!userId) {
        return handler(...args);
      }

      // Extract endpoint from URL path
      const url = new URL(req.url);
      const endpoint = url.pathname;

      // Check rate limit
      const { allowed, remaining, resetAt } = await checkRateLimit(
        userId,
        endpoint
      );

      if (!allowed) {
        return createRateLimitResponse(resetAt);
      }

      // Call the actual handler with all arguments
      const response = await handler(...args);

      // Add rate limit headers to response
      return addRateLimitHeaders(response, remaining, resetAt);
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // If there's an error in rate limiting logic, allow the request to proceed
      return handler(...args);
    }
  };
}
