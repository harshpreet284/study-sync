/**
 * Centralized Resource Service for StudySync.
 *
 * Handles HTTP requests to the backend resource catalog endpoints:
 * - GET /api/resources
 * - GET /api/resources/:id
 *
/**
 * Resolves and normalizes the API base URL.
 *
 * Rules:
 * - When unset or empty: returns '' (empty string), enabling Vite dev server
 *   proxying and relative path requests (/api/resources).
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

const API_BASE_URL = normalizeApiBaseUrl();

/**
 * Normalizes difficulty enum into user-facing display label.
 *
 * @param {string} difficulty - 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
 * @returns {string} e.g. 'Beginner'
 */
const formatDifficulty = (difficulty) => {
  if (!difficulty || typeof difficulty !== 'string') return 'Beginner';
  const lower = difficulty.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/**
 * Adapts a backend Resource schema record into the shape expected by frontend components.
 *
 * Preserves compatibility with CourseCard, CourseDetails, and Bookmarks without
 * requiring changes to the database schema.
 *
 * Business Logic & Formatting Rules:
 * - rating: 0 -> 'Unrated'
 * - estimatedDuration: 0 -> 'Self-paced'
 * - empty instructor -> platform or 'StudySync'
 * - modules -> syllabus array of { week, title, description }
 * - skills -> tags array
 * - sourceId || _id -> id
 *
 * @param {object} resource - Raw resource document from MongoDB API
 * @returns {object} Adapted course object
 */
export const adaptResourceToCourse = (resource) => {
  if (!resource) return null;

  // Preserve numeric sourceId if present for stable bookmarking and URLs, fallback to _id
  const id = resource.sourceId != null ? resource.sourceId : resource._id;

  // Handle rating: 0 as 'Unrated'
  const rating =
    typeof resource.rating === 'number' && resource.rating > 0
      ? resource.rating
      : 'Unrated';

  // Handle estimatedDuration: 0 as 'Self-paced'
  const duration =
    typeof resource.estimatedDuration === 'number' && resource.estimatedDuration > 0
      ? `${resource.estimatedDuration} hours`
      : 'Self-paced';

  // Handle empty instructor by displaying platform or default provider
  const instructor =
    resource.instructor && resource.instructor.trim()
      ? resource.instructor.trim()
      : resource.platform && resource.platform.trim()
        ? resource.platform.trim()
        : 'StudySync';

  // Map backend modules to frontend syllabus structure
  const syllabus =
    Array.isArray(resource.modules) && resource.modules.length > 0
      ? resource.modules.map((m, index) => ({
          week: m.order != null ? m.order : index + 1,
          title: m.title || `Module ${index + 1}`,
          description: m.description || '',
        }))
      : [];

  return {
    id,
    _id: resource._id,
    sourceId: resource.sourceId,
    title: resource.title || '',
    description: resource.description || '',
    category: resource.category || 'General',
    level: formatDifficulty(resource.difficulty),
    difficulty: resource.difficulty || 'BEGINNER',
    rating,
    rawRating: typeof resource.rating === 'number' ? resource.rating : 0,
    duration,
    estimatedDuration:
      typeof resource.estimatedDuration === 'number' ? resource.estimatedDuration : 0,
    instructor,
    platform: resource.platform || '',
    url: resource.url || '',
    type: resource.type || 'COURSE',
    thumbnail:
      resource.thumbnail ||
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    syllabus,
    tags: Array.isArray(resource.skills) ? resource.skills : [],
  };
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

export const resourceService = {
  /**
   * Fetches resources with optional search, category, difficulty, and type query params.
   *
   * @param {object} [filters]
   * @param {string} [filters.search]
   * @param {string} [filters.category]
   * @param {string} [filters.difficulty]
   * @param {string} [filters.type]
   * @returns {Promise<{ courses: object[], count: number }>}
   */
  async getResources(filters = {}, { signal } = {}) {
    const params = new URLSearchParams();

    if (filters.search && typeof filters.search === 'string') {
      const trimmed = filters.search.trim();
      if (trimmed.length > 0) {
        // Enforce 200-character upper bound before sending query
        params.append('search', trimmed.slice(0, 200));
      }
    }

    if (filters.category && filters.category !== 'All' && typeof filters.category === 'string') {
      const trimmed = filters.category.trim();
      if (trimmed.length > 0) {
        params.append('category', trimmed);
      }
    }

    if (filters.difficulty && filters.difficulty !== 'All' && typeof filters.difficulty === 'string') {
      const trimmed = filters.difficulty.trim();
      if (trimmed.length > 0) {
        params.append('difficulty', trimmed.toUpperCase());
      }
    }

    if (filters.type && filters.type !== 'All' && typeof filters.type === 'string') {
      const trimmed = filters.type.trim();
      if (trimmed.length > 0) {
        params.append('type', trimmed.toUpperCase());
      }
    }

    const query = params.toString();
    const url = `${API_BASE_URL}/api/resources${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    const result = await handleResponse(response);
    const resources = Array.isArray(result.data) ? result.data : [];

    return {
      courses: resources.map(adaptResourceToCourse),
      count: typeof result.count === 'number' ? result.count : resources.length,
    };
  },

  /**
   * Fetches a single resource by numeric sourceId or MongoDB ObjectId.
   *
   * @param {string|number} id
   * @param {object} [options]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} Adapted course object
   */
  async getResourceById(id, { signal } = {}) {
    if (id == null || id === '') {
      throw new Error('Resource ID is required');
    }

    const url = `${API_BASE_URL}/api/resources/${encodeURIComponent(String(id).trim())}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    const result = await handleResponse(response);
    return adaptResourceToCourse(result.data);
  },
};
