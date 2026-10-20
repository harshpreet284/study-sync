import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { learningService } from '../services/learningService';
import {
  normalizeBookmarkIds,
  matchesBookmarkId,
} from '../services/resourceService';

export { normalizeBookmarkIds, matchesBookmarkId };

const BookmarksContext = createContext();

const OFFLINE_BOOKMARKS_KEY = 'studysync-bookmarks';

/**
 * Helper to safely read offline bookmark IDs from localStorage.
 */
const readStoredOfflineIds = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Helper to safely write offline bookmark IDs to localStorage.
 */
const writeStoredOfflineIds = (ids) => {
  try {
    if (!ids || ids.length === 0) {
      localStorage.removeItem(OFFLINE_BOOKMARKS_KEY);
    } else {
      localStorage.setItem(OFFLINE_BOOKMARKS_KEY, JSON.stringify(ids));
    }
  } catch (err) {
    console.error('Failed to update offline bookmarks in localStorage:', err);
  }
};

export const BookmarksProvider = ({ children }) => {
  const { user, token, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [learningRecords, setLearningRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offlineIds, setOfflineIds] = useState(readStoredOfflineIds);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [authPrompt, setAuthPrompt] = useState({ isOpen: false, message: '' });

  /**
   * Refreshes learning records from backend for authenticated users.
   */
  const refreshLearning = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setLearningRecords([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { records } = await learningService.getLearningRecords({ token });
      setLearningRecords(records);
    } catch (err) {
      console.error('Failed to fetch personal learning records:', err);
      // If 401, session expired; do not leave stuck error
      if (err.status !== 401) {
        setError(err.message || 'Failed to load your learning library. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  /**
   * Synchronize learning library on auth state changes.
   */
  useEffect(() => {
    if (isAuthLoading) return;

    if (isAuthenticated && token) {
      refreshLearning();
    } else {
      setLearningRecords([]);
      setIsLoading(false);
      setError(null);
    }
  }, [isAuthenticated, token, isAuthLoading, refreshLearning]);

  /**
   * Derived bookmarked IDs:
   * - When authenticated: derived from backend learning records
   * - When unauthenticated: derived from offline localStorage bookmarks
   */
  const bookmarkedIds = useMemo(() => {
    if (isAuthenticated) {
      const ids = [];
      for (const record of learningRecords) {
        if (record.resource?.sourceId != null) {
          ids.push(record.resource.sourceId);
        } else if (record.resource?._id != null) {
          ids.push(record.resource._id);
        }
      }
      return normalizeBookmarkIds(ids);
    }
    return normalizeBookmarkIds(offlineIds);
  }, [isAuthenticated, learningRecords, offlineIds]);

  /**
   * Check if a course is bookmarked/saved in the user's library.
   */
  const isBookmarked = useCallback(
    (courseId) => {
      if (courseId == null || courseId === '') return false;

      if (isAuthenticated) {
        return learningRecords.some(
          (record) =>
            matchesBookmarkId(record.resource?.sourceId, courseId) ||
            matchesBookmarkId(record.resource?._id, courseId)
        );
      }

      return normalizeBookmarkIds(offlineIds).some((id) =>
        matchesBookmarkId(id, courseId)
      );
    },
    [isAuthenticated, learningRecords, offlineIds]
  );

  /**
   * Toggles bookmark / personal learning library entry.
   *
   * Rules:
   * - Unauthenticated: shows authentication prompt (does not silently corrupt backend).
   * - Authenticated: uses backend API as source of truth.
   */
  const toggleBookmark = useCallback(
    async (courseId) => {
      if (courseId == null || courseId === '') return { success: false };

      if (!isAuthenticated || !token) {
        setAuthPrompt({
          isOpen: true,
          message:
            'Please sign in or create an account to save courses to your personal learning library and track your progress.',
        });
        return { success: false, requiresAuth: true };
      }

      const existingRecord = learningRecords.find(
        (record) =>
          matchesBookmarkId(record.resource?.sourceId, courseId) ||
          matchesBookmarkId(record.resource?._id, courseId)
      );

      if (existingRecord) {
        // Remove from library
        try {
          await learningService.deleteLearningRecord(existingRecord._id, { token });
          setLearningRecords((prev) =>
            prev.filter((record) => record._id !== existingRecord._id)
          );
          return { success: true, action: 'removed' };
        } catch (err) {
          console.error('Failed to remove course from learning library:', err);
          setError(err.message || 'Failed to remove course. Please try again.');
          return { success: false, error: err.message };
        }
      } else {
        // Add to library
        try {
          const result = await learningService.addLearningRecord(courseId, { token });
          if (result.record) {
            setLearningRecords((prev) => {
              const alreadyPresent = prev.some((r) => r._id === result.record._id);
              if (alreadyPresent) return prev;
              return [result.record, ...prev];
            });
          }
          return { success: true, action: 'added' };
        } catch (err) {
          console.error('Failed to add course to learning library:', err);
          setError(err.message || 'Failed to add course. Please try again.');
          return { success: false, error: err.message };
        }
      }
    },
    [isAuthenticated, token, learningRecords]
  );

  /**
   * Updates progress and/or status for a learning record.
   */
  const updateProgress = useCallback(
    async (recordId, { progress, status }) => {
      if (!token) throw new Error('Authentication required.');

      try {
        const updatedRecord = await learningService.updateLearningProgress(
          recordId,
          { progress, status },
          { token }
        );

        setLearningRecords((prev) =>
          prev.map((rec) => (rec._id === recordId ? updatedRecord : rec))
        );

        return updatedRecord;
      } catch (err) {
        console.error('Failed to update learning progress:', err);
        throw err;
      }
    },
    [token]
  );

  /**
   * Transitions a record from NOT_STARTED to IN_PROGRESS.
   */
  const startLearning = useCallback(
    async (recordId) => {
      return updateProgress(recordId, { status: 'IN_PROGRESS' });
    },
    [updateProgress]
  );

  /**
   * Transitions a record to COMPLETED (progress 100%).
   */
  const completeLearning = useCallback(
    async (recordId) => {
      return updateProgress(recordId, { status: 'COMPLETED', progress: 100 });
    },
    [updateProgress]
  );

  /**
   * Removes a record from the learning library by record ID.
   */
  const removeRecord = useCallback(
    async (recordId) => {
      if (!token) throw new Error('Authentication required.');

      try {
        await learningService.deleteLearningRecord(recordId, { token });
        setLearningRecords((prev) => prev.filter((r) => r._id !== recordId));
        return true;
      } catch (err) {
        console.error('Failed to remove learning record:', err);
        throw err;
      }
    },
    [token]
  );

  /**
   * Count of unmigrated offline bookmarks from localStorage that aren't yet in MongoDB.
   */
  const unmigratedOfflineIds = useMemo(() => {
    if (!isAuthenticated) return offlineIds;
    const normalizedOffline = normalizeBookmarkIds(offlineIds);
    return normalizedOffline.filter(
      (offId) =>
        !learningRecords.some(
          (rec) =>
            matchesBookmarkId(rec.resource?.sourceId, offId) ||
            matchesBookmarkId(rec.resource?._id, offId)
        )
    );
  }, [isAuthenticated, offlineIds, learningRecords]);

  /**
   * Deliberate, idempotent migration of localStorage bookmarks to MongoDB.
   *
   * Only successfully synced IDs are removed from localStorage, preserving
   * any failing items safely against data loss.
   */
  const migrateOfflineBookmarks = useCallback(async () => {
    if (!isAuthenticated || !token || unmigratedOfflineIds.length === 0) return;

    setIsMigrating(true);
    setMigrationStatus(null);

    const successfullyMigrated = [];

    for (const id of unmigratedOfflineIds) {
      try {
        const result = await learningService.addLearningRecord(id, { token });
        successfullyMigrated.push(id);
        if (result.record) {
          setLearningRecords((prev) => {
            if (prev.some((r) => r._id === result.record._id)) return prev;
            return [result.record, ...prev];
          });
        }
      } catch (err) {
        console.warn(`[BookmarksMigration] Failed to migrate bookmark ${id}:`, err);
      }
    }

    // Safely prune only migrated items from localStorage
    setOfflineIds((prev) => {
      const remaining = normalizeBookmarkIds(prev).filter(
        (id) => !successfullyMigrated.some((migrated) => matchesBookmarkId(migrated, id))
      );
      writeStoredOfflineIds(remaining);
      return remaining;
    });

    setIsMigrating(false);
    setMigrationStatus({
      migratedCount: successfullyMigrated.length,
      remainingCount: unmigratedOfflineIds.length - successfullyMigrated.length,
    });
  }, [isAuthenticated, token, unmigratedOfflineIds]);

  const dismissAuthPrompt = useCallback(() => {
    setAuthPrompt({ isOpen: false, message: '' });
  }, []);

  const clearMigrationStatus = useCallback(() => {
    setMigrationStatus(null);
  }, []);

  // Backward-compatible stub for legacy synchronous callers
  const getBookmarkedCourses = useCallback(() => [], []);

  const value = {
    // Phase 5 Personal Learning State
    learningRecords,
    isLoading: isAuthLoading || isLoading,
    error,
    refreshLearning,
    updateProgress,
    startLearning,
    completeLearning,
    removeRecord,

    // Backward-compatible Bookmarks API
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
    getBookmarkedCourses,

    // Offline migration & Auth prompt state
    unmigratedCount: unmigratedOfflineIds.length,
    isMigrating,
    migrationStatus,
    migrateOfflineBookmarks,
    clearMigrationStatus,
    authPrompt,
    dismissAuthPrompt,
  };

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
};

// Convenient alias for components adopting Phase 5 Personal Learning naming
export const useLearning = useBookmarks;
