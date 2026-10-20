import { Link } from 'react-router-dom';

/**
 * Modal prompt displayed when an unauthenticated user attempts to perform
 * a personal learning action (such as bookmarking/saving a course).
 */
const AuthPromptModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-left border border-gray-100 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 id="auth-prompt-title" className="text-xl font-bold text-text">
              Sign In Required
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray text-base leading-relaxed mb-6">
          {message || 'Please sign in or create an account to save courses to your personal learning library and track your study progress.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <Link
            to="/login"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-link rounded-lg text-center transition-colors shadow-sm order-1 sm:order-2"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg text-center transition-colors order-3"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;
