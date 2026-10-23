import { useState, useEffect, useRef } from 'react';

const VALID_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner — New to these topics' },
  { value: 'INTERMEDIATE', label: 'Intermediate — Working knowledge' },
  { value: 'ADVANCED', label: 'Advanced — Deepening expertise' },
];

const VALID_STATUSES = [
  { value: 'ACTIVE', label: 'Active — Currently working on this' },
  { value: 'COMPLETED', label: 'Completed — Goal achieved!' },
  { value: 'ARCHIVED', label: 'Archived — Paused or retired' },
];

/**
 * Modal dialog for creating or editing a Learning Goal.
 */
const GoalModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialGoal = null,
  isSubmitting = false,
  serverError = null,
}) => {
  const isEditing = Boolean(initialGoal);

  const modalRef = useRef(null);
  const titleInputRef = useRef(null);
  const openerRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetSkillsInput, setTargetSkillsInput] = useState('');
  const [currentLevel, setCurrentLevel] = useState('BEGINNER');
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [clientErrors, setClientErrors] = useState({});

  // Capture opener element on open, autofocus title input, and restore focus on close
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement;
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
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
        if (!isSubmitting) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (isOpen) {
      if (initialGoal) {
        setTitle(initialGoal.title || '');
        setDescription(initialGoal.description || '');
        setTargetSkillsInput(
          Array.isArray(initialGoal.targetSkills) ? initialGoal.targetSkills.join(', ') : ''
        );
        setCurrentLevel(initialGoal.currentLevel || 'BEGINNER');
        setWeeklyHours(initialGoal.weeklyHours ?? 5);
        if (initialGoal.targetDate) {
          // Format as YYYY-MM-DD for HTML date input
          const d = new Date(initialGoal.targetDate);
          if (!isNaN(d.getTime())) {
            setTargetDate(d.toISOString().slice(0, 10));
          } else {
            setTargetDate('');
          }
        } else {
          setTargetDate('');
        }
        setStatus(initialGoal.status || 'ACTIVE');
      } else {
        // Reset defaults for creation
        setTitle('');
        setDescription('');
        setTargetSkillsInput('');
        setCurrentLevel('BEGINNER');
        setWeeklyHours(5);
        setTargetDate('');
        setStatus('ACTIVE');
      }
      setClientErrors({});
    }
  }, [isOpen, initialGoal]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Goal title is required.';
    } else if (trimmedTitle.length > 200) {
      errors.title = 'Title cannot exceed 200 characters.';
    }

    if (description.trim().length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters.';
    }

    const hours = Number(weeklyHours);
    if (isNaN(hours) || hours < 1 || hours > 168) {
      errors.weeklyHours = 'Weekly hours must be between 1 and 168.';
    }

    if (targetDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(targetDate)) {
        errors.targetDate = 'Please select a valid date in YYYY-MM-DD format.';
      }
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Parse targetSkills from comma-separated string
    const skillsArray = targetSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      targetSkills: skillsArray,
      currentLevel,
      weeklyHours: Number(weeklyHours),
      targetDate: targetDate ? targetDate : null,
    };

    if (isEditing) {
      payload.status = status;
    }

    onSubmit(payload);
  };

  return (
    <div
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full my-8 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-light-gray/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 id="goal-modal-title" className="text-xl font-bold text-text">
              {isEditing ? 'Edit Learning Goal' : 'Create New Learning Goal'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray hover:text-dark-gray p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {/* Title Field */}
          <div>
            <label htmlFor="goal-title" className="block text-sm font-semibold text-text mb-1">
              Goal Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Full-Stack JavaScript & React"
              maxLength={200}
              disabled={isSubmitting}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                clientErrors.title ? 'border-red-400 bg-red-50/30' : 'border-gray-300 focus:border-primary'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              {clientErrors.title ? (
                <span className="text-xs text-red-500 font-medium">{clientErrors.title}</span>
              ) : (
                <span className="text-xs text-gray">Give your goal a clear, motivating name</span>
              )}
              <span className="text-xs text-gray">{title.length}/200</span>
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="goal-description" className="block text-sm font-semibold text-text mb-1">
              Description <span className="text-gray text-xs font-normal">(Optional)</span>
            </label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are your objectives, focus areas, or milestones for this goal?"
              rows={3}
              maxLength={2000}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-y"
            />
            <div className="flex justify-end mt-0.5">
              <span className="text-xs text-gray">{description.length}/2000</span>
            </div>
          </div>

          {/* Target Skills */}
          <div>
            <label htmlFor="goal-skills" className="block text-sm font-semibold text-text mb-1">
              Target Skills <span className="text-gray text-xs font-normal">(Comma-separated)</span>
            </label>
            <input
              id="goal-skills"
              type="text"
              value={targetSkillsInput}
              onChange={(e) => setTargetSkillsInput(e.target.value)}
              placeholder="e.g. JavaScript, React, Node.js, Express"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            <span className="text-xs text-gray block mt-1">
              Skills will be automatically trimmed and deduplicated
            </span>
          </div>

          {/* Grid: Level & Weekly Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-level" className="block text-sm font-semibold text-text mb-1">
                Current Level
              </label>
              <select
                id="goal-level"
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              >
                {VALID_LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="goal-hours" className="block text-sm font-semibold text-text mb-1">
                Weekly Study Hours
              </label>
              <input
                id="goal-hours"
                type="number"
                min={1}
                max={168}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(e.target.value)}
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  clientErrors.weeklyHours ? 'border-red-400 bg-red-50/30' : 'border-gray-300 focus:border-primary'
                }`}
              />
              {clientErrors.weeklyHours && (
                <span className="text-xs text-red-500 font-medium block mt-1">
                  {clientErrors.weeklyHours}
                </span>
              )}
            </div>
          </div>

          {/* Grid: Target Date & (if editing) Status */}
          <div className={`grid grid-cols-1 ${isEditing ? 'sm:grid-cols-2' : ''} gap-4`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="goal-target-date" className="block text-sm font-semibold text-text">
                  Target Completion Date
                </label>
                {targetDate && (
                  <button
                    type="button"
                    onClick={() => setTargetDate('')}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear date
                  </button>
                )}
              </div>
              <input
                id="goal-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  clientErrors.targetDate ? 'border-red-400 bg-red-50/30' : 'border-gray-300 focus:border-primary'
                }`}
              />
              {clientErrors.targetDate && (
                <span className="text-xs text-red-500 font-medium block mt-1">
                  {clientErrors.targetDate}
                </span>
              )}
            </div>

            {isEditing && (
              <div>
                <label htmlFor="goal-status" className="block text-sm font-semibold text-text mb-1">
                  Goal Status
                </label>
                <select
                  id="goal-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                >
                  {VALID_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.value}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 text-dark-gray font-semibold text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg shadow hover:bg-link transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              {isEditing ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
