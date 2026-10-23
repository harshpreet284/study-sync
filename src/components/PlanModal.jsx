import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * PlanModal component for Phase 7 AI Study Planner.
 *
 * Capabilities:
 * - Displays an informative preview state when no study plan exists yet.
 * - Shows an engaging, accessible loading state during Groq AI generation/regeneration.
 * - Renders sequential weekly milestones, weekly focus, catalog resources, and actionable tasks.
 * - Supports safe catalog navigation (/course/:id) and verified external links.
 * - Requires explicit confirmation before regenerating an existing plan.
 * - Provides full accessibility (dialog semantics, focus trap, Escape dismissal, opener focus restoration).
 * - Implements local session task checklist with clear non-persistence indication.
 */
const PlanModal = ({
  isOpen,
  onClose,
  goal,
  plan,
  isLoading = false,
  isGenerating = false,
  error = null,
  onGenerate,
  onRegenerate,
  onRetry,
}) => {
  const modalRef = useRef(null);
  const openerRef = useRef(null);
  const initialFocusRef = useRef(null);

  // Regeneration confirmation state
  const [isConfirmingRegenerate, setIsConfirmingRegenerate] = useState(false);

  // Local interactive checklist session state (explicitly non-persistent)
  const [completedTasks, setCompletedTasks] = useState({});

  // Capture opener element on open, autofocus first interactive element, and restore on close
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement;
      setIsConfirmingRegenerate(false);
      const timer = setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 50);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    } else {
      setIsConfirmingRegenerate(false);
      if (openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus();
        openerRef.current = null;
      }
    }
  }, [isOpen]);

  // Handle Escape key and focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isConfirmingRegenerate) {
          e.preventDefault();
          setIsConfirmingRegenerate(false);
          return;
        }

        if (!isGenerating && !isLoading) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }, [isOpen, isGenerating, isLoading, isConfirmingRegenerate, onClose]);

  if (!isOpen) return null;

  // Toggle local session checkbox state
  const handleToggleTask = (taskKey) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskKey]: !prev[taskKey],
    }));
  };

  // Safe external URL validator (http or https only)
  const isSafeExternalUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim().toLowerCase();
    return trimmed.startsWith('https://') || trimmed.startsWith('http://');
  };

  // Format timestamp safely
  const formatGeneratedDate = (dateString) => {
    if (!dateString) return 'Recently';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Human-friendly error message extraction
  const getErrorMessage = () => {
    if (!error) return null;
    if (typeof error === 'string') return error;

    if (error.status === 400) {
      return (
        error.message ||
        'Insufficient catalog resources match this goal’s target skills. Try updating the skills or exploring courses in the catalog.'
      );
    }
    if (error.status === 429) {
      return 'Rate limit reached (5 generations per 15 minutes). Please wait a few minutes before trying again.';
    }
    if (error.status === 502) {
      return 'The AI study planner is temporarily unavailable. Please try again in a few moments.';
    }
    if (error.status === 504) {
      return 'The study plan generation request timed out after 15 seconds. Please try again.';
    }
    return error.message || 'Unable to generate study plan. Please try again.';
  };

  const errorMessage = getErrorMessage();

  return (
    <div
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating && !isLoading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-3xl w-full my-8 max-h-[90vh] flex flex-col transform transition-all overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary/5 via-indigo-50/50 to-purple-50/40 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="plan-modal-title" className="text-lg sm:text-xl font-bold text-text truncate">
                {goal ? `Study Plan: ${goal.title}` : 'AI Study Planner'}
              </h2>
              <p className="text-xs text-gray truncate">
                {plan?.generatedAt
                  ? `Generated ${formatGeneratedDate(plan.generatedAt)}`
                  : 'Personalized AI-powered weekly curriculum'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Regenerate Action (Only shown when plan exists, not while generating/confirming) */}
            {plan && !isGenerating && !isLoading && !isConfirmingRegenerate && (
              <button
                type="button"
                onClick={() => setIsConfirmingRegenerate(true)}
                className="px-3 py-1.5 text-xs font-semibold text-primary hover:text-white hover:bg-primary border border-primary/30 rounded-lg transition-colors flex items-center gap-1.5"
                title="Regenerate this study plan"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            )}

            {/* Close Button */}
            <button
              ref={initialFocusRef}
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="p-1.5 text-gray hover:text-dark-gray hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Close study plan modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {/* In-App Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold">{errorMessage}</p>
                  <p className="text-xs text-red-700 mt-1">
                    {error?.status === 400
                      ? 'Ensure your goal skills align with available courses in the catalog.'
                      : error?.status === 429
                      ? 'Rate limits reset automatically after 15 minutes.'
                      : 'You can retry generation when ready.'}
                  </p>
                </div>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isGenerating}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 font-semibold text-xs rounded-lg transition-colors flex-shrink-0"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Regeneration Confirmation Card */}
          {isConfirmingRegenerate && (
            <div className="p-5 bg-amber-50 border border-amber-300 rounded-2xl animate-fadeIn space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-base">
                    Regenerate Study Plan?
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                    Regenerating will replace your existing study plan with a brand new weekly curriculum customized to your goal. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingRegenerate(false)}
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-semibold text-dark-gray hover:bg-amber-100/60 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmingRegenerate(false);
                    onRegenerate(goal);
                  }}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg shadow hover:bg-link transition-colors flex items-center gap-1.5"
                >
                  Confirm & Regenerate
                </button>
              </div>
            </div>
          )}

          {/* State 1: Generation In-Progress Loading Screen */}
          {isGenerating && (
            <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-5 animate-fadeIn">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-bold text-text">
                  Creating Your AI Study Plan...
                </h3>
                <p className="text-sm text-gray leading-relaxed">
                  Analyzing target skills, selecting vetted catalog courses, and synthesizing a weekly curriculum with clear tasks.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-full animate-pulse">
                <span>Please wait • Connecting to Groq AI</span>
              </div>
            </div>
          )}

          {/* State 2: Existing Plan Fetching Spinner */}
          {!isGenerating && isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-10 h-10 border-3 border-gray-300 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm text-gray font-medium">Loading your study plan...</p>
            </div>
          )}

          {/* State 3: Informative Empty State (No Plan Generated Yet) */}
          {!isGenerating && !isLoading && !plan && (
            <div className="py-8 sm:py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/10 via-indigo-100 to-purple-100 text-primary flex items-center justify-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>

              <div className="max-w-lg space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-text">
                  No Study Plan Generated Yet
                </h3>
                <p className="text-sm text-gray leading-relaxed">
                  Turn your learning goal into a structured, step-by-step roadmap. Our AI will match catalog resources with your target skills and generate realistic weekly tasks.
                </p>
              </div>

              {/* Goal Metadata Summary Card */}
              {goal && (
                <div className="w-full max-w-lg bg-light-gray/40 border border-gray-200 rounded-xl p-4 text-left space-y-3">
                  <div className="text-xs font-bold text-gray uppercase tracking-wider">
                    Goal Parameters
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray block">Skill Level</span>
                      <strong className="text-text font-semibold capitalize">
                        {goal.currentLevel?.toLowerCase() || 'Beginner'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray block">Weekly Commitment</span>
                      <strong className="text-text font-semibold">
                        {goal.weeklyHours || 5} hrs/week
                      </strong>
                    </div>
                  </div>
                  {goal.targetSkills?.length > 0 && (
                    <div>
                      <span className="text-gray text-xs block mb-1.5">Target Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {goal.targetSkills.map((skill, idx) => (
                          <span
                            key={`${skill}-${idx}`}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-white text-text border border-gray-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onGenerate(goal)}
                disabled={isGenerating}
                className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-lg hover:bg-link transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Study Plan
              </button>
            </div>
          )}

          {/* State 4: Active Study Plan Display */}
          {!isGenerating && !isLoading && plan && (
            <div className="space-y-6 animate-fadeIn">
              {/* Plan Metadata Summary Banner */}
              <div className="bg-gradient-to-r from-primary/5 to-purple-50 p-4 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray uppercase tracking-wider">
                      Curriculum Duration
                    </div>
                    <div className="text-sm sm:text-base font-bold text-text">
                      {plan.weeks?.length || 0} {plan.weeks?.length === 1 ? 'Week' : 'Weeks'}
                      <span className="text-xs font-normal text-gray ml-2">
                        ({goal?.weeklyHours || 5} hrs/week target)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-gray">
                  <div>Checklist is for your current session</div>
                  <div className="text-primary font-medium">Interactive session progress</div>
                </div>
              </div>

              {/* Ordered Weekly Plan List */}
              <div className="space-y-6">
                {Array.isArray(plan.weeks) &&
                  plan.weeks.map((week) => (
                    <div
                      key={week.weekNumber || week._id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-indigo-200 transition-colors"
                    >
                      {/* Week Header */}
                      <div className="bg-light-gray/40 px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-primary text-white tracking-wide uppercase">
                            Week {week.weekNumber}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-text">
                            {week.focus}
                          </h4>
                        </div>
                      </div>

                      <div className="p-5 space-y-5">
                        {/* Catalog Resources Section */}
                        {Array.isArray(week.resources) && week.resources.length > 0 && (
                          <div>
                            <div className="text-xs font-bold text-gray uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              Catalog Resources ({week.resources.length})
                            </div>

                            <div className="grid grid-cols-1 gap-2.5">
                              {week.resources.map((res) => {
                                const resourceId = res._id || res.id;
                                const isInternalCourse = Boolean(resourceId);
                                const hasSafeExternalUrl = isSafeExternalUrl(res.url);

                                return (
                                  <div
                                    key={resourceId || res.title}
                                    className="p-3.5 bg-gray-50/70 hover:bg-indigo-50/30 rounded-xl border border-gray-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                  >
                                    <div className="min-w-0 flex-grow">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-primary uppercase tracking-wide">
                                          {res.type || 'Course'}
                                        </span>
                                        {res.difficulty && (
                                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white text-dark-gray border border-gray-200 capitalize">
                                            {res.difficulty.toLowerCase()}
                                          </span>
                                        )}
                                        {res.estimatedDuration && (
                                          <span className="text-[11px] font-medium text-gray">
                                            ~{res.estimatedDuration} hrs
                                          </span>
                                        )}
                                        {res.platform && (
                                          <span className="text-[11px] font-medium text-gray">
                                            • {res.platform}
                                          </span>
                                        )}
                                      </div>

                                      <h5 className="text-sm font-semibold text-text truncate">
                                        {res.title}
                                      </h5>

                                      {Array.isArray(res.skills) && res.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                          {res.skills.slice(0, 3).map((s, idx) => (
                                            <span
                                              key={`${s}-${idx}`}
                                              className="text-[10px] px-1.5 py-0.2 rounded bg-white text-gray border border-gray-200"
                                            >
                                              {s}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Links */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {/* Internal catalog route navigation */}
                                      {isInternalCourse && (
                                        <Link
                                          to={`/course/${resourceId}`}
                                          className="px-3 py-1.5 bg-primary text-white hover:bg-link font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                                        >
                                          <span>View Course</span>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        </Link>
                                      )}

                                      {/* Verified external resource URL fallback */}
                                      {hasSafeExternalUrl && (
                                        <a
                                          href={res.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 text-gray hover:text-primary hover:bg-white rounded-lg border border-gray-200 transition-colors"
                                          title={`Open ${res.platform || 'external resource'} in new tab`}
                                          aria-label={`Open external link for ${res.title}`}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Weekly Actionable Tasks Section */}
                        {Array.isArray(week.tasks) && week.tasks.length > 0 && (
                          <div>
                            <div className="text-xs font-bold text-gray uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Action Items ({week.tasks.length})
                              </span>
                            </div>

                            <ul className="space-y-2">
                              {week.tasks.map((task, tIdx) => {
                                const taskKey = `w${week.weekNumber}-t${tIdx}`;
                                const isChecked = Boolean(completedTasks[taskKey]);

                                return (
                                  <li
                                    key={taskKey}
                                    onClick={() => handleToggleTask(taskKey)}
                                    className={`p-2.5 rounded-lg border text-xs sm:text-sm flex items-start gap-3 cursor-pointer select-none transition-colors ${
                                      isChecked
                                        ? 'bg-emerald-50/60 border-emerald-200 text-dark-gray'
                                        : 'bg-white border-gray-200 text-text hover:bg-gray-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleTask(taskKey)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 border-gray-300 cursor-pointer"
                                      aria-label={`Task: ${task}`}
                                    />
                                    <span className={isChecked ? 'line-through text-gray' : ''}>
                                      {task}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Bar */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-gray">
            {plan ? (
              <span>Plan synchronized with your learning goal</span>
            ) : (
              <span>AI Study Planner ready</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2 bg-white text-dark-gray hover:bg-gray-100 font-semibold text-xs sm:text-sm rounded-lg border border-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanModal;
