// Shared API wrapper for College Orbit extension
const API_BASE_PROD = 'https://collegeorbit.app';
const API_BASE_DEV = 'http://localhost:3008';

const OrbitAPI = {
  // Detect environment: use prod if we got a session cookie from collegeorbit.app
  _apiBase: null,

  async getApiBase() {
    if (this._apiBase) return this._apiBase;
    const cookie = await this.getSessionCookie();
    this._apiBase = cookie ? API_BASE_PROD : API_BASE_DEV;
    return this._apiBase;
  },

  // Try to read the NextAuth session cookie from collegeorbit.app
  async getSessionCookie() {
    try {
      // HTTPS uses __Secure- prefix
      const cookie = await chrome.cookies.get({
        url: 'https://collegeorbit.app',
        name: '__Secure-next-auth.session-token',
      });
      if (cookie) return cookie.value;

      // Fallback: non-secure name (dev/localhost)
      const fallback = await chrome.cookies.get({
        url: 'https://collegeorbit.app',
        name: 'next-auth.session-token',
      });
      return fallback?.value || null;
    } catch {
      return null;
    }
  },

  // Check if user is authenticated via either method
  async isAuthenticated() {
    const cookie = await this.getSessionCookie();
    if (cookie) return true;
    const token = await this.getToken();
    return !!token;
  },

  async getToken() {
    const result = await chrome.storage.local.get('orbit_token');
    return result.orbit_token || null;
  },

  async setToken(token) {
    await chrome.storage.local.set({ orbit_token: token });
  },

  async setUser(user) {
    await chrome.storage.local.set({ orbit_user: user });
  },

  async getUser() {
    const result = await chrome.storage.local.get('orbit_user');
    return result.orbit_user || null;
  },

  async clearAuth() {
    this._apiBase = null;
    await chrome.storage.local.remove(['orbit_token', 'orbit_user']);
  },

  async fetch(path, options = {}) {
    const sessionCookie = await this.getSessionCookie();
    const extensionToken = await this.getToken();

    if (!sessionCookie && !extensionToken) {
      throw new Error('Not authenticated');
    }

    const base = await this.getApiBase();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const fetchOptions = { ...options, headers };

    if (sessionCookie) {
      // Cookie header is forbidden in fetch, use custom header instead
      headers['X-Session-Token'] = sessionCookie;
    } else if (extensionToken) {
      headers['Authorization'] = `Bearer ${extensionToken}`;
    }

    const res = await fetch(`${base}${path}`, fetchOptions);

    if (res.status === 401) {
      await this.clearAuth();
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed (${res.status})`);
    }

    return res.json();
  },

  // Fetch current user info using cookie auth
  async fetchSessionUser() {
    try {
      const base = await this.getApiBase();
      const sessionCookie = await this.getSessionCookie();
      if (!sessionCookie) return null;

      const res = await fetch(`${base}/api/auth/session`, {
        headers: {
          'X-Session-Token': sessionCookie,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.user?.email) {
        await this.setUser(data.user);
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  async login(email, password) {
    const base = await this.getApiBase();
    const res = await fetch(`${base}/api/auth/extension-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Login failed');
    }

    const data = await res.json();
    await this.setToken(data.token);
    await this.setUser(data.user);
    return data.user;
  },
};
