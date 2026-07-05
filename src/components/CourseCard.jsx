import { Link } from 'react-router-dom';
import { useBookmarks } from '../context/BookmarksContext';

const CourseCard = ({ course }) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(course.id);

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-left relative group">
      <div className="h-48 w-full overflow-hidden relative">
        <img 
          src={course.thumbnail} 
          alt={course.title} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button 
          onClick={(e) => {
            e.preventDefault(); // Prevent accidental navigation if nested
            toggleBookmark(course.id);
          }}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200 z-10"
          title={bookmarked ? "Remove Bookmark" : "Bookmark Course"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 ${bookmarked ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            fill={bookmarked ? "currentColor" : "none"}
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold px-2 py-1 bg-light-gray text-primary rounded-full">
            {course.category}
          </span>
          <span className="text-xs font-medium text-gray">
            ⭐ {course.rating}
          </span>
        </div>
        <h3 className="text-xl font-bold text-text mb-2 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-gray mb-4 line-clamp-2 flex-grow">
          {course.description}
        </p>
        <div className="flex justify-between items-center text-sm text-dark-gray mb-4">
          <span>{course.level}</span>
          <span>{course.duration}</span>
        </div>
        <Link 
          to={`/course/${course.id}`} 
          className="mt-auto block text-center w-full bg-primary text-white py-2 rounded hover:bg-link transition-colors duration-200"
        >
          View Course
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
