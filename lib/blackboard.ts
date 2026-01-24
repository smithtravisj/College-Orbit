// Blackboard Learn LMS API Client
// Documentation: https://developer.anthology.com/portal/displayApi

// Blackboard API Types
export interface BlackboardUser {
  id: string;
  uuid: string;
  userName: string;
  name: {
    given: string;
    family: string;
    middle?: string;
  };
  contact?: {
    email?: string;
  };
}

export interface BlackboardCourse {
  id: string;
  uuid: string;
  courseId: string; // External course ID (visible to users)
  name: string;
  description?: string;
  availability: {
    available: 'Yes' | 'No' | 'Disabled' | 'Term';
    duration?: {
      type: string;
      start?: string;
      end?: string;
    };
  };
  enrollment?: {
    type: string;
  };
}

export interface BlackboardMembership {
  id: string;
  userId: string;
  courseId: string;
  availability: {
    available: 'Yes' | 'No';
  };
  courseRoleId: string;
  created: string;
  lastAccessed?: string;
  course?: BlackboardCourse;
}

export interface BlackboardGradebookColumn {
  id: string;
  name: string;
  description?: string;
  externalGrade: boolean;
  score: {
    possible: number;
    decimalPlaces?: number;
  };
  availability: {
    available: 'Yes' | 'No';
  };
  grading?: {
    type: string;
    due?: string;
    attemptsAllowed?: number;
  };
  contentId?: string;
}

export interface BlackboardGrade {
  userId: string;
  columnId: string;
  status: string;
  displayGrade?: {
    scaleType: string;
    score?: number;
    text?: string;
  };
  score?: number;
  notes?: string;
  feedback?: string;
  exempt: boolean;
  attemptId?: string;
  firstAttempted?: string;
  lastAttempted?: string;
}

export interface BlackboardCalendarItem {
  id: string;
  type: string;
  calendarId: string;
  calendarName?: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  modified?: string;
  location?: string;
  recurrence?: {
    count?: number;
    frequency: string;
    interval: number;
    originalStart: string;
    originalEnd?: string;
  };
}

export interface BlackboardContentItem {
  id: string;
  title: string;
  body?: string;
  description?: string;
  created: string;
  modified?: string;
  position: number;
  availability: {
    available: 'Yes' | 'No';
    allowGuests?: boolean;
    adaptiveRelease?: object;
  };
  contentHandler?: {
    id: string;
    url?: string;
  };
}

export interface BlackboardOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface BlackboardError {
  status: number;
  message: string;
  extraInfo?: string;
}

// Custom error class for Blackboard authentication failures (expired/invalid tokens)
export class BlackboardAuthError extends Error {
  constructor(message: string = 'Blackboard API authentication failed. Your access token may have expired.') {
    super(message);
    this.name = 'BlackboardAuthError';
  }
}

// Token encryption/decryption (same as Canvas implementation)
export function encryptToken(token: string, secret: string): string {
  const crypto = require('crypto');
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(secret).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptToken(encryptedToken: string, secret: string): string {
  const crypto = require('crypto');
  const [ivHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Get an OAuth access token using client credentials
 * Blackboard uses OAuth 2.0 client credentials flow
 */
export async function getAccessToken(
  instanceUrl: string,
  applicationKey: string,
  applicationSecret: string
): Promise<{ token: string; expiresAt: Date }> {
  // Normalize URL
  let baseUrl = instanceUrl.trim();
  baseUrl = baseUrl.replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    // Use HTTP for localhost (mock server), HTTPS for production
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    baseUrl = isLocalhost ? `http://${baseUrl}` : `https://${baseUrl}`;
  }

  const tokenUrl = `${baseUrl}/learn/api/public/v1/oauth2/token`;

  // Create Basic auth header
  const credentials = Buffer.from(`${applicationKey}:${applicationSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    let errorMessage = `Blackboard OAuth error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json() as BlackboardError;
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Use status message if we can't parse error
    }
    throw new Error(errorMessage);
  }

  const data = await response.json() as BlackboardOAuthToken;

  // Calculate expiration time (token typically expires in 1 hour)
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in - 60); // Subtract 60s buffer

  return {
    token: data.access_token,
    expiresAt,
  };
}

export class BlackboardClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(instanceUrl: string, accessToken: string) {
    // Normalize the instance URL
    let normalizedUrl = instanceUrl.trim();
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      // Use HTTP for localhost (mock server), HTTPS for production
      const isLocalhost = normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1');
      normalizedUrl = isLocalhost ? `http://${normalizedUrl}` : `https://${normalizedUrl}`;
    }

    this.baseUrl = normalizedUrl;
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Check for authentication errors (401 Unauthorized)
      if (response.status === 401) {
        throw new BlackboardAuthError('Your Blackboard access token has expired or is invalid. Please reconnect your Blackboard account.');
      }

      let errorMessage = `Blackboard API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json() as BlackboardError;
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If we can't parse the error, use the status message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  private async requestPaginated<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T[]> {
    const results: T[] = [];
    let url = `${this.baseUrl}${endpoint}`;

    // Add query parameters
    const searchParams = new URLSearchParams({
      limit: '200', // Blackboard's max limit varies by endpoint
      ...params,
    });
    url = `${url}?${searchParams.toString()}`;

    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Check for authentication errors (401 Unauthorized)
        if (response.status === 401) {
          throw new BlackboardAuthError('Your Blackboard access token has expired or is invalid. Please reconnect your Blackboard account.');
        }

        let errorMessage = `Blackboard API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json() as BlackboardError;
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If we can't parse the error, use the status message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json() as { results: T[]; paging?: { nextPage?: string } };
      results.push(...data.results);

      // Blackboard uses paging.nextPage for pagination
      url = data.paging?.nextPage || '';
    }

    return results;
  }

  // ========== User Methods ==========

  async getCurrentUser(): Promise<BlackboardUser> {
    return this.request<BlackboardUser>('/learn/api/public/v1/users/me');
  }

  // ========== Course Methods ==========

  async getUserMemberships(userId: string = 'me'): Promise<BlackboardMembership[]> {
    return this.requestPaginated<BlackboardMembership>(
      `/learn/api/public/v1/users/${userId}/courses`,
      { expand: 'course' }
    );
  }

  async getCourse(courseId: string): Promise<BlackboardCourse> {
    return this.request<BlackboardCourse>(`/learn/api/public/v3/courses/${courseId}`);
  }

  // ========== Gradebook Methods (Assignments) ==========

  async getGradebookColumns(courseId: string): Promise<BlackboardGradebookColumn[]> {
    return this.requestPaginated<BlackboardGradebookColumn>(
      `/learn/api/public/v2/courses/${courseId}/gradebook/columns`
    );
  }

  async getGradebookColumn(courseId: string, columnId: string): Promise<BlackboardGradebookColumn> {
    return this.request<BlackboardGradebookColumn>(
      `/learn/api/public/v2/courses/${courseId}/gradebook/columns/${columnId}`
    );
  }

  // ========== Grade Methods ==========

  async getColumnGrades(courseId: string, columnId: string): Promise<BlackboardGrade[]> {
    return this.requestPaginated<BlackboardGrade>(
      `/learn/api/public/v2/courses/${courseId}/gradebook/columns/${columnId}/users`
    );
  }

  async getUserGrade(courseId: string, columnId: string, userId: string = 'me'): Promise<BlackboardGrade> {
    return this.request<BlackboardGrade>(
      `/learn/api/public/v2/courses/${courseId}/gradebook/columns/${columnId}/users/${userId}`
    );
  }

  // ========== Calendar Methods ==========

  async getCalendarItems(params: {
    since?: string; // ISO date string
    until?: string; // ISO date string
    courseId?: string;
  } = {}): Promise<BlackboardCalendarItem[]> {
    const queryParams: Record<string, string> = {};

    if (params.since) {
      queryParams.since = params.since;
    }
    if (params.until) {
      queryParams.until = params.until;
    }
    if (params.courseId) {
      queryParams.courseId = params.courseId;
    }

    return this.requestPaginated<BlackboardCalendarItem>(
      '/learn/api/public/v1/calendars/items',
      queryParams
    );
  }

  // ========== Content Methods (for descriptions) ==========

  async getCourseContents(courseId: string): Promise<BlackboardContentItem[]> {
    return this.requestPaginated<BlackboardContentItem>(
      `/learn/api/public/v1/courses/${courseId}/contents`
    );
  }

  // ========== Validation Methods ==========

  /**
   * Test the connection by fetching the current user
   * Returns the user if successful, throws an error if not
   */
  async testConnection(): Promise<BlackboardUser> {
    return this.getCurrentUser();
  }
}

// Helper function to create a client instance
export function createBlackboardClient(
  instanceUrl: string,
  accessToken: string
): BlackboardClient {
  return new BlackboardClient(instanceUrl, accessToken);
}

// Color tags for auto-assignment to synced courses
// Uses named colors that match the calendar's parseColor() palette
const COURSE_COLORS = [
  'blue',
  'green',
  'purple',
  'red',
  'yellow',
  'pink',
  'indigo',
  'cyan',
];

export function getColorForCourse(index: number): string {
  return COURSE_COLORS[index % COURSE_COLORS.length];
}

// Determine current term based on date
export function getCurrentTerm(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month >= 0 && month <= 4) {
    // January - May
    return `Winter ${year}`;
  } else if (month >= 5 && month <= 7) {
    // June - August
    return `Summer ${year}`;
  } else {
    // September - December
    return `Fall ${year}`;
  }
}

/**
 * Converts HTML content to clean plain text.
 * Strips tags, converts lists to bullets, preserves paragraph breaks.
 */
export function htmlToPlainText(html: string | null): string {
  if (!html) return '';

  let text = html;

  // Remove script and style tags entirely (including content)
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<link[^>]*>/gi, '');

  // Convert common block elements to newlines
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');

  // Convert list items to bullet points
  text = text.replace(/<li[^>]*>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');

  // Add spacing around lists
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');

  // Remove iframe (embedded videos) but note their presence
  text = text.replace(/<iframe[^>]*src="([^"]*youtube[^"]*)"[^>]*>[\s\S]*?<\/iframe>/gi, '[Video: $1]\n');
  text = text.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '[Embedded content]\n');

  // Convert links to text with URL
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&rsquo;/g, "'");
  text = text.replace(/&lsquo;/g, "'");
  text = text.replace(/&rdquo;/g, '"');
  text = text.replace(/&ldquo;/g, '"');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single
  text = text.replace(/\n[ \t]+/g, '\n'); // Remove leading whitespace on lines
  text = text.replace(/[ \t]+\n/g, '\n'); // Remove trailing whitespace on lines
  text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

  return text.trim();
}

/**
 * Extracts links from HTML content.
 * Returns array of { label, url } objects, deduplicated by URL.
 */
export function extractLinksFromHtml(html: string | null): Array<{ label: string; url: string }> {
  if (!html) return [];

  const links: Array<{ label: string; url: string }> = [];
  const seenUrls = new Set<string>();
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const label = match[2].trim() || url;
    const urlLower = url.toLowerCase();

    // Skip empty urls, anchors, javascript links, and duplicates
    if (url && !url.startsWith('#') && !url.startsWith('javascript:') && !seenUrls.has(urlLower)) {
      links.push({ label, url });
      seenUrls.add(urlLower);
    }
  }

  // Also extract YouTube video links from iframes
  const iframeRegex = /<iframe[^>]*src="([^"]*youtube[^"]*)"/gi;
  while ((match = iframeRegex.exec(html)) !== null) {
    const url = match[1];
    const urlLower = url.toLowerCase();
    if (!seenUrls.has(urlLower)) {
      links.push({ label: 'Video', url });
      seenUrls.add(urlLower);
    }
  }

  return links;
}

// Separators for notes sections - SAME format as Canvas for consistency
const USER_NOTES_HEADER = '─── Your Notes ───\n';
const BLACKBOARD_SEPARATOR = '\n\n─── From Blackboard ───\n';

/**
 * Merges existing links with Blackboard-extracted links.
 * Blackboard links (including "View on Blackboard") come first, then user's existing links.
 * Avoids duplicates by URL comparison.
 */
export function mergeLinks(
  existingLinks: Array<{ label: string; url: string }> | null,
  blackboardLinks: Array<{ label: string; url: string }>
): Array<{ label: string; url: string }> {
  const existing = existingLinks || [];
  const blackboardUrls = new Set(blackboardLinks.map(l => l.url.toLowerCase()));

  // Keep existing links that aren't duplicates of Blackboard links
  const userLinks = existing.filter(l => !blackboardUrls.has(l.url.toLowerCase()));

  // Blackboard links first (including "View on Blackboard"), then user's custom links
  return [...blackboardLinks, ...userLinks];
}

/**
 * Merges user notes with Blackboard description.
 * User notes (above "From Blackboard" separator) are preserved, Blackboard section is updated.
 * Adds "Your Notes" header above user content for clarity.
 */
export function mergeNotes(existingNotes: string | null, blackboardDescription: string | null): string {
  // Convert HTML to plain text
  const blackboardContent = htmlToPlainText(blackboardDescription);

  if (!existingNotes || existingNotes.trim() === '') {
    // No existing notes - include "Your Notes" header so users know where to add their notes
    return blackboardContent ? `${USER_NOTES_HEADER}\n${BLACKBOARD_SEPARATOR}${blackboardContent}` : '';
  }

  // Check if "From Blackboard" separator exists
  const blackboardSeparatorIndex = existingNotes.indexOf('─── From Blackboard ───');
  // Also check for Canvas separator (in case item was previously synced from Canvas)
  const canvasSeparatorIndex = existingNotes.indexOf('─── From Canvas ───');
  // Check if "Your Notes" header exists
  const userNotesHeaderIndex = existingNotes.indexOf('─── Your Notes ───');

  let userNotes = '';

  // Determine which separator to use for extraction
  const separatorIndex = blackboardSeparatorIndex !== -1 ? blackboardSeparatorIndex : canvasSeparatorIndex;

  if (separatorIndex !== -1) {
    // Separator exists - extract user notes (between Your Notes header and separator)
    if (userNotesHeaderIndex !== -1 && userNotesHeaderIndex < separatorIndex) {
      // Both headers exist - user notes are between them
      const afterUserHeader = existingNotes.substring(userNotesHeaderIndex + '─── Your Notes ───'.length);
      const separatorText = blackboardSeparatorIndex !== -1 ? '─── From Blackboard ───' : '─── From Canvas ───';
      const beforeSeparator = afterUserHeader.substring(0, afterUserHeader.indexOf(separatorText));
      userNotes = beforeSeparator.trim();
    } else {
      // Only separator exists - everything before it is user notes
      userNotes = existingNotes.substring(0, separatorIndex).trim();
    }
  } else if (userNotesHeaderIndex !== -1) {
    // Only user notes header exists (no blackboard/canvas content yet)
    userNotes = existingNotes.substring(userNotesHeaderIndex + '─── Your Notes ───'.length).trim();
  } else {
    // No separators - check if notes are just old Blackboard content
    if (existingNotes.trim() === blackboardContent) {
      return blackboardContent ? `${USER_NOTES_HEADER}\n${BLACKBOARD_SEPARATOR}${blackboardContent}` : '';
    }
    // User has their own notes without any headers
    userNotes = existingNotes.trim();
  }

  // Build the final notes
  // Always include "Your Notes" header when there's Blackboard content so users know where to add their notes
  if (!userNotes && !blackboardContent) {
    return '';
  }

  if (!userNotes) {
    // Include empty "Your Notes" section so users know where to add their notes
    return blackboardContent ? `${USER_NOTES_HEADER}\n${BLACKBOARD_SEPARATOR}${blackboardContent}` : '';
  }

  if (!blackboardContent) {
    return `${USER_NOTES_HEADER}${userNotes}`;
  }

  return `${USER_NOTES_HEADER}${userNotes}${BLACKBOARD_SEPARATOR}${blackboardContent}`;
}
