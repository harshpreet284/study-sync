import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protection wrapper for authenticated-only routes.
 * Redirects unauthenticated visitors to /login, preserving their
 * intended destination via router location state.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-light-gray border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-gray font-medium">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
