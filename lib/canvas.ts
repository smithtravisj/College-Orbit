// Canvas LMS API Client
// Documentation: https://canvas.instructure.com/doc/api/

// Canvas API Types
export interface CanvasUser {
  id: number;
  name: string;
  sortable_name: string;
  short_name: string;
  login_id: string;
  avatar_url: string;
  email?: string;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  uuid: string;
  start_at: string | null;
  end_at: string | null;
  enrollment_term_id: number;
  enrollments?: CanvasEnrollment[];
  workflow_state: string;
  time_zone?: string;
}

export interface CanvasEnrollment {
  id: number;
  course_id: number;
  enrollment_state: string;
  type: string;
  role: string;
  computed_current_grade?: string;
  computed_current_score?: number;
  computed_final_grade?: string;
  computed_final_score?: number;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string | null;
  due_at: string | null;
  lock_at: string | null;
  unlock_at: string | null;
  points_possible: number;
  course_id: number;
  submission_types: string[];
  has_submitted_submissions: boolean;
  html_url: string;
  published: boolean;
  submission?: CanvasSubmission;
}

export interface CanvasSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  score: number | null;
  grade: string | null;
  graded_at: string | null;
  submitted_at: string | null;
  workflow_state: string;
  late: boolean;
  missing: boolean;
  excused: boolean;
}

export interface CanvasCalendarEvent {
  id: number;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  all_day_date: string | null;
  location_name: string | null;
  location_address: string | null;
  context_code: string; // e.g., "course_123" or "user_456"
  workflow_state: string;
  html_url: string;
}

export interface CanvasAnnouncement {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  context_code: string; // "course_123"
  html_url: string;
  user_name: string;
  read_state: string;
}

export interface CanvasError {
  errors: Array<{ message: string }>;
  status: string;
}

// Custom error class for Canvas authentication failures (expired/invalid tokens)
export class CanvasAuthError extends Error {
  constructor(message: string = 'Canvas API authentication failed. Your access token may have expired.') {
    super(message);
    this.name = 'CanvasAuthError';
  }
}

export class CanvasClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(instanceUrl: string, accessToken: string) {
    // Normalize the instance URL
    let normalizedUrl = instanceUrl.trim();

    // Remove trailing slashes
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    // Add https:// if no protocol specified
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    this.baseUrl = normalizedUrl;
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;

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
        throw new CanvasAuthError('Your Canvas access token has expired or is invalid. Please reconnect your Canvas account in Settings.');
      }

      let errorMessage = `Canvas API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json() as CanvasError;
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors.map(e => e.message).join(', ');
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
    let url = `${this.baseUrl}/api/v1${endpoint}`;

    // Add query parameters
    const searchParams = new URLSearchParams({
      per_page: '100', // Max allowed by Canvas
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
          throw new CanvasAuthError('Your Canvas access token has expired or is invalid. Please reconnect your Canvas account in Settings.');
        }

        let errorMessage = `Canvas API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json() as CanvasError;
          if (errorData.errors && errorData.errors.length > 0) {
            errorMessage = errorData.errors.map(e => e.message).join(', ');
          }
        } catch {
          // If we can't parse the error, use the status message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json() as T[];
      results.push(...data);

      // Parse Link header for pagination
      const linkHeader = response.headers.get('Link');
      url = this.parseNextLink(linkHeader);
    }

    return results;
  }

  private parseNextLink(linkHeader: string | null): string {
    if (!linkHeader) return '';

    const links = linkHeader.split(',');
    for (const link of links) {
      const match = link.match(/<([^>]+)>;\s*rel="next"/);
      if (match) {
        return match[1];
      }
    }
    return '';
  }

  // ========== User Methods ==========

  async getCurrentUser(): Promise<CanvasUser> {
    return this.request<CanvasUser>('/users/self');
  }

  // ========== Course Methods ==========

  async getCourses(params: {
    enrollment_state?: 'active' | 'invited_or_pending' | 'completed';
    include?: string[];
  } = {}): Promise<CanvasCourse[]> {
    const queryParams: Record<string, string> = {};

    if (params.enrollment_state) {
      queryParams.enrollment_state = params.enrollment_state;
    }

    if (params.include && params.include.length > 0) {
      queryParams['include[]'] = params.include.join(',');
    }

    return this.requestPaginated<CanvasCourse>('/courses', queryParams);
  }

  async getCourse(courseId: string | number): Promise<CanvasCourse> {
    return this.request<CanvasCourse>(`/courses/${courseId}`);
  }

  // ========== Assignment Methods ==========

  async getAssignments(
    courseId: string | number,
    params: {
      include?: string[];
      order_by?: 'due_at' | 'name' | 'position';
    } = {}
  ): Promise<CanvasAssignment[]> {
    const queryParams: Record<string, string> = {};

    if (params.include && params.include.length > 0) {
      queryParams['include[]'] = params.include.join(',');
    }

    if (params.order_by) {
      queryParams.order_by = params.order_by;
    }

    return this.requestPaginated<CanvasAssignment>(
      `/courses/${courseId}/assignments`,
      queryParams
    );
  }

  async getAssignment(
    courseId: string | number,
    assignmentId: string | number
  ): Promise<CanvasAssignment> {
    return this.request<CanvasAssignment>(
      `/courses/${courseId}/assignments/${assignmentId}`
    );
  }

  // ========== Submission Methods ==========

  async getSubmission(
    courseId: string | number,
    assignmentId: string | number,
    userId: string | number = 'self'
  ): Promise<CanvasSubmission> {
    return this.request<CanvasSubmission>(
      `/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`
    );
  }

  async getSubmissions(
    courseId: string | number,
    assignmentId: string | number
  ): Promise<CanvasSubmission[]> {
    return this.requestPaginated<CanvasSubmission>(
      `/courses/${courseId}/assignments/${assignmentId}/submissions`
    );
  }

  // Get all submissions for a user across all assignments in a course
  async getUserSubmissionsForCourse(
    courseId: string | number,
    userId: string | number = 'self'
  ): Promise<CanvasSubmission[]> {
    return this.requestPaginated<CanvasSubmission>(
      `/courses/${courseId}/students/submissions`,
      { student_ids: String(userId) }
    );
  }

  // ========== Calendar Event Methods ==========

  async getCalendarEvents(params: {
    start_date: string; // ISO date string
    end_date: string; // ISO date string
    context_codes?: string[]; // e.g., ["course_123", "user_456"]
    type?: 'event' | 'assignment';
  }): Promise<CanvasCalendarEvent[]> {
    const queryParams: Record<string, string> = {
      start_date: params.start_date,
      end_date: params.end_date,
    };

    if (params.context_codes && params.context_codes.length > 0) {
      queryParams['context_codes[]'] = params.context_codes.join(',');
    }

    if (params.type) {
      queryParams.type = params.type;
    }

    return this.requestPaginated<CanvasCalendarEvent>(
      '/calendar_events',
      queryParams
    );
  }

  // ========== Announcement Methods ==========

  async getAnnouncements(params: {
    context_codes: string[]; // e.g., ["course_123", "course_456"]
    start_date?: string; // ISO date string
    end_date?: string; // ISO date string
    active_only?: boolean;
  }): Promise<CanvasAnnouncement[]> {
    const queryParams: Record<string, string> = {
      'context_codes[]': params.context_codes.join(','),
    };

    if (params.start_date) {
      queryParams.start_date = params.start_date;
    }

    if (params.end_date) {
      queryParams.end_date = params.end_date;
    }

    if (params.active_only !== undefined) {
      queryParams.active_only = String(params.active_only);
    }

    return this.requestPaginated<CanvasAnnouncement>(
      '/announcements',
      queryParams
    );
  }

  // ========== Enrollment/Grade Methods ==========

  async getEnrollments(
    courseId: string | number,
    params: {
      type?: string[];
      state?: string[];
    } = {}
  ): Promise<CanvasEnrollment[]> {
    const queryParams: Record<string, string> = {};

    if (params.type && params.type.length > 0) {
      queryParams['type[]'] = params.type.join(',');
    }

    if (params.state && params.state.length > 0) {
      queryParams['state[]'] = params.state.join(',');
    }

    return this.requestPaginated<CanvasEnrollment>(
      `/courses/${courseId}/enrollments`,
      queryParams
    );
  }

  // ========== Validation Methods ==========

  /**
   * Test the connection by fetching the current user
   * Returns the user if successful, throws an error if not
   */
  async testConnection(): Promise<CanvasUser> {
    return this.getCurrentUser();
  }
}

// Helper function to create a client instance
export function createCanvasClient(
  instanceUrl: string,
  accessToken: string
): CanvasClient {
  return new CanvasClient(instanceUrl, accessToken);
}

// Helper to encrypt the access token before storing
// Note: This uses a simple encryption for storage - in production you'd want
// to use a more robust solution like storing in an encrypted database field
export function encryptToken(token: string, secret: string): string {
  // Using base64 encoding with XOR for basic obfuscation
  // This is not cryptographically secure but provides basic protection
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

// Color tags for auto-assignment to synced courses
const COURSE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
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
