import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const BookmarksContext = createContext();

import {
  normalizeBookmarkIds,
  matchesBookmarkId,
} from '../services/resourceService';

export { normalizeBookmarkIds, matchesBookmarkId };

export const BookmarksProvider = ({ children }) => {
  const [storedIds, setStoredIds] = useLocalStorage('studysync-bookmarks', []);

  // Sanitize and deduplicate on read to handle legacy or duplicate stored data
  const bookmarkedIds = useMemo(() => normalizeBookmarkIds(storedIds), [storedIds]);

  const toggleBookmark = useCallback(
    (courseId) => {
      if (courseId == null || courseId === '') return;

      setStoredIds((prevIds) => {
        const normalizedPrev = normalizeBookmarkIds(prevIds);
        const exists = normalizedPrev.some((id) => matchesBookmarkId(id, courseId));

        if (exists) {
          return normalizedPrev.filter((id) => !matchesBookmarkId(id, courseId));
        } else {
          // Store as number if numeric string, else preserve string
          const toAdd =
            typeof courseId === 'number'
              ? courseId
              : /^\d+$/.test(String(courseId).trim())
                ? Number(courseId)
                : String(courseId).trim();
          return [...normalizedPrev, toAdd];
        }
      });
    },
    [setStoredIds]
  );

  const isBookmarked = useCallback(
    (courseId) => {
      if (courseId == null || courseId === '') return false;
      return bookmarkedIds.some((id) => matchesBookmarkId(id, courseId));
    },
    [bookmarkedIds]
  );

  // Backward-compatible stub for any legacy synchronous callers
  const getBookmarkedCourses = useCallback(() => {
    return [];
  }, []);

  return (
    <BookmarksContext.Provider
      value={{
        bookmarkedIds,
        toggleBookmark,
        isBookmarked,
        getBookmarkedCourses,
      }}
    >
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
