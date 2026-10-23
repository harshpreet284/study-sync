import { LearningGoal } from '../models/LearningGoal.js';
import { LearningPlan } from '../models/LearningPlan.js';
import { LearningProgress } from '../models/LearningProgress.js';

/**
 * Projected fields for resource objects included in dashboard responses.
 */
const RESOURCE_FIELDS = '_id title type platform thumbnail category difficulty estimatedDuration url';

/**
 * Safely extracts a string ID from a populated resource object, raw ObjectId, or string.
 * Returns null if input is null, undefined, or an invalid reference string.
 *
 * @param {*} res
 * @returns {string | null}
 */
export const extractResourceId = (res) => {
  if (!res) return null;
  if (typeof res === 'object' && res._id) {
    return res._id.toString();
  }
  const str = String(res).trim();
  if (!str || str === 'null' || str === 'undefined' || str === '[object Object]') {
    return null;
  }
  return str;
};

/**
 * Deterministically sorts progress records by updatedAt descending,
 * breaking ties using _id descending. Missing or invalid dates are treated as 0 (oldest).
 *
 * @param {Array<Object>} records
 * @returns {Array<Object>}
 */
export const sortRecordsByRecency = (records = []) => {
  return [...records].sort((a, b) => {
    const timeA = a && a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b && b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    const validTimeA = Number.isFinite(timeA) ? timeA : 0;
    const validTimeB = Number.isFinite(timeB) ? timeB : 0;

    if (validTimeB !== validTimeA) {
      return validTimeB - validTimeA;
    }

    // Stable tie-breaker: _id descending
    const idA = a && a._id ? a._id.toString() : '';
    const idB = b && b._id ? b._id.toString() : '';
    return idB.localeCompare(idA);
  });
};

/**
 * Calculates the rounded arithmetic mean of progress percentages across all
 * resources in the user's personal learning library, alongside breakdown counts.
 *
 * Missing, null, non-numeric, or negative progress values safely clamp to 0.
 * Excess progress values (>100) safely clamp to 100.
 *
 * @param {Array<Object>} progressRecords - All LearningProgress records for the user
 * @returns {{ percentage: number, total: number, saved: number, inProgress: number, completed: number }}
 */
export const calculateOverallProgress = (progressRecords = []) => {
  if (!Array.isArray(progressRecords) || progressRecords.length === 0) {
    return {
      percentage: 0,
      total: 0,
      saved: 0,
      inProgress: 0,
      completed: 0,
    };
  }

  const total = progressRecords.length;
  let sum = 0;
  let saved = 0;
  let inProgress = 0;
  let completed = 0;

  for (const record of progressRecords) {
    if (!record) {
      saved++;
      continue;
    }

    const rawProgress = record.progress;
    const num = typeof rawProgress === 'number' && Number.isFinite(rawProgress)
      ? rawProgress
      : 0;
    const clampedProgress = Math.max(0, Math.min(100, num));
    sum += clampedProgress;

    if (record.status === 'COMPLETED') {
      completed++;
    } else if (record.status === 'IN_PROGRESS') {
      inProgress++;
    } else {
      saved++;
    }
  }

  return {
    percentage: Math.round(sum / total),
    total,
    saved,
    inProgress,
    completed,
  };
};

/**
 * Resolves the active week for a learning plan based on resource completion.
 *
 * Approved Rules:
 * - Distinguishes plans with zero resources from plans whose resources have all been completed.
 * - If totalPlanResourcesCount === 0, returns { hasResources: false, isPlanCompleted: false, activeWeek: null }.
 * - Selects the earliest week containing at least one resource that is not completed.
 * - A missing progress record means the resource is not completed.
 * - A week with multiple resources remains active until all its resources are completed.
 * - Empty weeks (weeks with 0 resources) contain no incomplete resources to fulfill,
 *   so they cannot hold the active week; the earliest week containing an incomplete
 *   resource is selected.
 * - If all plan resources are completed (when totalPlanResourcesCount > 0),
 *   returns { hasResources: true, isPlanCompleted: true, activeWeek: null }.
 *
 * @param {Array<Object>} weeks - Array of plan week objects
 * @param {Map<string, Object>} progressMap - Map of resourceId -> LearningProgress
 * @returns {{ hasResources: boolean, totalPlanResourcesCount: number, isPlanCompleted: boolean, activeWeek: Object | null, activeWeekNumber: number | null }}
 */
export const resolveActiveWeek = (weeks = [], progressMap = new Map()) => {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return {
      hasResources: false,
      totalPlanResourcesCount: 0,
      isPlanCompleted: false,
      activeWeek: null,
      activeWeekNumber: null,
    };
  }

  let totalPlanResourcesCount = 0;
  let allPlanResourcesCompleted = true;
  let firstIncompleteWeek = null;

  for (const week of weeks) {
    const rawResources = Array.isArray(week.resources) ? week.resources : [];
    const validResources = rawResources.filter((r) => extractResourceId(r) !== null);
    totalPlanResourcesCount += validResources.length;

    let weekHasIncompleteResource = false;

    for (const res of validResources) {
      const resId = extractResourceId(res);
      const prog = resId ? progressMap.get(resId) : null;
      const isCompleted = Boolean(prog && prog.status === 'COMPLETED');

      if (!isCompleted) {
        weekHasIncompleteResource = true;
        allPlanResourcesCompleted = false;
      }
    }

    // A week with resources that has at least one incomplete resource is the earliest active week
    if (weekHasIncompleteResource && !firstIncompleteWeek) {
      firstIncompleteWeek = week;
    }
  }

  // Case 1: Plan contains ZERO catalog resources across all weeks
  if (totalPlanResourcesCount === 0) {
    return {
      hasResources: false,
      totalPlanResourcesCount: 0,
      isPlanCompleted: false,
      activeWeek: null,
      activeWeekNumber: null,
    };
  }

  // Case 2: Plan has resources and every single resource is completed
  if (allPlanResourcesCompleted) {
    return {
      hasResources: true,
      totalPlanResourcesCount,
      isPlanCompleted: true,
      activeWeek: null,
      activeWeekNumber: null,
    };
  }

  // Case 3: Plan has incomplete resources, firstIncompleteWeek is active
  return {
    hasResources: true,
    totalPlanResourcesCount,
    isPlanCompleted: false,
    activeWeek: firstIncompleteWeek,
    activeWeekNumber: firstIncompleteWeek ? firstIncompleteWeek.weekNumber : null,
  };
};

/**
 * Computes the deterministic next learning step following the approved priority hierarchy:
 *
 * Priority 1: No active goal -> recommend creating a learning goal.
 * Priority 2: Active goal but no study plan -> recommend generating a study plan.
 * Priority 3: An in-progress resource in the active plan -> recommend resuming the most
 *             recently updated such resource (tie-broken by _id descending).
 * Priority 4: Otherwise, recommend the earliest not-yet-completed resource in the earliest
 *             incomplete plan week.
 * Priority 5: If no plan resource needs attention, recommend resuming the most recently
 *             updated in-progress library resource outside the plan.
 * Priority 6: If all plan resources are completed (and no in-progress library resource exists),
 *             show a plan-completed state.
 * Fallback (Zero-resource plan): If a plan contains zero catalog resources and no library
 *             resource is in progress, recommend reviewing the plan rather than falsely
 *             congratulating plan completion.
 *
 * @param {Object} params
 * @param {Object | null} params.activeGoal
 * @param {Object | null} params.plan
 * @param {Array<Object>} params.progressRecords - User's LearningProgress records
 * @param {Map<string, Object>} params.progressMap - Map of resourceId -> LearningProgress
 * @param {Object} params.activeWeekResult - Result from resolveActiveWeek
 * @returns {Object} Deterministic next step recommendation
 */
export const determineNextStep = ({
  activeGoal,
  plan,
  progressRecords = [],
  progressMap = new Map(),
  activeWeekResult = { hasResources: false, isPlanCompleted: false, activeWeek: null },
}) => {
  // ---------------------------------------------------------------------------
  // Priority 1: No active goal
  // ---------------------------------------------------------------------------
  if (!activeGoal) {
    return {
      type: 'CREATE_GOAL',
      title: 'Set a Learning Goal',
      description: 'Define your target skills and weekly study hours to receive a structured roadmap.',
      actionText: 'Create Goal',
      actionUrl: '/goals',
      resourceId: null,
    };
  }

  // ---------------------------------------------------------------------------
  // Priority 2: Active goal exists, but no study plan has been generated
  // ---------------------------------------------------------------------------
  if (!plan) {
    return {
      type: 'GENERATE_PLAN',
      title: `Generate Study Plan for "${activeGoal.title}"`,
      description: 'Transform your learning goal into an AI-structured weekly curriculum with catalog resources.',
      actionText: 'Generate Plan',
      actionUrl: '/goals',
      resourceId: null,
    };
  }

  // Build a set of all valid resource IDs referenced anywhere in the active plan
  const planResourceIdSet = new Set();
  const planResourceMap = new Map();

  for (const week of plan.weeks || []) {
    for (const res of week.resources || []) {
      const idStr = extractResourceId(res);
      if (idStr) {
        planResourceIdSet.add(idStr);
        if (typeof res === 'object' && res !== null) {
          planResourceMap.set(idStr, res);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Priority 3: An in-progress resource in the active plan (most recently updated wins)
  // ---------------------------------------------------------------------------
  const inProgressPlanRecords = progressRecords.filter((rec) => {
    if (!rec || rec.status !== 'IN_PROGRESS' || !rec.resource) return false;
    const resId = extractResourceId(rec.resource);
    return resId && planResourceIdSet.has(resId);
  });

  if (inProgressPlanRecords.length > 0) {
    // Sort deterministically by updatedAt descending, _id descending
    const sortedPlanRecords = sortRecordsByRecency(inProgressPlanRecords);
    const bestRecord = sortedPlanRecords[0];
    const res = bestRecord.resource;
    const resId = extractResourceId(res);
    const title = (res && res.title) || 'Course';
    const progressVal = typeof bestRecord.progress === 'number' ? bestRecord.progress : 0;

    return {
      type: 'RESUME_PLAN_RESOURCE',
      title: `Resume: ${title}`,
      description: `You are ${progressVal}% through this course in your study plan.`,
      actionText: 'Continue Learning',
      actionUrl: `/course/${resId}`,
      resourceId: resId,
    };
  }

  // ---------------------------------------------------------------------------
  // Priority 4: Earliest not-yet-completed resource in earliest incomplete plan week
  // ---------------------------------------------------------------------------
  if (!activeWeekResult.isPlanCompleted && activeWeekResult.activeWeek) {
    const activeWeek = activeWeekResult.activeWeek;
    const weekResources = Array.isArray(activeWeek.resources) ? activeWeek.resources : [];

    const nextResource = weekResources.find((res) => {
      const resId = extractResourceId(res);
      if (!resId) return false;
      const prog = progressMap.get(resId);
      return !prog || prog.status !== 'COMPLETED';
    });

    if (nextResource) {
      const resId = extractResourceId(nextResource);
      const title = (nextResource && nextResource.title) || 'Course';
      const focus = activeWeek.focus ? ` (${activeWeek.focus})` : '';

      return {
        type: 'START_PLAN_RESOURCE',
        title: `Start: ${title}`,
        description: `Begin Week ${activeWeek.weekNumber}${focus} in your study plan.`,
        actionText: 'Start Learning',
        actionUrl: `/course/${resId}`,
        resourceId: resId,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Priority 5: If no plan resource needs attention, resume most recently updated
  // in-progress library resource outside the plan
  // ---------------------------------------------------------------------------
  const inProgressOutsidePlanRecords = progressRecords.filter((rec) => {
    if (!rec || rec.status !== 'IN_PROGRESS' || !rec.resource) return false;
    const resId = extractResourceId(rec.resource);
    return resId && !planResourceIdSet.has(resId);
  });

  if (inProgressOutsidePlanRecords.length > 0) {
    const sortedOutside = sortRecordsByRecency(inProgressOutsidePlanRecords);
    const bestRecord = sortedOutside[0];
    const res = bestRecord.resource;
    const resId = extractResourceId(res);
    const title = (res && res.title) || 'Course';
    const progressVal = typeof bestRecord.progress === 'number' ? bestRecord.progress : 0;

    return {
      type: 'RESUME_LIBRARY_RESOURCE',
      title: `Resume: ${title}`,
      description: `Continue learning outside your plan (${progressVal}% complete).`,
      actionText: 'Continue Learning',
      actionUrl: `/course/${resId}`,
      resourceId: resId,
    };
  }

  // ---------------------------------------------------------------------------
  // Fallback for Zero-Resource Plan: Plan has no catalog resources
  // ---------------------------------------------------------------------------
  if (!activeWeekResult.hasResources) {
    return {
      type: 'REVIEW_PLAN',
      title: 'Review Study Plan',
      description: `Your study plan for "${activeGoal.title}" has no assigned course resources. Review your goal skills or regenerate your plan.`,
      actionText: 'Review Plan',
      actionUrl: '/goals',
      resourceId: null,
    };
  }

  // ---------------------------------------------------------------------------
  // Priority 6: All plan resources completed (and no in-progress library resources)
  // ---------------------------------------------------------------------------
  return {
    type: 'PLAN_COMPLETED',
    title: 'Study Plan Completed!',
    description: `You have completed all resources in your study plan for "${activeGoal.title}". Review your goal or set a new one.`,
    actionText: 'View Goals',
    actionUrl: '/goals',
    resourceId: null,
  };
};

/**
 * Retrieves consolidated dashboard data for the authenticated user in a single
 * coordinated query sequence without N+1 patterns or un-scoped queries.
 *
 * @param {string | Object} userId - Authenticated user ObjectId
 * @returns {Promise<Object>} Aggregated dashboard payload
 */
export const getDashboardData = async (userId) => {
  // Query 1 & Query 2 run in parallel:
  // - All user learning progress records (sorted by updatedAt: -1, _id: -1)
  // - Primary active goal (most recently created active goal: createdAt: -1, _id: -1)
  const [progressRecords, activeGoal] = await Promise.all([
    LearningProgress.find({ user: userId })
      .populate({
        path: 'resource',
        select: RESOURCE_FIELDS,
      })
      .sort({ updatedAt: -1, _id: -1 }),
    LearningGoal.findOne({ user: userId, status: 'ACTIVE' })
      .sort({ createdAt: -1, _id: -1 }),
  ]);

  // Build progressMap for O(1) lookup by resourceId string
  const progressMap = new Map();
  for (const rec of progressRecords) {
    if (rec && rec.resource) {
      const resId = extractResourceId(rec.resource);
      if (resId) {
        progressMap.set(resId, rec);
      }
    }
  }

  // Calculate overall progress and library summary metrics
  const overallProgress = calculateOverallProgress(progressRecords);
  const learningSummary = {
    saved: overallProgress.saved,
    inProgress: overallProgress.inProgress,
    completed: overallProgress.completed,
    total: overallProgress.total,
  };

  // Find the primary currently in-progress resource in the user's library (most recently updated)
  const sortedInProgressRecords = sortRecordsByRecency(
    progressRecords.filter((r) => r && r.status === 'IN_PROGRESS' && r.resource)
  );
  const primaryInProgressRecord = sortedInProgressRecords.length > 0 ? sortedInProgressRecords[0] : null;

  const currentResource = primaryInProgressRecord
    ? {
        _id: primaryInProgressRecord.resource._id,
        learningProgressId: primaryInProgressRecord._id,
        title: primaryInProgressRecord.resource.title,
        type: primaryInProgressRecord.resource.type,
        platform: primaryInProgressRecord.resource.platform,
        thumbnail: primaryInProgressRecord.resource.thumbnail,
        category: primaryInProgressRecord.resource.category,
        difficulty: primaryInProgressRecord.resource.difficulty,
        estimatedDuration: primaryInProgressRecord.resource.estimatedDuration,
        url: primaryInProgressRecord.resource.url,
        progress: primaryInProgressRecord.progress,
        status: primaryInProgressRecord.status,
        startedAt: primaryInProgressRecord.startedAt,
        updatedAt: primaryInProgressRecord.updatedAt,
      }
    : null;

  // Query 3: If active goal exists, fetch its associated study plan
  let plan = null;
  if (activeGoal) {
    plan = await LearningPlan.findOne({
      user: userId,
      goal: activeGoal._id,
    }).populate({
      path: 'weeks.resources',
      select: RESOURCE_FIELDS,
    });
  }

  // Resolve active week and plan completion state
  let currentPlan = null;
  let activeWeekResult = {
    hasResources: false,
    totalPlanResourcesCount: 0,
    isPlanCompleted: false,
    activeWeek: null,
    activeWeekNumber: null,
  };

  if (plan) {
    activeWeekResult = resolveActiveWeek(plan.weeks, progressMap);

    let activeWeekPayload = null;
    if (activeWeekResult.activeWeek) {
      const aw = activeWeekResult.activeWeek;
      // Annotate active week's resources with current user progress
      const annotatedResources = (aw.resources || [])
        .map((res) => {
          const resId = extractResourceId(res);
          if (!resId) return null;
          const prog = progressMap.get(resId);
          return {
            _id: res._id || resId,
            title: (res && res.title) || 'Course',
            type: res && res.type,
            platform: res && res.platform,
            thumbnail: res && res.thumbnail,
            difficulty: res && res.difficulty,
            estimatedDuration: res && res.estimatedDuration,
            url: res && res.url,
            status: prog ? prog.status : 'NOT_STARTED',
            progress: prog ? prog.progress : 0,
          };
        })
        .filter(Boolean);

      activeWeekPayload = {
        weekNumber: aw.weekNumber,
        focus: aw.focus,
        tasks: aw.tasks || [],
        resources: annotatedResources,
      };
    }

    currentPlan = {
      _id: plan._id,
      goalId: plan.goal,
      generatedAt: plan.generatedAt,
      totalWeeks: (plan.weeks || []).length,
      hasResources: activeWeekResult.hasResources,
      isCompleted: activeWeekResult.isPlanCompleted,
      activeWeekNumber: activeWeekResult.activeWeekNumber,
      activeWeek: activeWeekPayload,
    };
  }

  // Determine the next step recommendation
  const nextStep = determineNextStep({
    activeGoal,
    plan,
    progressRecords,
    progressMap,
    activeWeekResult,
  });

  return {
    activeGoal: activeGoal
      ? {
          _id: activeGoal._id,
          title: activeGoal.title,
          description: activeGoal.description,
          targetSkills: activeGoal.targetSkills,
          currentLevel: activeGoal.currentLevel,
          weeklyHours: activeGoal.weeklyHours,
          targetDate: activeGoal.targetDate,
          status: activeGoal.status,
          createdAt: activeGoal.createdAt,
        }
      : null,
    currentPlan,
    currentResource,
    overallProgress,
    nextStep,
    learningSummary,
  };
};

export const dashboardService = {
  extractResourceId,
  sortRecordsByRecency,
  calculateOverallProgress,
  resolveActiveWeek,
  determineNextStep,
  getDashboardData,
};
