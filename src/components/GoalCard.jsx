/**
 * Card component for displaying a Learning Goal.
 */
const GoalCard = ({
  goal,
  onEdit,
  onDelete,
  onStatusChange,
  isUpdatingStatus = false,
  hasPlan = false,
  onOpenPlan,
  onGeneratePlan,
  onViewPlan,
}) => {
  const {
    _id,
    title,
    description,
    targetSkills = [],
    currentLevel = 'BEGINNER',
    weeklyHours = 5,
    targetDate,
    status = 'ACTIVE',
  } = goal;

  const getStatusBadge = () => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            Archived
          </span>
        );
      case 'ACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-primary border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Active
          </span>
        );
    }
  };

  const getLevelBadge = () => {
    switch (currentLevel) {
      case 'ADVANCED':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Advanced
          </span>
        );
      case 'INTERMEDIATE':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            Intermediate
          </span>
        );
      case 'BEGINNER':
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Beginner
          </span>
        );
    }
  };

  const getFormattedTargetDate = () => {
    if (!targetDate) return null;
    const d = new Date(targetDate);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formattedTargetDate = getFormattedTargetDate();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <div className="p-5 sm:p-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {getLevelBadge()}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-dark-gray bg-light-gray/60 px-2.5 py-1 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{weeklyHours} hrs/wk</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-text mb-2 leading-snug line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        {description ? (
          <p className="text-sm text-dark-gray mb-4 line-clamp-3 leading-relaxed">
            {description}
          </p>
        ) : (
          <p className="text-xs text-gray italic mb-4">No description provided</p>
        )}

        {/* Target Skills Tags */}
        {targetSkills.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray uppercase tracking-wider mb-2">
              Skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {targetSkills.map((skill, idx) => (
                <span
                  key={`${skill}-${idx}`}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-light-gray text-text border border-gray-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Target Date */}
        {formattedTargetDate && (
          <div className="flex items-center gap-2 text-xs text-dark-gray bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Target completion: <strong className="font-semibold text-text">{formattedTargetDate}</strong></span>
          </div>
        )}

        {/* Study Plan Section */}
        <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-dark-gray min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${hasPlan ? 'text-primary' : 'text-gray'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="truncate font-medium">
              {hasPlan ? 'AI Study Plan ready' : 'AI Study Plan'}
            </span>
          </div>

          {hasPlan ? (
            <button
              type="button"
              onClick={() => {
                if (onViewPlan) onViewPlan(goal);
                else if (onOpenPlan) onOpenPlan(goal);
              }}
              className="px-3 py-1.5 bg-indigo-50 text-primary hover:bg-primary hover:text-white font-semibold text-xs rounded-lg transition-colors border border-indigo-200 flex items-center gap-1 flex-shrink-0"
              title="View existing study plan"
            >
              <span>View Study Plan</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onGeneratePlan) onGeneratePlan(goal);
                else if (onOpenPlan) onOpenPlan(goal);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-purple-50 text-primary hover:bg-primary hover:text-white font-semibold text-xs rounded-lg transition-colors border border-primary/20 flex items-center gap-1 flex-shrink-0"
              title="Generate new AI study plan"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Generate Study Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-light-gray/30 border-t border-gray-100 flex items-center justify-between gap-2">
        {/* Quick Status Toggle */}
        <div className="flex items-center gap-1.5">
          {status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => onStatusChange(_id, 'COMPLETED')}
              disabled={isUpdatingStatus}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs rounded-lg transition-colors border border-emerald-200 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark Done
            </button>
          )}

          {status === 'COMPLETED' && (
            <button
              type="button"
              onClick={() => onStatusChange(_id, 'ACTIVE')}
              disabled={isUpdatingStatus}
              className="px-3 py-1.5 bg-indigo-50 text-primary hover:bg-indigo-100 font-semibold text-xs rounded-lg transition-colors border border-indigo-200 flex items-center gap-1"
            >
              Reopen
            </button>
          )}

          {status === 'ARCHIVED' ? (
            <button
              type="button"
              onClick={() => onStatusChange(_id, 'ACTIVE')}
              disabled={isUpdatingStatus}
              className="px-3 py-1.5 bg-indigo-50 text-primary hover:bg-indigo-100 font-semibold text-xs rounded-lg transition-colors border border-indigo-200"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStatusChange(_id, 'ARCHIVED')}
              disabled={isUpdatingStatus}
              className="px-2.5 py-1.5 text-gray hover:text-dark-gray hover:bg-gray-100 font-medium text-xs rounded-lg transition-colors"
              title="Archive goal"
            >
              Archive
            </button>
          )}
        </div>

        {/* Edit and Delete Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="p-1.5 text-gray hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit goal"
            aria-label={`Edit ${title}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal)}
            className="p-1.5 text-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete goal"
            aria-label={`Delete ${title}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalCard;
