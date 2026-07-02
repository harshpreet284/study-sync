import { useParams, Navigate, Link } from 'react-router-dom';
import { courses } from '../data/courses';

const CourseDetails = () => {
  const { id } = useParams();
  const course = courses.find((c) => c.id === parseInt(id));

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <div className="flex-grow bg-light-gray py-8 px-4 sm:px-8">
      <div className="max-w-[1000px] mx-auto bg-white rounded-xl shadow overflow-hidden text-left">
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

          <div className="mt-4 flex gap-4">
            <button className="bg-primary text-white font-bold py-3 px-8 rounded hover:bg-link transition-colors duration-200">
              Enroll Now
            </button>
            <Link to="/courses" className="bg-white text-gray border border-gray-300 font-bold py-3 px-8 rounded hover:bg-light-gray transition-colors duration-200 flex items-center justify-center">
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
