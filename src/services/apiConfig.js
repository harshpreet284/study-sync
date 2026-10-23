/**
 * Shared API Configuration for StudySync.
 *
 * Resolves and normalizes the backend API base URL from import.meta.env.VITE_API_URL.
 *
 * Rules:
 * - When unset or empty: returns '' (empty string), enabling Vite dev server
 *   proxying and relative path requests (/api/...).
 * - Trims whitespace and strips any trailing slashes.
 * - If the configured base already ends with '/api', strips it so
 *   subsequent '/api/...' paths avoid duplicate '/api/api' segments.
 *
 * @param {string} [rawUrl]
 * @returns {string} Normalized base URL without trailing slash or redundant /api
 */
export const normalizeApiBaseUrl = (rawUrl = import.meta.env?.VITE_API_URL) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
};

export const API_BASE_URL = normalizeApiBaseUrl();
