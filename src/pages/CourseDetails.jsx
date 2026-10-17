import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBookmarks } from '../context/BookmarksContext';
import CourseCard from '../components/CourseCard';
import { resourceService } from '../services/resourceService';

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    const { signal } = controller;

    const loadCourse = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedCourse = await resourceService.getResourceById(id, { signal });
        if (signal.aborted) return;

        setCourse(fetchedCourse);

        // Fetch recommended courses within the same category
        if (fetchedCourse && fetchedCourse.category) {
          try {
            const { courses: catCourses } = await resourceService.getResources(
              { category: fetchedCourse.category },
              { signal }
            );
            if (!signal.aborted) {
              const recs = catCourses
                .filter((c) => String(c.id) !== String(fetchedCourse.id))
                .slice(0, 4);
              setRecommendedCourses(recs);
            }
          } catch (recErr) {
            // Ignore abort errors on secondary request
            if (recErr.name !== 'AbortError' && !signal.aborted) {
              console.warn('Failed to load recommended courses:', recErr);
              setRecommendedCourses([]);
            }
          }
        }

        if (!signal.aborted) {
          setIsLoading(false);
        }
      } catch (err) {
        // Treat intentional cancellation as cancellation, not as a user-facing failure
        if (err.name === 'AbortError' || signal.aborted) {
          return;
        }
        console.error('Failed to load course details:', err);
        if (err.status === 404) {
          setError('not_found');
        } else {
          setError(
            err.message || 'Failed to load course details. Please check your connection and try again.'
          );
        }
        setCourse(null);
        setIsLoading(false);
      }
    };

    loadCourse();

    return () => {
      controller.abort();
    };
  }, [id, retryTrigger]);

  const handleRetry = () => {
    setRetryTrigger((prev) => prev + 1);
  };

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="flex-grow bg-light-gray py-8 px-4 sm:px-8">
        <div className="max-w-[1000px] mx-auto bg-white rounded-xl shadow overflow-hidden animate-pulse mb-12">
          <div className="h-64 sm:h-80 w-full bg-gray-200"></div>
          <div className="p-6 sm:p-10 flex flex-col gap-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-28 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error & 404 states
  if (error || !course) {
    const isNotFound = error === 'not_found';
    return (
      <div className="flex-grow bg-light-gray py-16 px-4 sm:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center border border-gray-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-gray-400 mx-auto mb-4"
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
          <h2 className="text-2xl font-bold text-text mb-2">
            {isNotFound ? 'Course Not Found' : 'Unable to Load Course'}
          </h2>
          <p className="text-gray text-base mb-6">
            {isNotFound
              ? 'The course you are looking for does not exist or may have been removed.'
              : error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isNotFound && (
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded hover:bg-link transition-colors shadow"
              >
                Try Again
              </button>
            )}
            <Link
              to="/courses"
              className="px-6 py-2.5 bg-light-gray text-dark-gray border border-gray-300 font-semibold rounded hover:bg-gray-200 transition-colors"
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bookmarked = isBookmarked(course.id);

  return (
    <div className="flex-grow bg-light-gray py-8 px-4 sm:px-8">
      <div className="max-w-[1000px] mx-auto bg-white rounded-xl shadow overflow-hidden text-left relative mb-12">
        <div className="h-64 sm:h-80 w-full relative">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center p-8">
            <h1 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-md">
              {course.title}
            </h1>
          </div>
          <button
            onClick={() => toggleBookmark(course.id)}
            className="absolute top-6 right-6 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200 z-10"
            title={bookmarked ? 'Remove Bookmark' : 'Bookmark Course'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 ${bookmarked ? 'text-red-500 fill-current' : 'text-gray-400'}`}
              fill={bookmarked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        <div className="p-6 sm:p-10 flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-dark-gray border-b border-gray-200 pb-6">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{course.category}</span>
            <span>Level: <span className="font-bold">{course.level}</span></span>
            <span>Duration: <span className="font-bold">{course.duration}</span></span>
            <span>Rating: <span className="font-bold">⭐ {course.rating}</span></span>
            <span>Instructor: <span className="font-bold text-primary">{course.instructor}</span></span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-text mb-4">About this course</h2>
            <p className="text-gray text-base leading-relaxed">
              {course.description}
            </p>
          </div>

          {course.syllabus && course.syllabus.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-text mb-4">Syllabus</h2>
              <div className="flex flex-col gap-4">
                {course.syllabus.map((item, index) => (
                  <div key={index} className="bg-light-gray p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg text-primary mb-1">Week {item.week}: {item.title}</h3>
                    <p className="text-gray">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.tags && course.tags.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-text mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-200 text-dark-gray px-3 py-1 rounded-md text-sm border border-gray-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            {course.url ? (
              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white font-bold py-3 px-8 rounded transition-transform duration-200 hover:bg-link hover:scale-105 active:scale-95 shadow-md text-center inline-block"
              >
                Enroll Now
              </a>
            ) : (
              <button className="bg-primary text-white font-bold py-3 px-8 rounded transition-transform duration-200 hover:bg-link hover:scale-105 active:scale-95 shadow-md">
                Enroll Now
              </button>
            )}
            <Link to="/courses" className="bg-white text-gray border border-gray-300 font-bold py-3 px-8 rounded transition-transform duration-200 hover:bg-light-gray hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm">
              Back to Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended Courses Section */}
      {recommendedCourses.length > 0 && (
        <div className="max-w-[1280px] mx-auto pb-12">
          <h2 className="text-3xl font-bold text-primary mb-6 text-center md:text-left">
            Recommended Courses
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendedCourses.map((recCourse) => (
              <CourseCard key={recCourse.id} course={recCourse} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;
