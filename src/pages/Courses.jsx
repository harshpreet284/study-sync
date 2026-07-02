import { courses } from '../data/courses';
import CourseCard from '../components/CourseCard';

const Courses = () => {
  return (
    <div className="flex-grow flex flex-col items-center bg-background p-4 sm:p-8">
      <div className="max-w-[1280px] w-full mt-4 mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 text-center md:text-left">Our Courses</h1>
        <p className="text-gray text-lg text-center md:text-left mb-8">
          Browse our wide selection of courses designed to advance your career.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Courses;
