import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden text-left">
      <div className="h-48 w-full overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={course.title} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
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
