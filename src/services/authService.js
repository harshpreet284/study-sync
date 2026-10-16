/**
 * Centralized Authentication Service for StudySync.
 *
 * Handles HTTP requests to the backend authentication endpoints:
 * - POST /api/auth/register
 * - POST /api/auth/login
 * - GET  /api/auth/me
 *
 * Token Storage Architecture & Security Trade-offs:
 * - Strategy: JWT stored in browser localStorage with in-memory AuthContext state.
 * - Trade-off Analysis:
 *   - Storing tokens in localStorage exposes them to token theft (exfiltration)
 *     if ANY malicious or untrusted JavaScript executes in the application's origin
 *     (e.g., via compromised dependencies, malicious browser extensions, or XSS).
 *   - React's default JSX string escaping protects against basic HTML injection in text nodes,
 *     but DOES NOT guarantee full protection against XSS (such as malicious href URLs,
 *     third-party script vulnerabilities, or direct DOM manipulation).
 *   - An HttpOnly cookie prevents JavaScript access to tokens, but requires CSRF
 *     protection tokens and complex cross-origin/domain cookie handling.
 *   - For this Single-Page Application (SPA) REST architecture, Bearer token transport
 *     via localStorage eliminates Cross-Site Request Forgery (CSRF) attack vectors, but
 *     relies on strict origin isolation, secure dependencies, and avoiding script injection.
 */

const TOKEN_KEY = 'studysync_token';

export const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
      console.error('Failed to save token to localStorage:', err);
    }
  },
  remove: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      console.error('Failed to remove token from localStorage:', err);
    }
  },
};

/**
 * Helper to handle fetch responses and extract standard JSON payloads.
 */
const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const authService = {
  /**
   * Registers a new user.
   *
   * @param {object} credentials - { name, email, password }
   * @returns {Promise<{ user: object, token: string }>}
   */
  async register({ name, email, password }) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const result = await handleResponse(response);
    if (result.data?.token) {
      tokenStorage.set(result.data.token);
    }
    return result.data;
  },

  /**
   * Logs in an existing user.
   *
   * @param {object} credentials - { email, password }
   * @returns {Promise<{ user: object, token: string }>}
   */
  async login({ email, password }) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await handleResponse(response);
    if (result.data?.token) {
      tokenStorage.set(result.data.token);
    }
    return result.data;
  },

  /**
   * Fetches current user profile using stored or provided JWT.
   *
   * @param {string} [tokenOverride]
   * @returns {Promise<{ user: object }>}
   */
  async getMe(tokenOverride) {
    const token = tokenOverride || tokenStorage.get();
    if (!token) {
      throw new Error('No authentication token available.');
    }

    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await handleResponse(response);
    return result.data;
  },

  /**
   * Logs out the user by clearing client-side token.
   */
  logout() {
    tokenStorage.remove();
  },
};
