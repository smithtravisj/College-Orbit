// Analytics tracking utility - uses anonymous session IDs for privacy

const SESSION_ID_KEY = 'analytics_session_id';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_ID_STORAGE_KEY = `${SESSION_ID_KEY}_timestamp`;

/**
 * Get or create an anonymous session ID for analytics tracking
 * Session IDs are rotated after 30 minutes of inactivity
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    const stored = localStorage.getItem(SESSION_ID_KEY);
    const timestamp = localStorage.getItem(SESSION_ID_STORAGE_KEY);
    const now = Date.now();

    // Create new session if none exists or if it's expired
    if (!stored || !timestamp || now - parseInt(timestamp) > SESSION_TIMEOUT) {
      const newSessionId = generateSessionId();
      localStorage.setItem(SESSION_ID_KEY, newSessionId);
      localStorage.setItem(SESSION_ID_STORAGE_KEY, String(now));
      return newSessionId;
    }

    // Update timestamp on activity
    localStorage.setItem(SESSION_ID_STORAGE_KEY, String(now));
    return stored;
  } catch (error) {
    console.error('Failed to manage session ID:', error);
    return generateSessionId();
  }
}

/**
 * Generate a random session ID (using crypto if available, otherwise timestamp-based)
 */
function generateSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    // Use crypto.getRandomValues if available (most modern browsers)
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fall back to timestamp-based ID
  }

  // Fallback: timestamp + random number
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log an analytics event
 * @param eventType Type of event (page_view, feature_used, login, api_call, etc.)
 * @param eventName Name/identifier of the event
 * @param userId Optional user ID (for context, anonymized in storage)
 * @param metadata Optional additional data
 */
export async function logEvent(
  eventType: string,
  eventName: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  // Don't log in non-browser environments
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const sessionId = getSessionId();

    const response = await fetch('/api/analytics/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userId: userId || null,
        eventType,
        eventName,
        metadata: metadata || null,
      }),
    });

    if (!response.ok) {
      console.error('Failed to log event:', response.statusText);
    }
  } catch (error) {
    // Silently fail - don't let analytics errors break the app
    console.error('Analytics error:', error);
  }
}

/**
 * Log a page view event
 */
export function logPageView(pageName: string, userId?: string) {
  logEvent('page_view', pageName, userId);
}

/**
 * Log a feature usage event
 */
export function logFeatureUsed(featureName: string, userId?: string, metadata?: Record<string, any>) {
  logEvent('feature_used', featureName, userId, metadata);
}

/**
 * Log a login event
 */
export function logLogin(userId: string) {
  logEvent('login', 'user_login', userId);
}

/**
 * Log an API call event
 */
export function logApiCall(endpoint: string, userId?: string, metadata?: Record<string, any>) {
  logEvent('api_call', endpoint, userId, metadata);
}
