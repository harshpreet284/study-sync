import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adaptResourceToCourse } from '../services/resourceService';

/**
 * Format a Date object or ISO string into a friendly localized date.
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

/**
 * LearningCard component for Phase 5 Personal Learning.
 *
 * Displays a saved course with its real progress, status badges, and
 * intuitive controls to start learning, update progress, mark complete,
 * or remove from library.
 */
const LearningCard = ({
  record,
  onUpdateProgress,
  onStart,
  onComplete,
  onRemove,
}) => {
  const course = adaptResourceToCourse(record.resource);

  const [sliderProgress, setSliderProgress] = useState(record.progress ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  // Synchronize local slider state if upstream record changes
  useEffect(() => {
    setSliderProgress(record.progress ?? 0);
  }, [record.progress]);

  if (!course) {
    return null;
  }

  const isCompleted = record.status === 'COMPLETED' || record.progress === 100;
  const isInProgress = record.status === 'IN_PROGRESS';
  const isNotStarted = record.status === 'NOT_STARTED';

  const hasUnsavedProgress = sliderProgress !== record.progress;

  const handleSaveProgress = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setCardError(null);

    try {
      if (sliderProgress >= 100) {
        await onComplete(record._id);
      } else if (sliderProgress > 0 && isNotStarted) {
        await onUpdateProgress(record._id, {
          progress: sliderProgress,
          status: 'IN_PROGRESS',
        });
      } else {
        await onUpdateProgress(record._id, { progress: sliderProgress });
      }
    } catch (err) {
      setCardError(err.message || 'Failed to update progress.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStart = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setCardError(null);

    try {
      await onStart(record._id);
    } catch (err) {
      setCardError(err.message || 'Failed to start course.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setCardError(null);

    try {
      await onComplete(record._id);
    } catch (err) {
      setCardError(err.message || 'Failed to mark as completed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setCardError(null);

    try {
      await onRemove(record._id);
    } catch (err) {
      setCardError(err.message || 'Failed to remove course.');
      setIsSaving(false);
      setIsConfirmingRemove(false);
    }
  };

  const adjustSlider = (delta) => {
    setSliderProgress((prev) => {
      const nextVal = Math.min(100, Math.max(0, prev + delta));
      return nextVal;
    });
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden text-left relative">
      {/* Top Banner Image with Status Badge */}
      <div className="h-44 w-full overflow-hidden relative bg-gray-100">
        <img
          src={course.thumbnail}
          alt={course.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completed
            </span>
          ) : isInProgress ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-white shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              In Progress
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800/80 text-white shadow-sm backdrop-blur-xs">
              Not Started
            </span>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="text-xs font-semibold px-2 py-1 bg-white/90 text-text rounded-md shadow-xs backdrop-blur-xs">
            {course.category}
          </span>
        </div>
      </div>

      {/* Course Details */}
      <div className="p-5 flex flex-col flex-grow">
        <Link
          to={`/course/${course.id}`}
          className="text-lg font-bold text-text hover:text-primary transition-colors line-clamp-2 mb-2"
          title={course.title}
        >
          {course.title}
        </Link>

        <div className="flex items-center justify-between text-xs text-gray mb-4">
          <span>By {course.instructor}</span>
          <span>{course.duration}</span>
        </div>

        {/* Progress Section */}
        <div className="bg-light-gray p-3.5 rounded-lg border border-gray-100 mb-4">
          <div className="flex justify-between items-center mb-1.5 text-xs font-medium">
            <span className="text-dark-gray font-semibold">Progress</span>
            <span className={isCompleted ? 'text-emerald-600 font-bold' : 'text-primary font-bold'}>
              {record.progress}%
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, record.progress))}%` }}
            ></div>
          </div>

          {/* Dates / Timestamps */}
          <div className="mt-2 text-[11px] text-gray flex justify-between">
            {record.completedAt ? (
              <span>Finished: {formatDate(record.completedAt)}</span>
            ) : record.startedAt ? (
              <span>Started: {formatDate(record.startedAt)}</span>
            ) : (
              <span>Ready to start</span>
            )}
            <span>{course.level}</span>
          </div>
        </div>

        {/* Card Error if action failed */}
        {cardError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {cardError}
          </div>
        )}

        {/* Interactive Progress Controls */}
        <div className="mt-auto flex flex-col gap-3">
          {/* Progress Slider (Only when In Progress or updating) */}
          {!isCompleted && (
            <div className="flex flex-col gap-1.5 bg-gray-50/70 p-2.5 rounded-lg border border-gray-200/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray font-medium">Update Progress:</span>
                <span className="font-bold text-primary">{sliderProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={sliderProgress}
                disabled={isSaving}
                onChange={(e) => setSliderProgress(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer disabled:opacity-50 h-1.5 bg-gray-200 rounded-lg appearance-none"
              />
              <div className="flex items-center justify-between gap-1 mt-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => adjustSlider(-10)}
                    disabled={isSaving || sliderProgress <= 0}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
                  >
                    -10%
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSlider(10)}
                    disabled={isSaving || sliderProgress >= 100}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
                  >
                    +10%
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSlider(25)}
                    disabled={isSaving || sliderProgress >= 100}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
                  >
                    +25%
                  </button>
                </div>
                {hasUnsavedProgress && (
                  <button
                    type="button"
                    onClick={handleSaveProgress}
                    disabled={isSaving}
                    className="px-3 py-1 text-xs font-bold bg-primary text-white rounded hover:bg-link transition-colors shadow-xs"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            {isNotStarted ? (
              <button
                type="button"
                onClick={handleStart}
                disabled={isSaving}
                className="flex-grow py-2 px-3 bg-primary text-white text-sm font-semibold rounded hover:bg-link transition-colors text-center disabled:opacity-50 shadow-xs"
              >
                {isSaving ? 'Starting...' : 'Start Learning'}
              </button>
            ) : isInProgress ? (
              <>
                <Link
                  to={`/course/${course.id}`}
                  className="flex-grow py-2 px-3 bg-primary text-white text-sm font-semibold rounded hover:bg-link transition-colors text-center shadow-xs"
                >
                  Continue Course
                </Link>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isSaving}
                  title="Mark 100% Completed"
                  className="py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-sm font-semibold rounded transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  Mark Complete
                </button>
              </>
            ) : (
              <>
                <Link
                  to={`/course/${course.id}`}
                  className="flex-grow py-2 px-3 bg-light-gray text-dark-gray border border-gray-300 text-sm font-semibold rounded hover:bg-gray-200 transition-colors text-center"
                >
                  Review Course
                </Link>
                <button
                  type="button"
                  onClick={() => onUpdateProgress(record._id, { status: 'IN_PROGRESS', progress: 50 })}
                  disabled={isSaving}
                  className="py-2 px-2.5 text-xs text-gray hover:text-primary transition-colors"
                  title="Reset to In Progress"
                >
                  Study Again
                </button>
              </>
            )}

            {/* Remove / Delete Button */}
            {isConfirmingRemove ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isSaving}
                  className="px-2 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  {isSaving ? '...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingRemove(false)}
                  disabled={isSaving}
                  className="px-2 py-2 text-xs font-semibold text-gray hover:text-gray-700 bg-gray-100 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingRemove(true)}
                disabled={isSaving}
                className="p-2 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                title="Remove from My Learning"
                aria-label="Remove from My Learning"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningCard;
