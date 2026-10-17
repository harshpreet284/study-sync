import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBookmarks } from '../context/BookmarksContext';
import CourseCard from '../components/CourseCard';
import CourseSkeleton from '../components/CourseSkeleton';
import { resourceService } from '../services/resourceService';

const Bookmarks = () => {
  const { bookmarkedIds, isBookmarked } = useBookmarks();
  const [bookmarkedCourses, setBookmarkedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(() => bookmarkedIds.length > 0);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (bookmarkedIds.length === 0) {
      setBookmarkedCourses([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const loadBookmarks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const courses = await resourceService.getBookmarkedResources(bookmarkedIds, { signal });
        if (!signal.aborted) {
          setBookmarkedCourses(courses);
          setIsLoading(false);
        }
      } catch (err) {
        if (err.name === 'AbortError' || signal.aborted) {
          return;
        }
        console.error('Failed to load bookmarked courses:', err);
        setError(
          err.message || 'Failed to load your bookmarks. Please check your connection and try again.'
        );
        setIsLoading(false);
      }
    };

    loadBookmarks();

    return () => {
      controller.abort();
    };
  }, [bookmarkedIds, retryTrigger]);

  const handleRetry = () => {
    setRetryTrigger((prev) => prev + 1);
  };

  // Derive courses that remain bookmarked to support instant removal UI feedback
  const displayedCourses = bookmarkedCourses.filter((course) => isBookmarked(course.id));

  return (
    <div className="flex-grow flex flex-col items-center bg-background p-4 sm:p-8">
      <div className="max-w-[1280px] w-full mt-4 mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 text-center md:text-left">Your Bookmarks</h1>
        <p className="text-gray text-lg text-center md:text-left mb-8">
          Access your saved courses quickly.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <CourseSkeleton key={n} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg border border-red-200 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-red-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-text mb-2">Unable to Load Bookmarks</h2>
            <p className="text-gray text-base max-w-[500px] mb-6">
              {error}
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded transition-transform duration-200 hover:bg-link hover:scale-105 active:scale-95 shadow-md"
            >
              Try Again
            </button>
          </div>
        ) : displayedCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-lg border border-gray-200 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-20 w-20 text-gray-300 mb-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h2 className="text-2xl font-bold text-text mb-3">No bookmarks yet</h2>
            <p className="text-gray text-lg max-w-[500px] mb-8">
              You haven't saved any courses to your bookmarks. Browse our course catalog and click the bookmark icon on any course to save it here for later.
            </p>
            <Link
              to="/courses"
              className="px-8 py-3 bg-primary text-white font-bold rounded transition-transform duration-200 hover:bg-link hover:scale-105 active:scale-95 shadow-md"
            >
              Explore Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
