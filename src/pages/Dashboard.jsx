import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';

/**
 * Format date string into a friendly localized date.
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
 * Dashboard skeleton loader displayed during initial or refresh loads.
 */
const DashboardSkeleton = () => {
  return (
    <div className="animate-pulse space-y-6" data-testid="dashboard-skeleton">
      {/* Welcome header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-gray-200 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Next step banner skeleton */}
      <div className="h-32 bg-gray-200 rounded-2xl"></div>

      {/* Metrics 4-card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main 2-column layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6"></div>
          <div className="h-72 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6"></div>
        </div>
        <div className="space-y-6">
          <div className="h-60 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6"></div>
          <div className="h-48 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Phase 8 Central Learning Dashboard.
 *
 * Consumes real backend metrics from GET /api/dashboard for:
 * - Active Learning Goal
 * - Overall Learning Progress
 * - Current In-Progress Resource
 * - Current Study Plan & Active Week
 * - Deterministic Next-Step Recommendation
 * - Personal Learning Library Summary
 */
const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  // Track active fetch controller for clean aborts
  const fetchControllerRef = useRef(null);

  useEffect(() => {
    // If not authenticated or no user ID, clear state and stop loading
    if (!isAuthenticated || !user?._id) {
      setDashboardData(null);
      setIsLoading(false);
      return;
    }

    // Abort any existing in-flight request
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }

    const controller = new AbortController();
    fetchControllerRef.current = controller;
    let isCancelled = false;

    const fetchDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await dashboardService.getDashboardData(controller.signal);
        if (!isCancelled) {
          setDashboardData(data);
        }
      } catch (err) {
        if (err.name === 'AbortError' || controller.signal.aborted) {
          // Normal cancellation, do nothing
          return;
        }
        if (!isCancelled) {
          setError(err.message || 'Failed to load dashboard data. Please try again.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [user?._id, isAuthenticated, retryKey]);

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1);
  };

  // Helper to determine next-step icon and styling theme
  const getNextStepTheme = (type) => {
    switch (type) {
      case 'CREATE_GOAL':
        return {
          bgGradient: 'from-indigo-600 via-indigo-700 to-purple-800',
          badgeText: 'Goal Planning',
          badgeBg: 'bg-white/20 text-white',
          buttonClass: 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-md',
        };
      case 'GENERATE_PLAN':
        return {
          bgGradient: 'from-blue-600 via-indigo-600 to-indigo-800',
          badgeText: 'AI Study Plan Ready',
          badgeBg: 'bg-white/20 text-white',
          buttonClass: 'bg-white text-blue-700 hover:bg-blue-50 shadow-md',
        };
      case 'RESUME_PLAN_RESOURCE':
      case 'RESUME_LIBRARY_RESOURCE':
        return {
          bgGradient: 'from-primary via-indigo-600 to-link',
          badgeText: 'Continue Learning',
          badgeBg: 'bg-white/20 text-white',
          buttonClass: 'bg-white text-primary hover:bg-indigo-50 shadow-md',
        };
      case 'START_PLAN_RESOURCE':
        return {
          bgGradient: 'from-emerald-600 via-teal-600 to-indigo-700',
          badgeText: 'New Milestone',
          badgeBg: 'bg-white/20 text-white',
          buttonClass: 'bg-white text-emerald-700 hover:bg-emerald-50 shadow-md',
        };
      case 'REVIEW_PLAN':
        return {
          bgGradient: 'from-amber-600 via-orange-600 to-indigo-700',
          badgeText: 'Action Needed',
          badgeBg: 'bg-white/20 text-white',
          buttonClass: 'bg-white text-amber-700 hover:bg-amber-50 shadow-md',
        };
      case 'PLAN_COMPLETED':
        return {
          bgGradient: 'from-emerald-600 via-green-600 to-teal-700',
          badgeText: 'Milestone Completed',
          badgeBg: 'bg-white/20 text-white',
          buttonClass: 'bg-white text-emerald-700 hover:bg-emerald-50 shadow-md',
        };
      default:
        return {
          bgGradient: 'from-primary to-link',
          badgeText: 'Recommended',
          badgeBg: 'bg-white/20 text-white',
          buttonClass: 'bg-white text-primary hover:bg-indigo-50 shadow-md',
        };
    }
  };

  return (
    <div className="min-h-[85vh] bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1100px] mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                Welcome back, {user?.name || 'Learner'}! 👋
              </h1>
            </div>
            <p className="text-gray-600 mt-1.5 text-sm sm:text-base">
              Track your weekly targets, manage catalog courses, and follow your structured path.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/goals"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-light-gray hover:bg-gray-200 text-text transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Goals
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary hover:bg-link text-white transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Browse Catalog
            </Link>
          </div>
        </div>

        {/* Error Alert with In-App Retry */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm" role="alert">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <DashboardSkeleton />}

        {/* Dashboard Content */}
        {!isLoading && !error && dashboardData && (
          <div className="space-y-8 animate-fadeIn">
            {/* 1. Next Step Recommendation Banner */}
            {dashboardData.nextStep && (() => {
              const theme = getNextStepTheme(dashboardData.nextStep.type);
              const destination = dashboardData.nextStep.actionUrl || '/goals';

              return (
                <div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${theme.bgGradient} p-6 sm:p-8 text-white shadow-lg`}
                  data-testid="next-step-banner"
                >
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-white/20">
                        <span>⭐</span>
                        <span>{theme.badgeText}</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {dashboardData.nextStep.title}
                      </h2>
                      <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                        {dashboardData.nextStep.description}
                      </p>
                    </div>

                    <Link
                      to={destination}
                      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0 ${theme.buttonClass}`}
                      data-testid="next-step-action"
                    >
                      <span>{dashboardData.nextStep.actionText || 'Continue'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })()}

            {/* 2. Metrics 4-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Overall Progress Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Overall Progress</span>
                    <span className="text-primary font-bold text-xs">Library Mean</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-text">
                      {dashboardData.overallProgress?.percentage ?? 0}%
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, dashboardData.overallProgress?.percentage ?? 0))}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 block">
                    Across {dashboardData.overallProgress?.total ?? 0} total courses
                  </span>
                </div>
              </div>

              {/* In Progress Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-text">
                      {dashboardData.learningSummary?.inProgress ?? 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">courses active</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Currently studying</span>
                  <Link to="/bookmarks" className="text-link font-semibold hover:underline">
                    View
                  </Link>
                </div>
              </div>

              {/* Completed Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-text">
                      {dashboardData.learningSummary?.completed ?? 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">finished</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Mastered skills</span>
                  <Link to="/bookmarks" className="text-link font-semibold hover:underline">
                    View
                  </Link>
                </div>
              </div>

              {/* Saved / Library Total Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Saved Courses</span>
                    <span className="text-xs font-semibold text-gray-400">Total</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-text">
                      {dashboardData.learningSummary?.saved ?? 0}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">in queue</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Total in library: {dashboardData.learningSummary?.total ?? 0}</span>
                  <Link to="/bookmarks" className="text-link font-semibold hover:underline">
                    Manage
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. Main 2-Column Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column (2 Cols): Current Learning & Study Plan */}
              <div className="lg:col-span-2 space-y-6">
                {/* A. Current In-Progress Resource Card */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                      <h3 className="text-lg font-bold text-text">Current Learning</h3>
                    </div>
                    {dashboardData.currentResource && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-primary border border-indigo-200">
                        {dashboardData.currentResource.category || 'Course'}
                      </span>
                    )}
                  </div>

                  {dashboardData.currentResource ? (
                    <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between bg-gray-50/70 p-5 rounded-xl border border-gray-200/60">
                      <div className="space-y-2 flex-grow">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-500">{dashboardData.currentResource.platform || 'StudySync'}</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">
                            {dashboardData.currentResource.difficulty || 'Intermediate'}
                          </span>
                          {dashboardData.currentResource.estimatedDuration && (
                            <>
                              <span>•</span>
                              <span className="text-gray-500">{dashboardData.currentResource.estimatedDuration} hrs</span>
                            </>
                          )}
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-text">
                          {dashboardData.currentResource.title}
                        </h4>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1 max-w-md">
                          <div className="flex justify-between text-xs font-semibold text-gray-600">
                            <span>Progress</span>
                            <span className="text-primary font-bold">{dashboardData.currentResource.progress ?? 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, dashboardData.currentResource.progress ?? 0))}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/course/${dashboardData.currentResource._id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-link text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex-shrink-0"
                      >
                        <span>Continue</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-gray-700">No Course Currently in Progress</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Pick up a course from your study plan below or discover courses in the catalog.
                      </p>
                      <Link
                        to="/courses"
                        className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-primary hover:text-link transition-colors"
                      >
                        <span>Explore Courses</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>

                {/* B. Current Study Plan & Active Week Card */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-text">Study Plan & Active Week</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Structured weekly roadmap generated for your primary goal.
                      </p>
                    </div>
                    {dashboardData.currentPlan && (
                      <div className="flex items-center gap-2">
                        {dashboardData.currentPlan.isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Plan Completed
                          </span>
                        ) : dashboardData.currentPlan.hasResources ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-primary border border-indigo-200">
                            Week {dashboardData.currentPlan.activeWeekNumber || 1} of {dashboardData.currentPlan.totalWeeks}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            0 Resources Assigned
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {dashboardData.currentPlan ? (
                    <div className="space-y-5">
                      {/* Genuinely Completed Plan State */}
                      {dashboardData.currentPlan.isCompleted && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-900 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-emerald-800">
                            <span className="text-lg">🎉</span>
                            <span>All Plan Resources Completed!</span>
                          </div>
                          <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed">
                            Congratulations! You have completed all catalog courses across every week of this study plan.
                            You can review your learning goal or set a new one.
                          </p>
                          <div className="pt-2">
                            <Link
                              to="/goals"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                            >
                              <span>Manage Goals & Plans</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Zero-Resource Plan State */}
                      {!dashboardData.currentPlan.hasResources && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-amber-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>No Catalog Resources Assigned to Plan</span>
                          </div>
                          <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                            This plan was generated with 0 catalog course resources for your current skill selections.
                            Review your target skills or regenerate your plan from the Goals page to match available catalog courses.
                          </p>
                          <div className="pt-2">
                            <Link
                              to="/goals"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              <span>Review Plan in Goals</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Active Week Details (When plan has resources and is not completed) */}
                      {!dashboardData.currentPlan.isCompleted && dashboardData.currentPlan.activeWeek && (
                        <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200/60 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                Active Week {dashboardData.currentPlan.activeWeek.weekNumber}
                              </span>
                              <h4 className="text-base font-bold text-text mt-0.5">
                                {dashboardData.currentPlan.activeWeek.focus || 'Weekly Curriculum'}
                              </h4>
                            </div>
                          </div>

                          {/* Tasks list */}
                          {dashboardData.currentPlan.activeWeek.tasks && dashboardData.currentPlan.activeWeek.tasks.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Key Milestones</span>
                              <ul className="space-y-1.5 text-xs text-gray-700">
                                {dashboardData.currentPlan.activeWeek.tasks.map((task, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-primary font-bold mt-0.5">•</span>
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Week Resources */}
                          {dashboardData.currentPlan.activeWeek.resources && dashboardData.currentPlan.activeWeek.resources.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-gray-200/60">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Week Courses ({dashboardData.currentPlan.activeWeek.resources.length})
                              </span>
                              <div className="space-y-2">
                                {dashboardData.currentPlan.activeWeek.resources.map((res) => {
                                  const isCompleted = res.status === 'COMPLETED';
                                  const isInProgress = res.status === 'IN_PROGRESS';

                                  return (
                                    <div
                                      key={res._id}
                                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200/70 hover:border-primary/40 transition-colors gap-3"
                                    >
                                      <div className="space-y-1 min-w-0 flex-grow">
                                        <div className="flex items-center gap-2">
                                          <h5 className="text-xs sm:text-sm font-semibold text-text truncate">
                                            {res.title}
                                          </h5>
                                          {isCompleted && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                                              Completed
                                            </span>
                                          )}
                                          {isInProgress && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-primary border border-indigo-200 flex-shrink-0">
                                              {res.progress || 0}%
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                          <span>{res.platform || 'StudySync'}</span>
                                          {res.estimatedDuration && (
                                            <>
                                              <span>•</span>
                                              <span>{res.estimatedDuration} hrs</span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <Link
                                        to={`/course/${res._id}`}
                                        className="text-xs font-bold text-primary hover:text-link px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors flex-shrink-0"
                                      >
                                        {isCompleted ? 'Review' : isInProgress ? 'Resume' : 'Start'}
                                      </Link>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No Plan Generated Yet */
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-gray-700">No Study Plan Generated</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        {dashboardData.activeGoal
                          ? 'Generate a personalized multi-week curriculum tailored to your active goal.'
                          : 'Set a learning goal first to receive an AI-curated study plan.'}
                      </p>
                      <Link
                        to="/goals"
                        className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-primary hover:text-link transition-colors"
                      >
                        <span>{dashboardData.activeGoal ? 'Generate Study Plan' : 'Go to Goals'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (1 Col): Active Goal & Library Breakdown */}
              <div className="space-y-6">
                {/* A. Active Learning Goal Card */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-text">Active Goal</h3>
                    <Link to="/goals" className="text-xs font-semibold text-link hover:underline">
                      Manage
                    </Link>
                  </div>

                  {dashboardData.activeGoal ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">In Progress</span>
                        </div>
                        <h4 className="text-base font-bold text-text mt-1">
                          {dashboardData.activeGoal.title}
                        </h4>
                        {dashboardData.activeGoal.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {dashboardData.activeGoal.description}
                          </p>
                        )}
                      </div>

                      {/* Goal Meta Pills */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                          {dashboardData.activeGoal.currentLevel || 'Beginner'}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                          {dashboardData.activeGoal.weeklyHours || 5} hrs / week
                        </span>
                        {dashboardData.activeGoal.targetDate && (
                          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                            Due {formatDate(dashboardData.activeGoal.targetDate)}
                          </span>
                        )}
                      </div>

                      {/* Target Skills */}
                      {dashboardData.activeGoal.targetSkills && dashboardData.activeGoal.targetSkills.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-gray-100">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Skills</span>
                          <div className="flex flex-wrap gap-1.5">
                            {dashboardData.activeGoal.targetSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 px-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-xs text-gray-500">
                        No active learning goal yet. Define your target skills to receive recommendations.
                      </p>
                      <Link
                        to="/goals"
                        className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:text-link"
                      >
                        <span>Create Goal</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>

                {/* B. Personal Learning Quick Summary */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-text">Library Breakdown</h3>
                    <Link to="/bookmarks" className="text-xs font-semibold text-link hover:underline">
                      My Learning
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="font-semibold text-gray-700">In Progress</span>
                      </div>
                      <span className="font-bold text-text">{dashboardData.learningSummary?.inProgress ?? 0}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-semibold text-gray-700">Completed</span>
                      </div>
                      <span className="font-bold text-text">{dashboardData.learningSummary?.completed ?? 0}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        <span className="font-semibold text-gray-700">Saved / Queue</span>
                      </div>
                      <span className="font-bold text-text">{dashboardData.learningSummary?.saved ?? 0}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/bookmarks"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-light-gray hover:bg-gray-200 text-text text-xs font-bold rounded-lg transition-colors"
                    >
                      <span>Open Learning Library</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
