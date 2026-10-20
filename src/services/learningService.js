/**
 * Centralized Personal Learning Service for StudySync.
 *
 * Handles HTTP requests to the backend personal learning endpoints:
 * - GET    /api/learning       - List authenticated user's learning records
 * - POST   /api/learning       - Add a resource to user's learning library
 * - PATCH  /api/learning/:id   - Update progress (0-100) or status (NOT_STARTED, IN_PROGRESS, COMPLETED)
 * - DELETE /api/learning/:id   - Remove a resource from user's learning library
 */

import { API_BASE_URL } from './apiConfig.js';
import { tokenStorage } from './authService.js';

/**
 * Helper to handle fetch responses and extract standard JSON payloads.
 *
 * @param {Response} response
 * @returns {Promise<any>}
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

/**
 * Returns the authentication token or throws if unavailable.
 *
 * @param {string} [tokenOverride]
 * @returns {string} Bearer token
 */
const getAuthToken = (tokenOverride) => {
  const token = tokenOverride || tokenStorage.get();
  if (!token) {
    const error = new Error('Authentication required for personal learning library.');
    error.status = 401;
    throw error;
  }
  return token;
};

export const learningService = {
  /**
   * Fetches the authenticated user's learning records, optionally filtered by status.
   *
   * @param {object} [options]
   * @param {string} [options.status] - 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
   * @param {string} [options.token]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<{ records: object[], count: number }>}
   */
  async getLearningRecords({ status, token: tokenOverride, signal } = {}) {
    const token = getAuthToken(tokenOverride);
    const params = new URLSearchParams();

    if (status && typeof status === 'string' && status !== 'ALL') {
      params.append('status', status.trim().toUpperCase());
    }

    const query = params.toString();
    const url = `${API_BASE_URL}/api/learning${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    const result = await handleResponse(response);
    const records = Array.isArray(result.data) ? result.data : [];

    return {
      records,
      count: typeof result.count === 'number' ? result.count : records.length,
    };
  },

  /**
   * Adds a resource to the user's personal learning library.
   *
   * @param {string|number} resourceId - Numeric sourceId or MongoDB ObjectId
   * @param {object} [options]
   * @param {string} [options.token]
   * @returns {Promise<{ record: object, isDuplicate: boolean }>}
   */
  async addLearningRecord(resourceId, { token: tokenOverride } = {}) {
    if (resourceId == null || resourceId === '') {
      throw new Error('Resource ID is required to add to learning library.');
    }

    const token = getAuthToken(tokenOverride);
    const url = `${API_BASE_URL}/api/learning`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ resourceId }),
    });

    // 409 Conflict indicates resource is already in library; return existing record safely
    if (response.status === 409) {
      const data = await response.json().catch(() => ({}));
      return {
        record: data.data || null,
        isDuplicate: true,
        message: data.message || 'This resource is already in your learning library.',
      };
    }

    const result = await handleResponse(response);
    return {
      record: result.data,
      isDuplicate: false,
      message: result.message,
    };
  },

  /**
   * Updates progress and/or status for a learning record.
   *
   * @param {string} recordId - MongoDB ObjectId of the LearningProgress record
   * @param {object} updates
   * @param {number} [updates.progress] - Number between 0 and 100
   * @param {string} [updates.status] - 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
   * @param {object} [options]
   * @param {string} [options.token]
   * @returns {Promise<object>} Updated learning record
   */
  async updateLearningProgress(recordId, { progress, status }, { token: tokenOverride } = {}) {
    if (!recordId) {
      throw new Error('Learning record ID is required for progress updates.');
    }

    const token = getAuthToken(tokenOverride);
    const payload = {};

    if (progress !== undefined) {
      payload.progress = progress;
    }
    if (status !== undefined) {
      payload.status = status;
    }

    const url = `${API_BASE_URL}/api/learning/${encodeURIComponent(String(recordId).trim())}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await handleResponse(response);
    return result.data;
  },

  /**
   * Removes a learning record from the user's library.
   *
   * @param {string} recordId - MongoDB ObjectId of the LearningProgress record
   * @param {object} [options]
   * @param {string} [options.token]
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async deleteLearningRecord(recordId, { token: tokenOverride } = {}) {
    if (!recordId) {
      throw new Error('Learning record ID is required to remove from library.');
    }

    const token = getAuthToken(tokenOverride);
    const url = `${API_BASE_URL}/api/learning/${encodeURIComponent(String(recordId).trim())}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await handleResponse(response);
    return result;
  },
};
