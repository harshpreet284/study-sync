import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { courses } from '../data/courses';

const BookmarksContext = createContext();

export const BookmarksProvider = ({ children }) => {
  const [bookmarkedIds, setBookmarkedIds] = useLocalStorage('studysync-bookmarks', []);

  const toggleBookmark = (courseId) => {
    setBookmarkedIds((prevIds) => {
      if (prevIds.includes(courseId)) {
        return prevIds.filter(id => id !== courseId);
      } else {
        return [...prevIds, courseId];
      }
    });
  };

  const isBookmarked = (courseId) => bookmarkedIds.includes(courseId);

  const getBookmarkedCourses = () => {
    return courses.filter(course => bookmarkedIds.includes(course.id));
  };

  return (
    <BookmarksContext.Provider value={{ bookmarkedIds, toggleBookmark, isBookmarked, getBookmarkedCourses }}>
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
