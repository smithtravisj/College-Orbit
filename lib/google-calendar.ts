// Google Calendar API Client
// Documentation: https://developers.google.com/calendar/api/v3/reference

import { prisma } from '@/lib/prisma';

// Google Calendar API Types
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string; // RFC3339 for timed events
    date?: string;     // YYYY-MM-DD for all-day events
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  extendedProperties?: {
    private?: Record<string, string>;
  };
}

export interface GoogleCalendarList {
  kind: string;
  items: Array<{
    id: string;
    summary: string;
    description?: string;
    primary?: boolean;
    backgroundColor?: string;
    foregroundColor?: string;
    accessRole: string;
  }>;
}

export interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface GoogleEventListResponse {
  kind: string;
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

// Google color ID to hex mapping (colorId 1-11)
export const GOOGLE_COLOR_MAP: Record<string, string> = {
  '1': '#7986cb',  // Lavender
  '2': '#33b679',  // Sage
  '3': '#8e24aa',  // Grape
  '4': '#e67c73',  // Flamingo
  '5': '#f6bf26',  // Banana
  '6': '#f4511e',  // Tangerine
  '7': '#039be5',  // Peacock
  '8': '#616161',  // Graphite
  '9': '#3f51b5',  // Blueberry
  '10': '#0b8043', // Basil
  '11': '#d50000', // Tomato
};

// Custom error for auth issues
export class GoogleCalendarAuthError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'GoogleCalendarAuthError';
  }
}

// Google Calendar API Client
export class GoogleCalendarClient {
  private baseUrl = 'https://www.googleapis.com/calendar/v3';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (response.status === 204) {
      return null as T;
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new GoogleCalendarAuthError('Access token expired or invalid', 401);
      }

      let errorMessage = `Google Calendar API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  // List user's calendars
  async listCalendars(): Promise<GoogleCalendarList> {
    return this.request<GoogleCalendarList>('/users/me/calendarList');
  }

  // List events from a calendar with pagination
  async listEvents(
    calendarId: string,
    timeMin: string,
    timeMax: string
  ): Promise<GoogleCalendarEvent[]> {
    const allEvents: GoogleCalendarEvent[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        maxResults: '250',
        singleEvents: 'true',
        orderBy: 'startTime',
      });
      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      const response = await this.request<GoogleEventListResponse>(
        `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
      );

      if (response.items) {
        allEvents.push(...response.items);
      }
      pageToken = response.nextPageToken;
    } while (pageToken);

    return allEvents;
  }

  // Insert a new event
  async insertEvent(
    calendarId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    return this.request<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );
  }

  // Update an existing event
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    return this.request<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(event),
      }
    );
  }

  // Delete an event
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.request<void>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' }
    );
  }

  // Get user info (email)
  async getUserInfo(): Promise<{ email: string; name?: string }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new GoogleCalendarAuthError('Access token expired or invalid', 401);
      }
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }

    return response.json();
  }
}

// Factory function
export function createGoogleCalendarClient(accessToken: string): GoogleCalendarClient {
  return new GoogleCalendarClient(accessToken);
}

// Token encryption/decryption (same pattern as Spotify/Canvas)
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

// Get encryption secret from environment
export function getEncryptionSecret(): string {
  return (
    process.env.GOOGLE_ENCRYPTION_SECRET ||
    process.env.CANVAS_ENCRYPTION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'fallback-secret-do-not-use-in-production'
  );
}

// OAuth scopes
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// PKCE helpers (same as Spotify)
export function generateCodeVerifier(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export function generateState(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
}

// Build Google OAuth authorization URL
export function getGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: GOOGLE_CALENDAR_SCOPES,
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  codeVerifier: string
): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

// Refresh an access token
export async function refreshGoogleAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Get a valid access token, auto-refreshing if expired or expiring within 5 minutes.
 * Updates the database with new tokens if refreshed.
 */
export async function getValidAccessToken(
  settings: {
    googleCalendarAccessToken: string | null;
    googleCalendarRefreshToken: string | null;
    googleCalendarTokenExpiresAt: Date | null;
  },
  userId: string
): Promise<string> {
  if (!settings.googleCalendarAccessToken || !settings.googleCalendarRefreshToken) {
    throw new GoogleCalendarAuthError('No Google Calendar tokens found');
  }

  const secret = getEncryptionSecret();
  const accessToken = decryptToken(settings.googleCalendarAccessToken, secret);

  // Check if token expires within 5 minutes
  const expiresAt = settings.googleCalendarTokenExpiresAt;
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt && expiresAt > fiveMinutesFromNow) {
    // Token is still valid
    return accessToken;
  }

  // Token expired or expiring soon — refresh it
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google Calendar credentials not configured');
  }

  const refreshToken = decryptToken(settings.googleCalendarRefreshToken, secret);

  try {
    const tokens = await refreshGoogleAccessToken(refreshToken, clientId, clientSecret);

    const newEncryptedAccess = encryptToken(tokens.access_token, secret);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Update database with new tokens
    await prisma.settings.update({
      where: { userId },
      data: {
        googleCalendarAccessToken: newEncryptedAccess,
        googleCalendarTokenExpiresAt: newExpiresAt,
        // Google may return a new refresh token
        ...(tokens.refresh_token
          ? { googleCalendarRefreshToken: encryptToken(tokens.refresh_token, secret) }
          : {}),
      },
    });

    return tokens.access_token;
  } catch (error) {
    // Token refresh failed — mark as disconnected
    await prisma.settings.update({
      where: { userId },
      data: { googleCalendarConnected: false },
    });

    throw new GoogleCalendarAuthError(
      `Failed to refresh Google Calendar token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
