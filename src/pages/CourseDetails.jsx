import { useParams } from 'react-router-dom';

const CourseDetails = () => {
  const { id } = useParams();

  return (
    <div className="flex-grow flex items-center justify-center p-8 text-center bg-background">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-4">Course Details</h1>
        <p className="text-gray text-lg">Viewing details for Course ID: {id}</p>
      </div>
    </div>
  );
};

export default CourseDetails;
