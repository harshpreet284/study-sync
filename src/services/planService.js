/**
 * Centralized AI Study Planner Service for StudySync.
 *
 * Handles HTTP requests to the authenticated backend learning plan endpoints:
 * - POST /api/plans/generate     - Generate or regenerate AI study plan for a goal
 * - GET  /api/plans/:id          - Retrieve study plan by plan ID
 * - GET  /api/plans/goal/:goalId - Retrieve current study plan by goal ID
 *
 * Security & Architecture:
 * - Communicates exclusively with the StudySync backend API (/api/plans).
 * - Never calls Groq directly from the browser or exposes provider credentials.
 * - Adheres strictly to token-handling and AbortSignal conventions.
 */

import { API_BASE_URL } from './apiConfig.js';
import { tokenStorage } from './authService.js';

/**
 * Helper to handle fetch responses and extract standard JSON payloads.
 * Throws structured Error with HTTP status and parsed response data.
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
 * Returns the authentication token or throws 401 if unavailable.
 *
 * @param {string} [tokenOverride]
 * @returns {string} Bearer token
 */
const getAuthToken = (tokenOverride) => {
  const token = tokenOverride || tokenStorage.get();
  if (!token) {
    const error = new Error('Authentication required for study plans.');
    error.status = 401;
    throw error;
  }
  return token;
};

export const planService = {
  /**
   * Generates or regenerates a personalized study plan for a goal.
   *
   * @param {string|object} goalIdOrOptions - Goal ID string or { goalId, token, signal }
   * @param {object} [maybeOptions]
   * @param {string} [maybeOptions.token]
   * @param {AbortSignal} [maybeOptions.signal]
   * @returns {Promise<{ plan: object, message: string } & object>}
   */
  async generatePlan(goalIdOrOptions, maybeOptions = {}) {
    let goalId;
    let options = {};

    if (typeof goalIdOrOptions === 'string') {
      goalId = goalIdOrOptions;
      options = maybeOptions;
    } else if (goalIdOrOptions && typeof goalIdOrOptions === 'object') {
      goalId = goalIdOrOptions.goalId;
      options = goalIdOrOptions;
    }

    if (!goalId || typeof goalId !== 'string' || goalId.trim() === '') {
      throw new Error('Goal ID is required to generate a study plan.');
    }

    const token = getAuthToken(options.token);
    const url = `${API_BASE_URL}/api/plans/generate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ goalId: goalId.trim() }),
      signal: options.signal,
    });

    const result = await handleResponse(response);
    const plan = result.data;

    return {
      plan,
      message: result.message || 'Learning plan generated successfully.',
      ...(plan && typeof plan === 'object' ? plan : {}),
    };
  },

  /**
   * Retrieves a study plan by its unique plan ID.
   *
   * @param {string} planId
   * @param {object} [options]
   * @param {string} [options.token]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>}
   */
  async getPlanById(planId, { token: tokenOverride, signal } = {}) {
    if (!planId || typeof planId !== 'string' || planId.trim() === '') {
      throw new Error('Plan ID is required to retrieve a study plan.');
    }

    const token = getAuthToken(tokenOverride);
    const url = `${API_BASE_URL}/api/plans/${encodeURIComponent(planId.trim())}`;

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
   * Retrieves the current study plan associated with a learning goal.
   * Returns null if no plan has been generated yet for the goal.
   *
   * @param {string} goalId
   * @param {object} [options]
   * @param {string} [options.token]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object|null>}
   */
  async getPlanByGoalId(goalId, { token: tokenOverride, signal } = {}) {
    if (!goalId || typeof goalId !== 'string' || goalId.trim() === '') {
      throw new Error('Goal ID is required to retrieve a goal study plan.');
    }

    const token = getAuthToken(tokenOverride);
    const url = `${API_BASE_URL}/api/plans/goal/${encodeURIComponent(goalId.trim())}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    const result = await handleResponse(response);
    return result.data ?? null;
  },
};
