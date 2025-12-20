import { prisma } from '@/lib/prisma';

/**
 * Log an API call to analytics
 * Should be called in API route handlers
 */
export async function logApiCall(
  endpoint: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  try {
    // Generate a simple session ID for server-side API calls
    const sessionId = `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await prisma.analyticsEvent.create({
      data: {
        sessionId,
        userId: userId || null,
        eventType: 'api_call',
        eventName: endpoint,
        ...(metadata && { metadata }),
      },
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
    // Don't throw - API should work even if logging fails
  }
}
