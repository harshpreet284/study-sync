import { useState, useMemo } from 'react';
import { courses } from '../data/courses';
import CourseCard from '../components/CourseCard';
import { useDebounce } from '../hooks/useDebounce';

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [durationFilter, setDurationFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const uniqueCategories = new Set(courses.map(c => c.category));
    return ['All', ...Array.from(uniqueCategories).sort()];
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
    setDifficultyFilter('All');
    setDurationFilter('All');
    setRatingFilter('All');
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Search logic
      if (debouncedSearchTerm) {
        const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
        const matchTitle = course.title.toLowerCase().includes(lowerCaseSearch);
        const matchInstructor = course.instructor.toLowerCase().includes(lowerCaseSearch);
        const matchCategory = course.category.toLowerCase().includes(lowerCaseSearch);
        
        if (!matchTitle && !matchInstructor && !matchCategory) return false;
      }

      // Category logic
      if (categoryFilter !== 'All' && course.category !== categoryFilter) return false;

      // Difficulty logic
      if (difficultyFilter !== 'All' && course.level !== difficultyFilter) return false;

      // Rating logic
      if (ratingFilter !== 'All') {
        const minRating = parseFloat(ratingFilter);
        if (course.rating < minRating) return false;
      }

      // Duration logic (parsing "XX hours")
      if (durationFilter !== 'All') {
        const hours = parseInt(course.duration);
        if (durationFilter === 'Short') {
          if (hours >= 20) return false;
        } else if (durationFilter === 'Medium') {
          if (hours < 20 || hours > 40) return false;
        } else if (durationFilter === 'Long') {
          if (hours <= 40) return false;
        }
      }

      return true;
    });
  }, [debouncedSearchTerm, categoryFilter, difficultyFilter, durationFilter, ratingFilter]);

  return (
    <div className="flex-grow flex flex-col items-center bg-background p-4 sm:p-8">
      <div className="max-w-[1280px] w-full mt-4 mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 text-center md:text-left">Our Courses</h1>
        <p className="text-gray text-lg text-center md:text-left mb-6">
          Browse our wide selection of courses designed to advance your career.
        </p>

        {/* Search Bar */}
        <div className="mb-4 relative">
          <input 
            type="text" 
            placeholder="Search by title, instructor, or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-text"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-end bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-1 w-full sm:w-auto flex-grow">
            <label className="text-xs font-semibold text-gray uppercase tracking-wider">Category</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm w-full"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-auto flex-grow">
            <label className="text-xs font-semibold text-gray uppercase tracking-wider">Difficulty</label>
            <select 
              value={difficultyFilter} 
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm w-full"
            >
              <option value="All">All</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-auto flex-grow">
            <label className="text-xs font-semibold text-gray uppercase tracking-wider">Duration</label>
            <select 
              value={durationFilter} 
              onChange={(e) => setDurationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm w-full"
            >
              <option value="All">All</option>
              <option value="Short">Short (&lt; 20 hours)</option>
              <option value="Medium">Medium (20 - 40 hours)</option>
              <option value="Long">Long (&gt; 40 hours)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-auto flex-grow">
            <label className="text-xs font-semibold text-gray uppercase tracking-wider">Min Rating</label>
            <select 
              value={ratingFilter} 
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary text-sm w-full"
            >
              <option value="All">All</option>
              <option value="4.5">4.5 &amp; up</option>
              <option value="4.7">4.7 &amp; up</option>
              <option value="4.9">4.9 &amp; up</option>
            </select>
          </div>

          <button 
            onClick={clearFilters}
            className="w-full sm:w-auto px-4 py-2 bg-light-gray text-dark-gray hover:bg-gray-200 border border-gray-300 rounded font-semibold text-sm transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>

        {/* Results count */}
        <div className="mb-6 text-dark-gray font-medium">
          Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-text mb-2">No courses found</h2>
            <p className="text-gray text-lg">We couldn't find any courses matching your criteria.<br/>Try adjusting your filters or search term.</p>
            <button 
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-primary text-white font-semibold rounded hover:bg-link transition-colors duration-200"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
