/**
 * Centralized Dashboard Service for StudySync.
 *
 * Handles HTTP requests to the authenticated backend dashboard endpoint:
 * - GET /api/dashboard - Retrieve consolidated metrics, active goal, current plan,
 *                        current resource, overall progress, and deterministic next step.
 *
 * Security & Architecture:
 * - Communicates exclusively with the StudySync backend API (/api/dashboard).
 * - Never calls Groq directly from the browser or duplicates server business logic.
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
    const error = new Error('Authentication required for dashboard metrics.');
    error.status = 401;
    throw error;
  }
  return token;
};

export const dashboardService = {
  /**
   * Retrieves consolidated dashboard metrics for the authenticated user.
   *
   * Accepts either an AbortSignal directly: `getDashboardData(signal)`
   * or an options object: `getDashboardData({ token, signal })`.
   *
   * @param {AbortSignal|object} [signalOrOptions]
   * @param {object} [maybeOptions]
   * @returns {Promise<object>} Dashboard data payload { activeGoal, currentPlan, currentResource, overallProgress, nextStep, learningSummary }
   */
  async getDashboardData(signalOrOptions, maybeOptions = {}) {
    let signal;
    let tokenOverride;

    // Check if signalOrOptions is an AbortSignal or has AbortSignal shape (or instance of global AbortSignal)
    if (signalOrOptions && (signalOrOptions instanceof AbortSignal || typeof signalOrOptions.aborted === 'boolean')) {
      signal = signalOrOptions;
      tokenOverride = maybeOptions?.token;
    } else if (signalOrOptions && typeof signalOrOptions === 'object') {
      signal = signalOrOptions.signal;
      tokenOverride = signalOrOptions.token;
    }

    const token = getAuthToken(tokenOverride);
    const url = `${API_BASE_URL}/api/dashboard`;

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
};
