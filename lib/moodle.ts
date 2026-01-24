// Moodle LMS API Client
// Documentation: https://docs.moodle.org/dev/Web_service_API_functions

// Moodle API Types
export interface MoodleUser {
  userid: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email?: string;
  lang?: string;
  siteid?: number;
}

export interface MoodleCourse {
  id: number;
  shortname: string;
  fullname: string;
  displayname?: string;
  enrolledusercount?: number;
  idnumber?: string;
  visible?: number;
  summary?: string;
  summaryformat?: number;
  format?: string;
  showgrades?: boolean;
  lang?: string;
  enablecompletion?: boolean;
  category?: number;
  startdate?: number;
  enddate?: number;
}

export interface MoodleAssignment {
  id: number;
  cmid: number; // Course module ID
  course: number;
  name: string;
  intro?: string;
  introformat?: number;
  duedate: number;
  cutoffdate?: number;
  allowsubmissionsfromdate?: number;
  grade: number; // Max grade
  timemodified?: number;
  completionsubmit?: boolean;
  nosubmissions?: boolean;
  submissiondrafts?: boolean;
}

export interface MoodleSubmission {
  id: number;
  userid: number;
  attemptnumber: number;
  timecreated: number;
  timemodified: number;
  status: 'new' | 'draft' | 'submitted' | 'reopened';
  groupid?: number;
}

export interface MoodleGrade {
  userid: number;
  grade: number | string | null;
  locked?: boolean;
  hidden?: boolean;
  feedback?: string;
  feedbackformat?: number;
  timemodified?: number;
  gradeformatted?: string;
}

export interface MoodleEvent {
  id: number;
  name: string;
  description?: string;
  descriptionformat?: number;
  courseid?: number;
  groupid?: number;
  userid?: number;
  modulename?: string;
  instance?: number;
  eventtype: string;
  timestart: number;
  timeduration: number;
  visible?: number;
  timemodified?: number;
  url?: string;
}

export interface MoodleForumPost {
  id: number;
  discussionid: number;
  parentid?: number;
  userid: number;
  created: number;
  modified?: number;
  subject: string;
  message: string;
  messageformat?: number;
  author?: {
    id: number;
    fullname: string;
  };
}

export interface MoodleForumDiscussion {
  id: number;
  course: number;
  forum: number;
  name: string;
  firstpost: number;
  userid: number;
  groupid?: number;
  timemodified: number;
  usermodified?: number;
  numreplies?: number;
  pinned?: boolean;
}

export interface MoodleSiteInfo {
  sitename: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  lang: string;
  userid: number;
  siteurl: string;
  userpictureurl?: string;
  functions?: Array<{ name: string; version: string }>;
}

export interface MoodleError {
  exception?: string;
  errorcode?: string;
  message?: string;
  debuginfo?: string;
}

// Custom error class for Moodle authentication failures
export class MoodleAuthError extends Error {
  constructor(message: string = 'Moodle API authentication failed. Your access token may have expired or is invalid.') {
    super(message);
    this.name = 'MoodleAuthError';
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

export class MoodleClient {
  private baseUrl: string;
  private token: string;

  constructor(instanceUrl: string, token: string) {
    // Normalize the instance URL
    let normalizedUrl = instanceUrl.trim();
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      // Use HTTP for localhost (mock server), HTTPS for production
      const isLocalhost = normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1');
      normalizedUrl = isLocalhost ? `http://${normalizedUrl}` : `https://${normalizedUrl}`;
    }

    this.baseUrl = normalizedUrl;
    this.token = token;
  }

  private async request<T>(wsfunction: string, params: Record<string, string | number> = {}): Promise<T> {
    const searchParams = new URLSearchParams({
      wstoken: this.token,
      moodlewsrestformat: 'json',
      wsfunction,
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
    });

    const url = `${this.baseUrl}/webservice/rest/server.php?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Moodle API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check for Moodle error response
    if (data && typeof data === 'object') {
      const errorData = data as MoodleError;
      if (errorData.exception || errorData.errorcode) {
        // Check for authentication errors
        if (
          errorData.errorcode === 'invalidtoken' ||
          errorData.errorcode === 'accessexception' ||
          errorData.errorcode === 'webservicenotavailable'
        ) {
          throw new MoodleAuthError(errorData.message || 'Authentication failed');
        }
        throw new Error(errorData.message || `Moodle error: ${errorData.errorcode}`);
      }
    }

    return data as T;
  }

  // ========== User Methods ==========

  async getSiteInfo(): Promise<MoodleSiteInfo> {
    return this.request<MoodleSiteInfo>('core_webservice_get_site_info');
  }

  async getCurrentUser(): Promise<MoodleUser> {
    const siteInfo = await this.getSiteInfo();
    return {
      userid: siteInfo.userid,
      username: siteInfo.username,
      firstname: siteInfo.firstname,
      lastname: siteInfo.lastname,
      fullname: siteInfo.fullname,
    };
  }

  // ========== Course Methods ==========

  async getUserCourses(userId?: number): Promise<MoodleCourse[]> {
    const params: Record<string, number> = {};
    if (userId) {
      params.userid = userId;
    }
    return this.request<MoodleCourse[]>('core_enrol_get_users_courses', params);
  }

  async getCourse(courseId: number): Promise<MoodleCourse> {
    const courses = await this.request<{ courses: MoodleCourse[] }>('core_course_get_courses', {
      'options[ids][0]': courseId,
    });
    if (!courses.courses || courses.courses.length === 0) {
      throw new Error(`Course ${courseId} not found`);
    }
    return courses.courses[0];
  }

  // ========== Assignment Methods ==========

  async getCourseAssignments(courseIds: number[]): Promise<{ courses: Array<{ id: number; assignments: MoodleAssignment[] }> }> {
    const params: Record<string, number> = {};
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    return this.request('mod_assign_get_assignments', params);
  }

  async getAssignmentSubmissions(
    assignmentIds: number[],
    status?: string
  ): Promise<{ assignments: Array<{ assignmentid: number; submissions: MoodleSubmission[] }> }> {
    const params: Record<string, string | number> = {};
    assignmentIds.forEach((id, index) => {
      params[`assignmentids[${index}]`] = id;
    });
    if (status) {
      params.status = status;
    }
    return this.request('mod_assign_get_submissions', params);
  }

  // ========== Grade Methods ==========

  async getUserGrades(courseId: number, userId?: number): Promise<{
    usergrades: Array<{
      courseid: number;
      userid: number;
      gradeitems: Array<{
        id: number;
        itemname: string;
        itemtype: string;
        itemmodule?: string;
        iteminstance?: number;
        graderaw?: number;
        grademax?: number;
        percentageformatted?: string;
        feedback?: string;
      }>;
    }>;
  }> {
    const params: Record<string, number> = { courseid: courseId };
    if (userId) {
      params.userid = userId;
    }
    return this.request('gradereport_user_get_grade_items', params);
  }

  // ========== Calendar Methods ==========

  async getCalendarEvents(params: {
    timestart?: number;
    timeend?: number;
    courseids?: number[];
  } = {}): Promise<{ events: MoodleEvent[] }> {
    const requestParams: Record<string, string | number> = {};

    if (params.timestart) {
      requestParams['options[timestart]'] = params.timestart;
    }
    if (params.timeend) {
      requestParams['options[timeend]'] = params.timeend;
    }
    if (params.courseids) {
      params.courseids.forEach((id, index) => {
        requestParams[`events[courseids][${index}]`] = id;
      });
    }

    return this.request('core_calendar_get_calendar_events', requestParams);
  }

  // ========== Forum/Announcement Methods ==========

  async getCourseForums(courseId: number): Promise<Array<{
    id: number;
    course: number;
    type: string;
    name: string;
    intro?: string;
  }>> {
    return this.request('mod_forum_get_forums_by_courses', {
      'courseids[0]': courseId,
    });
  }

  async getForumDiscussions(forumId: number): Promise<{
    discussions: MoodleForumDiscussion[];
  }> {
    return this.request('mod_forum_get_forum_discussions', {
      forumid: forumId,
    });
  }

  async getDiscussionPosts(discussionId: number): Promise<{
    posts: MoodleForumPost[];
  }> {
    return this.request('mod_forum_get_discussion_posts', {
      discussionid: discussionId,
    });
  }

  // ========== Validation Methods ==========

  async testConnection(): Promise<MoodleSiteInfo> {
    return this.getSiteInfo();
  }
}

// Helper function to create a client instance
export function createMoodleClient(instanceUrl: string, token: string): MoodleClient {
  return new MoodleClient(instanceUrl, token);
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

  // Remove script and style tags entirely
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
const MOODLE_SEPARATOR = '\n\n─── From Moodle ───\n';

/**
 * Merges existing links with Moodle-extracted links.
 */
export function mergeLinks(
  existingLinks: Array<{ label: string; url: string }> | null,
  moodleLinks: Array<{ label: string; url: string }>
): Array<{ label: string; url: string }> {
  const existing = existingLinks || [];
  const moodleUrls = new Set(moodleLinks.map(l => l.url.toLowerCase()));

  const userLinks = existing.filter(l => !moodleUrls.has(l.url.toLowerCase()));

  return [...moodleLinks, ...userLinks];
}

/**
 * Merges user notes with Moodle description.
 */
export function mergeNotes(existingNotes: string | null, moodleDescription: string | null): string {
  const moodleContent = htmlToPlainText(moodleDescription);

  if (!existingNotes || existingNotes.trim() === '') {
    return moodleContent ? `${USER_NOTES_HEADER}\n${MOODLE_SEPARATOR}${moodleContent}` : '';
  }

  const moodleSeparatorIndex = existingNotes.indexOf('─── From Moodle ───');
  const canvasSeparatorIndex = existingNotes.indexOf('─── From Canvas ───');
  const blackboardSeparatorIndex = existingNotes.indexOf('─── From Blackboard ───');
  const brightspaceSeparatorIndex = existingNotes.indexOf('─── From Brightspace ───');
  const userNotesHeaderIndex = existingNotes.indexOf('─── Your Notes ───');

  let userNotes = '';

  // Find the first separator
  const separators = [
    { index: moodleSeparatorIndex, text: '─── From Moodle ───' },
    { index: canvasSeparatorIndex, text: '─── From Canvas ───' },
    { index: blackboardSeparatorIndex, text: '─── From Blackboard ───' },
    { index: brightspaceSeparatorIndex, text: '─── From Brightspace ───' },
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
    if (existingNotes.trim() === moodleContent) {
      return moodleContent ? `${USER_NOTES_HEADER}\n${MOODLE_SEPARATOR}${moodleContent}` : '';
    }
    userNotes = existingNotes.trim();
  }

  if (!userNotes && !moodleContent) {
    return '';
  }

  if (!userNotes) {
    return moodleContent ? `${USER_NOTES_HEADER}\n${MOODLE_SEPARATOR}${moodleContent}` : '';
  }

  if (!moodleContent) {
    return `${USER_NOTES_HEADER}${userNotes}`;
  }

  return `${USER_NOTES_HEADER}${userNotes}${MOODLE_SEPARATOR}${moodleContent}`;
}
