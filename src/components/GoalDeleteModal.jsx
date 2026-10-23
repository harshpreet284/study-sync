import { useEffect, useRef } from 'react';

/**
 * Modal dialog for confirming deletion of a Learning Goal.
 */
const GoalDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  goalTitle,
  isDeleting = false,
  deleteError = null,
}) => {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const openerRef = useRef(null);

  // Capture opener element on open, autofocus cancel button, and restore focus on close
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement;
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (openerRef.current && typeof openerRef.current.focus === 'function') {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [isOpen]);

  // Handle Escape key and focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!isDeleting) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-goal-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6 transform transition-all">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 id="delete-goal-modal-title" className="text-lg font-bold text-text">
              Delete Learning Goal
            </h3>
            <p className="text-xs text-gray">This action cannot be undone</p>
          </div>
        </div>

        {/* Inline Deletion Error Banner */}
        {deleteError && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{deleteError}</span>
          </div>
        )}

        <p className="text-sm text-dark-gray mb-6 leading-relaxed">
          Are you sure you want to delete <strong className="text-text">"{goalTitle}"</strong>?
          All associated tracking data for this goal will be permanently removed.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 text-dark-gray text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow"
          >
            {isDeleting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            Delete Goal
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalDeleteModal;
