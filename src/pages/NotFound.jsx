import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex-grow flex items-center justify-center p-8 text-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold text-primary">404</h1>
        <p className="text-gray text-xl">Oops! Page not found.</p>
        <Link to="/" className="mt-4 bg-primary text-white py-2 px-6 rounded-md hover:bg-link transition-colors duration-200">
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
