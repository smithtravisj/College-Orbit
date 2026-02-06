// Spotify Web API Client
// Documentation: https://developer.spotify.com/documentation/web-api

// Spotify API Types
export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images: SpotifyImage[];
  product: 'premium' | 'free' | 'open';
  country?: string;
  uri: string;
}

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  explicit: boolean;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  uri: string;
  images: SpotifyImage[];
  release_date: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  progress_ms: number | null;
  timestamp: number;
  item: SpotifyTrack | null;
  device: SpotifyDevice | null;
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
}

export interface SpotifyDevice {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

// Custom error for auth issues
export class SpotifyAuthError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'SpotifyAuthError';
  }
}

// Spotify API Client
export class SpotifyClient {
  private baseUrl = 'https://api.spotify.com/v1';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle 204 No Content (e.g., when nothing is playing)
    if (response.status === 204) {
      return null as T;
    }

    // Handle errors
    if (!response.ok) {
      if (response.status === 401) {
        throw new SpotifyAuthError('Access token expired or invalid', 401);
      }

      let errorMessage = `Spotify API error: ${response.status}`;
      try {
        const errorData = (await response.json()) as SpotifyError;
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  // Get current user profile
  async getCurrentUser(): Promise<SpotifyUser> {
    return this.request<SpotifyUser>('/me');
  }

  // Get current playback state
  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    return this.request<SpotifyPlaybackState | null>('/me/player');
  }

  // Get currently playing track
  async getCurrentlyPlaying(): Promise<{ item: SpotifyTrack | null; is_playing: boolean; progress_ms: number } | null> {
    return this.request('/me/player/currently-playing');
  }

  // Playback controls (require Premium)
  async play(options?: { device_id?: string; uris?: string[]; context_uri?: string }): Promise<void> {
    await this.request('/me/player/play', {
      method: 'PUT',
      body: options ? JSON.stringify(options) : undefined,
    });
  }

  async pause(): Promise<void> {
    await this.request('/me/player/pause', { method: 'PUT' });
  }

  async skipToNext(): Promise<void> {
    await this.request('/me/player/next', { method: 'POST' });
  }

  async skipToPrevious(): Promise<void> {
    await this.request('/me/player/previous', { method: 'POST' });
  }

  async seek(positionMs: number): Promise<void> {
    await this.request(`/me/player/seek?position_ms=${positionMs}`, { method: 'PUT' });
  }

  async setVolume(volumePercent: number): Promise<void> {
    await this.request(`/me/player/volume?volume_percent=${volumePercent}`, { method: 'PUT' });
  }

  // Test connection by fetching current user
  async testConnection(): Promise<SpotifyUser> {
    return this.getCurrentUser();
  }
}

// Factory function
export function createSpotifyClient(accessToken: string): SpotifyClient {
  return new SpotifyClient(accessToken);
}

// Token encryption/decryption (same pattern as Canvas)
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
    process.env.SPOTIFY_ENCRYPTION_SECRET ||
    process.env.CANVAS_ENCRYPTION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'fallback-secret-do-not-use-in-production'
  );
}

// OAuth helpers
export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

export function getSpotifyAuthUrl(clientId: string, redirectUri: string, state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier: string
): Promise<SpotifyTokenResponse> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string
): Promise<SpotifyTokenResponse> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

// PKCE helpers
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
