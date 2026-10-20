/**
 * Centralized Learning Goals Service for StudySync.
 *
 * Handles HTTP requests to the authenticated backend learning goals endpoints:
 * - GET    /api/goals       - List authenticated user's goals (optional ?status=)
 * - POST   /api/goals       - Create a new learning goal
 * - GET    /api/goals/:id   - Retrieve a single goal owned by user
 * - PATCH  /api/goals/:id   - Update goal fields or status (ACTIVE, COMPLETED, ARCHIVED)
 * - DELETE /api/goals/:id   - Delete a goal owned by user
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
    const error = new Error('Authentication required for learning goals.');
    error.status = 401;
    throw error;
  }
  return token;
};

export const goalService = {
  /**
   * Fetches the authenticated user's goals, optionally filtered by status.
   *
   * @param {object} [options]
   * @param {string} [options.status] - 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ALL'
   * @param {string} [options.token]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<{ goals: object[], count: number }>}
   */
  async getGoals({ status, token: tokenOverride, signal } = {}) {
    const token = getAuthToken(tokenOverride);
    const params = new URLSearchParams();

    if (status && typeof status === 'string' && status !== 'ALL') {
      params.append('status', status.trim().toUpperCase());
    }

    const query = params.toString();
    const url = `${API_BASE_URL}/api/goals${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    const result = await handleResponse(response);
    const goals = Array.isArray(result.data) ? result.data : [];

    return {
      goals,
      count: typeof result.count === 'number' ? result.count : goals.length,
    };
  },

  /**
   * Retrieves a single learning goal by ID.
   *
   * @param {string} goalId
   * @param {object} [options]
   * @param {string} [options.token]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>}
   */
  async getGoalById(goalId, { token: tokenOverride, signal } = {}) {
    if (!goalId || typeof goalId !== 'string' || goalId.trim() === '') {
      throw new Error('Goal ID is required to retrieve a goal.');
    }

    const token = getAuthToken(tokenOverride);
    const url = `${API_BASE_URL}/api/goals/${encodeURIComponent(goalId.trim())}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    const result = await handleResponse(response);
    return result.data;
  },

  /**
   * Creates a new learning goal for the authenticated user.
   *
   * @param {object} goalData
   * @param {string} goalData.title
   * @param {string} [goalData.description]
   * @param {string[]} [goalData.targetSkills]
   * @param {string} [goalData.currentLevel]
   * @param {number} [goalData.weeklyHours]
   * @param {string|null} [goalData.targetDate]
   * @param {string} [goalData.status]
   * @param {object} [options]
   * @param {string} [options.token]
   * @returns {Promise<{ goal: object, message: string }>}
   */
  async createGoal(goalData, { token: tokenOverride } = {}) {
    if (!goalData || typeof goalData !== 'object') {
      throw new Error('Goal data is required to create a goal.');
    }

    if (!goalData.title || typeof goalData.title !== 'string' || goalData.title.trim() === '') {
      throw new Error('Goal title is required.');
    }

    const token = getAuthToken(tokenOverride);
    const url = `${API_BASE_URL}/api/goals`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(goalData),
    });

    const result = await handleResponse(response);
    return {
      goal: result.data,
      message: result.message,
    };
  },

  /**
   * Updates an existing learning goal.
   *
   * @param {string} goalId
   * @param {object} updates
   * @param {object} [options]
   * @param {string} [options.token]
   * @returns {Promise<{ goal: object, message: string }>}
   */
  async updateGoal(goalId, updates, { token: tokenOverride } = {}) {
    if (!goalId || typeof goalId !== 'string' || goalId.trim() === '') {
      throw new Error('Goal ID is required to update a goal.');
    }

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      throw new Error('At least one field update is required.');
    }

    const token = getAuthToken(tokenOverride);
    const url = `${API_BASE_URL}/api/goals/${encodeURIComponent(goalId.trim())}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const result = await handleResponse(response);
    return {
      goal: result.data,
      message: result.message,
    };
  },

  /**
   * Deletes a learning goal.
   *
   * @param {string} goalId
   * @param {object} [options]
   * @param {string} [options.token]
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async deleteGoal(goalId, { token: tokenOverride } = {}) {
    if (!goalId || typeof goalId !== 'string' || goalId.trim() === '') {
      throw new Error('Goal ID is required to delete a goal.');
    }

    const token = getAuthToken(tokenOverride);
    const url = `${API_BASE_URL}/api/goals/${encodeURIComponent(goalId.trim())}`;

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
