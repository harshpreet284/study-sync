import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { goalService } from '../services/goalService';
import { planService } from '../services/planService';
import GoalCard from '../components/GoalCard';
import GoalModal from '../components/GoalModal';
import GoalDeleteModal from '../components/GoalDeleteModal';
import PlanModal from '../components/PlanModal';

/**
 * Learning Goals page (Phase 6).
 *
 * For authenticated users: provides full CRUD management for personal study goals,
 * weekly hours tracking, skill targets, and status management (ACTIVE, COMPLETED, ARCHIVED).
 *
 * For unauthenticated users: shows an informative sign-in prompt matching StudySync aesthetic.
 */
const Goals = () => {
  const { isAuthenticated, user } = useAuth();

  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete modal state
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Status updating state map: { [goalId]: boolean }
  const [updatingStatusIds, setUpdatingStatusIds] = useState({});

  // Plan states (Phase 7 Groq Study Planner)
  const [plansByGoalId, setPlansByGoalId] = useState({});
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [activePlanGoal, setActivePlanGoal] = useState(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [isPlanGenerating, setIsPlanGenerating] = useState(false);
  const [planError, setPlanError] = useState(null);
  const activePlanFetchControllerRef = useRef(null);
  const activeGenerateControllerRef = useRef(null);

  // In-app feedback alert toast: { message: string, type: 'success' | 'error' } | null
  const [feedback, setFeedback] = useState(null);
  const feedbackTimerRef = useRef(null);

  const showFeedback = (message, type = 'success') => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback({ message, type });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Track active fetch controller for cancellation on unmount, logout, or retry
  const activeFetchControllerRef = useRef(null);

  // Fetch goals with explicit cancellation support and plan discovery
  const fetchGoals = useCallback(async (signal) => {
    if (!isAuthenticated) {
      setGoals([]);
      setPlansByGoalId({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { goals: fetchedGoals } = await goalService.getGoals({ signal });
      if (signal?.aborted) return;
      setGoals(fetchedGoals);

      // Concurrently query study plans for the retrieved goals
      if (fetchedGoals.length > 0) {
        Promise.allSettled(
          fetchedGoals.map((g) => planService.getPlanByGoalId(g._id, { signal }))
        ).then((results) => {
          if (signal?.aborted) return;
          const plansMap = {};
          results.forEach((res, idx) => {
            if (res.status === 'fulfilled') {
              plansMap[fetchedGoals[idx]._id] = res.value;
            }
          });
          setPlansByGoalId((prev) => ({ ...prev, ...plansMap }));
        });
      }
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) return;
      setError(err.message || 'Failed to load your learning goals.');
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Synchronize goals on auth changes with stale-request protection and account isolation
  useEffect(() => {
    if (!isAuthenticated) {
      if (activeFetchControllerRef.current) {
        activeFetchControllerRef.current.abort();
        activeFetchControllerRef.current = null;
      }
      if (activePlanFetchControllerRef.current) {
        activePlanFetchControllerRef.current.abort();
        activePlanFetchControllerRef.current = null;
      }
      if (activeGenerateControllerRef.current) {
        activeGenerateControllerRef.current.abort();
        activeGenerateControllerRef.current = null;
      }
      setGoals([]);
      setPlansByGoalId({});
      setIsModalOpen(false);
      setSelectedGoal(null);
      setGoalToDelete(null);
      setDeleteError(null);
      setIsPlanModalOpen(false);
      setActivePlanGoal(null);
      setIsPlanGenerating(false);
      setPlanError(null);
      return;
    }

    if (activeFetchControllerRef.current) {
      activeFetchControllerRef.current.abort();
    }
    if (activePlanFetchControllerRef.current) {
      activePlanFetchControllerRef.current.abort();
      activePlanFetchControllerRef.current = null;
    }
    if (activeGenerateControllerRef.current) {
      activeGenerateControllerRef.current.abort();
      activeGenerateControllerRef.current = null;
    }
    setPlansByGoalId({});
    setIsPlanModalOpen(false);
    setActivePlanGoal(null);
    setIsPlanGenerating(false);
    setPlanError(null);

    const controller = new AbortController();
    activeFetchControllerRef.current = controller;
    fetchGoals(controller.signal);

    return () => {
      controller.abort();
      if (activeFetchControllerRef.current === controller) {
        activeFetchControllerRef.current = null;
      }
      if (activePlanFetchControllerRef.current) {
        activePlanFetchControllerRef.current.abort();
        activePlanFetchControllerRef.current = null;
      }
      if (activeGenerateControllerRef.current) {
        activeGenerateControllerRef.current.abort();
        activeGenerateControllerRef.current = null;
      }
    };
  }, [fetchGoals, isAuthenticated, user?._id]);

  // Manual retry with cancellation-safe controller
  const handleRetry = () => {
    if (activeFetchControllerRef.current) {
      activeFetchControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeFetchControllerRef.current = controller;
    fetchGoals(controller.signal);
  };

  // Computed counts & metrics
  const totalCount = goals.length;
  const activeCount = useMemo(
    () => goals.filter((g) => g.status === 'ACTIVE').length,
    [goals]
  );
  const completedCount = useMemo(
    () => goals.filter((g) => g.status === 'COMPLETED').length,
    [goals]
  );
  const archivedCount = useMemo(
    () => goals.filter((g) => g.status === 'ARCHIVED').length,
    [goals]
  );
  const weeklyHoursCommitment = useMemo(
    () =>
      goals
        .filter((g) => g.status === 'ACTIVE')
        .reduce((sum, g) => sum + (Number(g.weeklyHours) || 0), 0),
    [goals]
  );

  // Filtered goals for the active tab
  const displayedGoals = useMemo(() => {
    if (activeTab === 'ALL') return goals;
    return goals.filter((g) => g.status === activeTab);
  }, [goals, activeTab]);

  // Modal Open Handlers
  const handleOpenCreate = () => {
    setSelectedGoal(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setSelectedGoal(goal);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setSelectedGoal(null);
    setModalError(null);
  };

  const handleCloseDelete = () => {
    if (isDeleting) return;
    setGoalToDelete(null);
    setDeleteError(null);
  };

  // Submit Handler for Create & Edit
  const handleSubmitGoal = async (payload) => {
    setIsSubmitting(true);
    setModalError(null);

    try {
      if (selectedGoal) {
        // Edit existing goal
        const { goal: updated } = await goalService.updateGoal(selectedGoal._id, payload);
        setGoals((prev) =>
          prev.map((g) => (g._id === updated._id ? updated : g))
        );
        showFeedback('Goal updated successfully.', 'success');
      } else {
        // Create new goal
        const { goal: created } = await goalService.createGoal(payload);
        setGoals((prev) => [created, ...prev]);
        showFeedback('New learning goal created!', 'success');
      }
      setIsModalOpen(false);
      setSelectedGoal(null);
    } catch (err) {
      setModalError(err.message || 'Failed to save goal. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Toggle Handler
  const handleStatusChange = async (goalId, newStatus) => {
    setUpdatingStatusIds((prev) => ({ ...prev, [goalId]: true }));
    try {
      const { goal: updated } = await goalService.updateGoal(goalId, { status: newStatus });
      setGoals((prev) =>
        prev.map((g) => (g._id === updated._id ? updated : g))
      );
      showFeedback(`Goal status updated to ${newStatus.toLowerCase()}.`, 'success');
    } catch (err) {
      showFeedback(err.message || 'Failed to update goal status.', 'error');
    } finally {
      setUpdatingStatusIds((prev) => ({ ...prev, [goalId]: false }));
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!goalToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await goalService.deleteGoal(goalToDelete._id);
      setGoals((prev) => prev.filter((g) => g._id !== goalToDelete._id));
      setPlansByGoalId((prev) => {
        const next = { ...prev };
        delete next[goalToDelete._id];
        return next;
      });
      if (activePlanGoal?._id === goalToDelete._id) {
        setIsPlanModalOpen(false);
        setActivePlanGoal(null);
      }
      showFeedback('Goal deleted successfully.', 'success');
      setGoalToDelete(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete goal. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // AI Study Plan Handlers (Phase 7 Groq AI)
  // ---------------------------------------------------------------------------
  const handleOpenPlan = async (goal) => {
    setActivePlanGoal(goal);
    setPlanError(null);
    setIsPlanModalOpen(true);

    // If plan for this goal hasn't been fetched yet, retrieve it
    if (plansByGoalId[goal._id] === undefined) {
      if (activePlanFetchControllerRef.current) {
        activePlanFetchControllerRef.current.abort();
      }
      const controller = new AbortController();
      activePlanFetchControllerRef.current = controller;
      setIsPlanLoading(true);

      try {
        const plan = await planService.getPlanByGoalId(goal._id, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setPlansByGoalId((prev) => ({ ...prev, [goal._id]: plan }));
      } catch (err) {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        setPlanError(err);
      } finally {
        if (!controller.signal.aborted) {
          setIsPlanLoading(false);
          if (activePlanFetchControllerRef.current === controller) {
            activePlanFetchControllerRef.current = null;
          }
        }
      }
    }
  };

  const handleGeneratePlan = async (goal) => {
    if (!goal?._id || isPlanGenerating) return;

    if (activeGenerateControllerRef.current) {
      activeGenerateControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeGenerateControllerRef.current = controller;

    setIsPlanGenerating(true);
    setPlanError(null);

    const activeUserId = user?._id;

    try {
      const result = await planService.generatePlan(goal._id, { signal: controller.signal });
      if (controller.signal.aborted || user?._id !== activeUserId) return;

      const newPlan = result.plan || result;
      setPlansByGoalId((prev) => ({ ...prev, [goal._id]: newPlan }));
      showFeedback('Study plan generated successfully!', 'success');
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted || user?._id !== activeUserId) return;
      setPlanError(err);
    } finally {
      if (!controller.signal.aborted && user?._id === activeUserId) {
        setIsPlanGenerating(false);
        if (activeGenerateControllerRef.current === controller) {
          activeGenerateControllerRef.current = null;
        }
      }
    }
  };

  const handleRegeneratePlan = async (goal) => {
    if (!goal?._id || isPlanGenerating) return;

    if (activeGenerateControllerRef.current) {
      activeGenerateControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeGenerateControllerRef.current = controller;

    setIsPlanGenerating(true);
    setPlanError(null);

    const activeUserId = user?._id;

    try {
      const result = await planService.generatePlan(goal._id, { signal: controller.signal });
      if (controller.signal.aborted || user?._id !== activeUserId) return;

      const newPlan = result.plan || result;
      setPlansByGoalId((prev) => ({ ...prev, [goal._id]: newPlan }));
      showFeedback('Study plan regenerated successfully!', 'success');
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted || user?._id !== activeUserId) return;
      setPlanError(err);
    } finally {
      if (!controller.signal.aborted && user?._id === activeUserId) {
        setIsPlanGenerating(false);
        if (activeGenerateControllerRef.current === controller) {
          activeGenerateControllerRef.current = null;
        }
      }
    }
  };

  const handleClosePlanModal = () => {
    if (isPlanGenerating) return; // Prevent closing while generation is in flight
    if (activePlanFetchControllerRef.current) {
      activePlanFetchControllerRef.current.abort();
      activePlanFetchControllerRef.current = null;
    }
    setIsPlanModalOpen(false);
    setActivePlanGoal(null);
    setPlanError(null);
  };

  // ---------------------------------------------------------------------------
  // Unauthenticated View
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex-grow flex flex-col items-center bg-background p-4 sm:p-8">
        <div className="max-w-[1000px] w-full mt-6 mb-12">
          <div className="text-center md:text-left mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              Personal Learning Goals
            </h1>
            <p className="text-gray text-lg">
              Define your ambitions, focus on target skills, and establish sustainable weekly study habits.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              Sign In to Set Your Learning Goals
            </h2>
            <p className="text-gray text-base sm:text-lg mb-8 max-w-lg leading-relaxed">
              Track your skill development, establish target study hours each week, set target completion dates, and prepare for AI-assisted study plans tailored to your personal goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/login"
                className="px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-link transition-transform duration-200 hover:scale-105 active:scale-95 text-center"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-8 py-3 bg-white text-primary border-2 border-primary font-bold rounded-lg hover:bg-primary/5 transition-transform duration-200 hover:scale-105 active:scale-95 text-center"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Authenticated Dashboard View
  // ---------------------------------------------------------------------------
  return (
    <div className="flex-grow flex flex-col items-center bg-background p-4 sm:p-8">
      <div className="max-w-[1000px] w-full mt-4 mb-16">
        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between animate-fadeIn shadow-sm border ${
              feedback.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'error' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className="font-semibold text-sm">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className={`p-1 rounded ${
                feedback.type === 'error'
                  ? 'text-red-600 hover:text-red-800'
                  : 'text-emerald-600 hover:text-emerald-800'
              }`}
              aria-label="Dismiss message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header Strip with Title & "New Goal" Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              Learning Goals
            </h1>
            <p className="text-gray text-base sm:text-lg">
              Set target skills, schedule study hours, and monitor your personal learning milestones.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="self-start sm:self-auto px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg shadow hover:bg-link transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Goal
          </button>
        </div>

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray uppercase tracking-wider">Total Goals</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-text">{totalCount}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Active</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary">{activeCount}</span>
              <span className="text-xs text-gray font-medium">in progress</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{completedCount}</span>
              <span className="text-xs text-gray font-medium">achieved</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-dark-gray uppercase tracking-wider">Weekly Hours</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-dark-gray">{weeklyHoursCommitment}</span>
              <span className="text-xs text-gray font-medium">hrs/wk total</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Goals', count: totalCount },
            { id: 'ACTIVE', label: 'Active', count: activeCount },
            { id: 'COMPLETED', label: 'Completed', count: completedCount },
            { id: 'ARCHIVED', label: 'Archived', count: archivedCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray hover:text-dark-gray hover:bg-light-gray/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-dark-gray'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="text-primary font-bold hover:underline ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-full bg-gray-100 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
                <div className="flex gap-2 pt-2">
                  <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
                  <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State: Zero Goals Created Yet */}
        {!isLoading && !error && goals.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">No learning goals set yet</h3>
            <p className="text-gray text-sm sm:text-base max-w-md mb-6 leading-relaxed">
              Setting learning goals with designated target skills and weekly study hours helps you stay focused and achieve mastery faster.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-6 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg shadow hover:bg-link transition-transform duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Set Your First Goal
            </button>
          </div>
        )}

        {/* Empty State: Filter Tab Has No Results */}
        {!isLoading && !error && goals.length > 0 && displayedGoals.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center flex flex-col items-center">
            <p className="text-dark-gray font-semibold mb-2">
              No {activeTab.toLowerCase()} goals found.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className="text-primary font-semibold text-sm hover:underline"
            >
              View all goals ({totalCount})
            </button>
          </div>
        )}

        {/* Goals Grid */}
        {!isLoading && displayedGoals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onEdit={handleOpenEdit}
                onDelete={(g) => {
                  setGoalToDelete(g);
                  setDeleteError(null);
                }}
                onStatusChange={handleStatusChange}
                isUpdatingStatus={Boolean(updatingStatusIds[goal._id])}
                hasPlan={Boolean(plansByGoalId[goal._id])}
                onOpenPlan={handleOpenPlan}
              />
            ))}
          </div>
        )}
      </div>

      {/* Goal Modal (Create / Edit) */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitGoal}
        initialGoal={selectedGoal}
        isSubmitting={isSubmitting}
        serverError={modalError}
      />

      {/* Goal Delete Confirmation Modal */}
      <GoalDeleteModal
        isOpen={Boolean(goalToDelete)}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        goalTitle={goalToDelete?.title || ''}
        isDeleting={isDeleting}
        deleteError={deleteError}
      />

      {/* AI Study Planner Modal (Phase 7 Groq Study Planner) */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={handleClosePlanModal}
        goal={activePlanGoal}
        plan={activePlanGoal ? plansByGoalId[activePlanGoal._id] || null : null}
        isLoading={isPlanLoading}
        isGenerating={isPlanGenerating}
        error={planError}
        onGenerate={handleGeneratePlan}
        onRegenerate={handleRegeneratePlan}
        onRetry={() => {
          if (activePlanGoal) {
            handleGeneratePlan(activePlanGoal);
          }
        }}
      />
    </div>
  );
};

export default Goals;
