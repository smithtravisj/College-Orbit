// Brightspace (D2L) LMS API Client
// Documentation: https://docs.valence.desire2learn.com/

// Brightspace API Types
export interface BrightspaceUser {
  Identifier: string;
  DisplayName: string;
  EmailAddress?: string;
  OrgDefinedId?: string;
  ProfileIdentifier?: string;
  FirstName?: string;
  LastName?: string;
  UniqueName?: string;
}

export interface BrightspaceCourse {
  OrgUnitId: number;
  Name: string;
  Code?: string;
  Type?: {
    Id: number;
    Code: string;
    Name: string;
  };
  HomePageUrl?: string;
  ImageUrl?: string;
  StartDate?: string;
  EndDate?: string;
  IsActive?: boolean;
  CanSelfRegister?: boolean;
}

export interface BrightspaceEnrollment {
  OrgUnit: BrightspaceCourse;
  Role?: {
    Id: number;
    Code: string;
    Name: string;
  };
  Access?: {
    IsActive: boolean;
    StartDate?: string;
    EndDate?: string;
  };
}

export interface BrightspaceDropbox {
  Id: number;
  CategoryId?: number;
  Name: string;
  CustomInstructions?: {
    Text?: string;
    Html?: string;
  };
  StartDate?: string;
  EndDate?: string;
  DueDate?: string;
  IsHidden?: boolean;
  Assessment?: {
    ScoreDenominator?: number;
    Rubrics?: Array<{
      RubricId: number;
      Name: string;
    }>;
  };
}

export interface BrightspaceSubmission {
  Id: number;
  SubmitterId: number;
  SubmitterDisplayName?: string;
  Entity: {
    EntityType: number;
    EntityId: number;
  };
  Status: number; // 0=Submitted, 1=Marked, 2=Published
  CompletedDate?: string;
  Feedback?: {
    Text?: string;
    Html?: string;
    Score?: number;
    OutOf?: number;
  };
}

export interface BrightspaceGradeItem {
  GradeItemId: number;
  Name: string;
  GradeType: string;
  Category?: {
    Id: number;
    Name: string;
  };
  MaxPoints?: number;
  GradeSchemeId?: number;
  Description?: {
    Text?: string;
    Html?: string;
  };
  DueDate?: string;
  StartDate?: string;
  EndDate?: string;
}

export interface BrightspaceGradeValue {
  UserId: number;
  OrgUnitId: number;
  DisplayedGrade?: string;
  GradeValue?: number;
  PointsNumerator?: number;
  PointsDenominator?: number;
  WeightedNumerator?: number;
  WeightedDenominator?: number;
  Comments?: {
    Text?: string;
    Html?: string;
  };
  GradedDate?: string;
}

export interface BrightspaceEvent {
  CalendarEventId: number;
  OrgUnitId?: number;
  Title: string;
  Description?: string;
  StartDateTime?: string;
  EndDateTime?: string;
  StartDay?: string;
  EndDay?: string;
  AllDay?: boolean;
  RecurrenceInfo?: {
    RepeatType: number;
    RepeatEvery?: number;
    RepeatOnInfo?: {
      Sunday?: boolean;
      Monday?: boolean;
      Tuesday?: boolean;
      Wednesday?: boolean;
      Thursday?: boolean;
      Friday?: boolean;
      Saturday?: boolean;
    };
    RepeatUntilDate?: string;
  };
  Location?: {
    Name?: string;
    Address?: string;
  };
  AssociatedEntity?: {
    Type: string;
    Id: number;
  };
}

export interface BrightspaceNewsItem {
  Id: number;
  Title: string;
  Body?: {
    Text?: string;
    Html?: string;
  };
  StartDate?: string;
  EndDate?: string;
  IsHidden?: boolean;
  ShowOnlyInCourse?: boolean;
  IsGlobal?: boolean;
  Attachments?: Array<{
    FileId: number;
    FileName: string;
    Size?: number;
  }>;
  CreatedDate?: string;
  LastModifiedDate?: string;
  LastModifiedBy?: string;
}

export interface BrightspaceOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface BrightspaceError {
  Errors?: Array<{
    Message: string;
    Type?: string;
  }>;
  Message?: string;
}

// Custom error class for Brightspace authentication failures
export class BrightspaceAuthError extends Error {
  constructor(message: string = 'Brightspace API authentication failed. Your access token may have expired.') {
    super(message);
    this.name = 'BrightspaceAuthError';
  }
}

// Token encryption/decryption (same as other LMS implementations)
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
 * Brightspace uses OAuth 2.0 authorization code or client credentials flow
 */
export async function getAccessToken(
  instanceUrl: string,
  clientId: string,
  clientSecret: string,
  refreshToken?: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  // Normalize URL
  let baseUrl = instanceUrl.trim();
  baseUrl = baseUrl.replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    baseUrl = isLocalhost ? `http://${baseUrl}` : `https://${baseUrl}`;
  }

  const tokenUrl = `${baseUrl}/d2l/lp/auth/oauth2/token`;

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  if (refreshToken) {
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
  } else {
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'core:*:* enrollment:orgunit:read grades:gradevalues:read');
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    let errorMessage = `Brightspace OAuth error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json() as BrightspaceError;
      if (errorData.Errors && errorData.Errors.length > 0) {
        errorMessage = errorData.Errors[0].Message;
      } else if (errorData.Message) {
        errorMessage = errorData.Message;
      }
    } catch {
      // Use status message if we can't parse error
    }
    throw new Error(errorMessage);
  }

  const data = await response.json() as BrightspaceOAuthToken;

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in - 60);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
  };
}

export class BrightspaceClient {
  private baseUrl: string;
  private accessToken: string;
  private apiVersion = '1.67'; // LP API version

  constructor(instanceUrl: string, accessToken: string) {
    let normalizedUrl = instanceUrl.trim();
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      const isLocalhost = normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1');
      normalizedUrl = isLocalhost ? `http://${normalizedUrl}` : `https://${normalizedUrl}`;
    }

    this.baseUrl = normalizedUrl;
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      if (response.status === 401 || response.status === 403) {
        throw new BrightspaceAuthError('Your Brightspace access token has expired or is invalid. Please reconnect your Brightspace account.');
      }

      let errorMessage = `Brightspace API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json() as BrightspaceError;
        if (errorData.Errors && errorData.Errors.length > 0) {
          errorMessage = errorData.Errors[0].Message;
        } else if (errorData.Message) {
          errorMessage = errorData.Message;
        }
      } catch {
        // Use status message
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  private async requestPaginated<T>(endpoint: string): Promise<T[]> {
    const results: T[] = [];
    let bookmark: string | undefined;
    const pageSize = 100;

    while (true) {
      let url = endpoint;
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}pageSize=${pageSize}`;
      if (bookmark) {
        url += `&bookmark=${encodeURIComponent(bookmark)}`;
      }

      const response = await this.request<{
        Items: T[];
        PagingInfo?: {
          Bookmark?: string;
          HasMoreItems?: boolean;
        };
      } | T[]>(url);

      // Handle both paginated and non-paginated responses
      if (Array.isArray(response)) {
        results.push(...response);
        break;
      } else if (response.Items) {
        results.push(...response.Items);
        if (!response.PagingInfo?.HasMoreItems) {
          break;
        }
        bookmark = response.PagingInfo.Bookmark;
      } else {
        break;
      }
    }

    return results;
  }

  // ========== User Methods ==========

  async getCurrentUser(): Promise<BrightspaceUser> {
    return this.request<BrightspaceUser>(`/d2l/api/lp/${this.apiVersion}/users/whoami`);
  }

  // ========== Course Methods ==========

  async getMyEnrollments(): Promise<BrightspaceEnrollment[]> {
    return this.requestPaginated<BrightspaceEnrollment>(
      `/d2l/api/lp/${this.apiVersion}/enrollments/myenrollments/`
    );
  }

  async getCourse(orgUnitId: number): Promise<BrightspaceCourse> {
    return this.request<BrightspaceCourse>(`/d2l/api/lp/${this.apiVersion}/courses/${orgUnitId}`);
  }

  // ========== Assignment Methods (Dropbox) ==========

  async getDropboxFolders(orgUnitId: number): Promise<BrightspaceDropbox[]> {
    return this.requestPaginated<BrightspaceDropbox>(
      `/d2l/api/le/${this.apiVersion}/${orgUnitId}/dropbox/folders/`
    );
  }

  async getDropboxSubmissions(orgUnitId: number, folderId: number): Promise<BrightspaceSubmission[]> {
    return this.requestPaginated<BrightspaceSubmission>(
      `/d2l/api/le/${this.apiVersion}/${orgUnitId}/dropbox/folders/${folderId}/submissions/`
    );
  }

  // ========== Grade Methods ==========

  async getGradeItems(orgUnitId: number): Promise<BrightspaceGradeItem[]> {
    return this.requestPaginated<BrightspaceGradeItem>(
      `/d2l/api/le/${this.apiVersion}/${orgUnitId}/grades/`
    );
  }

  async getMyGradeValue(orgUnitId: number, gradeItemId: number): Promise<BrightspaceGradeValue> {
    return this.request<BrightspaceGradeValue>(
      `/d2l/api/le/${this.apiVersion}/${orgUnitId}/grades/${gradeItemId}/values/myGradeValue`
    );
  }

  async getMyGrades(orgUnitId: number): Promise<BrightspaceGradeValue[]> {
    return this.requestPaginated<BrightspaceGradeValue>(
      `/d2l/api/le/${this.apiVersion}/${orgUnitId}/grades/values/myGradeValues/`
    );
  }

  // ========== Calendar Methods ==========

  async getCalendarEvents(params: {
    startDateTime?: string;
    endDateTime?: string;
    orgUnitId?: number;
  } = {}): Promise<BrightspaceEvent[]> {
    let endpoint = `/d2l/api/le/${this.apiVersion}/calendar/events/myEvents/`;
    const queryParams: string[] = [];

    if (params.startDateTime) {
      queryParams.push(`startDateTime=${encodeURIComponent(params.startDateTime)}`);
    }
    if (params.endDateTime) {
      queryParams.push(`endDateTime=${encodeURIComponent(params.endDateTime)}`);
    }
    if (params.orgUnitId) {
      queryParams.push(`orgUnitId=${params.orgUnitId}`);
    }

    if (queryParams.length > 0) {
      endpoint += '?' + queryParams.join('&');
    }

    return this.requestPaginated<BrightspaceEvent>(endpoint);
  }

  // ========== News/Announcements Methods ==========

  async getNewsItems(orgUnitId: number): Promise<BrightspaceNewsItem[]> {
    return this.requestPaginated<BrightspaceNewsItem>(
      `/d2l/api/le/${this.apiVersion}/${orgUnitId}/news/`
    );
  }

  // ========== Validation Methods ==========

  async testConnection(): Promise<BrightspaceUser> {
    return this.getCurrentUser();
  }
}

// Helper function to create a client instance
export function createBrightspaceClient(instanceUrl: string, accessToken: string): BrightspaceClient {
  return new BrightspaceClient(instanceUrl, accessToken);
}

// Color tags for auto-assignment to synced courses
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
    return `Winter ${year}`;
  } else if (month >= 5 && month <= 7) {
    return `Summer ${year}`;
  } else {
    return `Fall ${year}`;
  }
}

/**
 * Converts HTML content to clean plain text.
 */
export function htmlToPlainText(html: string | null): string {
  if (!html) return '';

  let text = html;

  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<link[^>]*>/gi, '');

  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');

  text = text.replace(/<li[^>]*>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');

  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');

  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)');

  text = text.replace(/<[^>]+>/g, '');

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

  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Extracts links from HTML content.
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

    if (url && !url.startsWith('#') && !url.startsWith('javascript:') && !seenUrls.has(urlLower)) {
      links.push({ label, url });
      seenUrls.add(urlLower);
    }
  }

  return links;
}

// Separators for notes sections
const USER_NOTES_HEADER = '─── Your Notes ───\n';
const BRIGHTSPACE_SEPARATOR = '\n\n─── From Brightspace ───\n';

/**
 * Merges existing links with Brightspace-extracted links.
 */
export function mergeLinks(
  existingLinks: Array<{ label: string; url: string }> | null,
  brightspaceLinks: Array<{ label: string; url: string }>
): Array<{ label: string; url: string }> {
  const existing = existingLinks || [];
  const brightspaceUrls = new Set(brightspaceLinks.map(l => l.url.toLowerCase()));

  const userLinks = existing.filter(l => !brightspaceUrls.has(l.url.toLowerCase()));

  return [...brightspaceLinks, ...userLinks];
}

/**
 * Merges user notes with Brightspace description.
 */
export function mergeNotes(existingNotes: string | null, brightspaceDescription: string | null): string {
  const brightspaceContent = htmlToPlainText(brightspaceDescription);

  if (!existingNotes || existingNotes.trim() === '') {
    return brightspaceContent ? `${USER_NOTES_HEADER}\n${BRIGHTSPACE_SEPARATOR}${brightspaceContent}` : '';
  }

  const brightspaceSeparatorIndex = existingNotes.indexOf('─── From Brightspace ───');
  const canvasSeparatorIndex = existingNotes.indexOf('─── From Canvas ───');
  const blackboardSeparatorIndex = existingNotes.indexOf('─── From Blackboard ───');
  const moodleSeparatorIndex = existingNotes.indexOf('─── From Moodle ───');
  const userNotesHeaderIndex = existingNotes.indexOf('─── Your Notes ───');

  let userNotes = '';

  const separators = [
    { index: brightspaceSeparatorIndex, text: '─── From Brightspace ───' },
    { index: canvasSeparatorIndex, text: '─── From Canvas ───' },
    { index: blackboardSeparatorIndex, text: '─── From Blackboard ───' },
    { index: moodleSeparatorIndex, text: '─── From Moodle ───' },
  ].filter(s => s.index !== -1).sort((a, b) => a.index - b.index);

  const firstSeparator = separators[0];

  if (firstSeparator) {
    if (userNotesHeaderIndex !== -1 && userNotesHeaderIndex < firstSeparator.index) {
      const afterUserHeader = existingNotes.substring(userNotesHeaderIndex + '─── Your Notes ───'.length);
      const beforeSeparator = afterUserHeader.substring(0, afterUserHeader.indexOf(firstSeparator.text));
      userNotes = beforeSeparator.trim();
    } else {
      userNotes = existingNotes.substring(0, firstSeparator.index).trim();
    }
  } else if (userNotesHeaderIndex !== -1) {
    userNotes = existingNotes.substring(userNotesHeaderIndex + '─── Your Notes ───'.length).trim();
  } else {
    if (existingNotes.trim() === brightspaceContent) {
      return brightspaceContent ? `${USER_NOTES_HEADER}\n${BRIGHTSPACE_SEPARATOR}${brightspaceContent}` : '';
    }
    userNotes = existingNotes.trim();
  }

  if (!userNotes && !brightspaceContent) {
    return '';
  }

  if (!userNotes) {
    return brightspaceContent ? `${USER_NOTES_HEADER}\n${BRIGHTSPACE_SEPARATOR}${brightspaceContent}` : '';
  }

  if (!brightspaceContent) {
    return `${USER_NOTES_HEADER}${userNotes}`;
  }

  return `${USER_NOTES_HEADER}${userNotes}${BRIGHTSPACE_SEPARATOR}${brightspaceContent}`;
}
