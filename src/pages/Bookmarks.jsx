import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarksContext';
import LearningCard from '../components/LearningCard';
import CourseSkeleton from '../components/CourseSkeleton';

/**
 * Personal Learning & Bookmarks page (Phase 5).
 *
 * For authenticated users: serves as the central "My Learning" dashboard
 * where users view, start, track progress, complete, and remove saved courses.
 *
 * For unauthenticated users: provides a clear sign-in invitation and explains
 * how to access persistent personal learning across sessions.
 */
const Bookmarks = () => {
  const { isAuthenticated, user } = useAuth();
  const {
    learningRecords,
    isLoading,
    error,
    refreshLearning,
    updateProgress,
    startLearning,
    completeLearning,
    removeRecord,
    unmigratedCount,
    isMigrating,
    migrationStatus,
    migrateOfflineBookmarks,
    clearMigrationStatus,
  } = useBookmarks();

  const [activeTab, setActiveTab] = useState('ALL');

  // Compute summary metrics
  const totalCount = learningRecords.length;
  const inProgressCount = useMemo(
    () => learningRecords.filter((r) => r.status === 'IN_PROGRESS').length,
    [learningRecords]
  );
  const completedCount = useMemo(
    () => learningRecords.filter((r) => r.status === 'COMPLETED').length,
    [learningRecords]
  );
  const notStartedCount = useMemo(
    () => learningRecords.filter((r) => r.status === 'NOT_STARTED').length,
    [learningRecords]
  );

  // Filter records based on selected tab
  const displayedRecords = useMemo(() => {
    if (activeTab === 'ALL') return learningRecords;
    return learningRecords.filter((rec) => rec.status === activeTab);
  }, [learningRecords, activeTab]);

  // Unauthenticated view
  if (!isAuthenticated) {
    return (
      <div className="flex-grow flex flex-col items-center bg-background p-4 sm:p-8">
        <div className="max-w-[1000px] w-full mt-6 mb-12">
          <div className="text-center md:text-left mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              My Learning Library
            </h1>
            <p className="text-gray text-lg">
              Track your course progress, save learning resources, and resume studying anywhere.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              Sign In to Access Your Learning
            </h2>
            <p className="text-gray text-base sm:text-lg mb-6 max-w-lg leading-relaxed">
              Create a free account or sign in to your existing account to save courses, track your progress from 0% to 100%, and access your study materials across all your devices.
            </p>

            {unmigratedCount > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm max-w-md text-left flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  We found <strong>{unmigratedCount}</strong> course{unmigratedCount > 1 ? 's' : ''} saved in this browser. Sign in now to safely sync them to your permanent account!
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/login"
                className="px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-link transition-transform duration-200 hover:scale-105 active:scale-95 text-center"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-8 py-3 bg-light-gray text-dark-gray border border-gray-300 font-bold rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Create Account
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 w-full">
              <Link to="/courses" className="text-sm font-semibold text-primary hover:text-link transition-colors">
                Browse our course catalog &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated view: full personal learning library
  return (
    <div className="flex-grow flex flex-col items-center bg-background p-4 sm:p-8">
      <div className="max-w-[1280px] w-full mt-4 mb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2 text-center md:text-left">
              My Learning
            </h1>
            <p className="text-gray text-base sm:text-lg text-center md:text-left">
              Manage your course library and track progress toward completion.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          {totalCount > 0 && (
            <div className="flex items-center justify-center md:justify-end gap-3 sm:gap-4 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-center px-2">
                <span className="block text-xl font-bold text-text">{totalCount}</span>
                <span className="text-[11px] font-semibold text-gray uppercase tracking-wider">Enrolled</span>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center px-2">
                <span className="block text-xl font-bold text-primary">{inProgressCount}</span>
                <span className="text-[11px] font-semibold text-gray uppercase tracking-wider">Active</span>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center px-2">
                <span className="block text-xl font-bold text-emerald-600">{completedCount}</span>
                <span className="text-[11px] font-semibold text-gray uppercase tracking-wider">Completed</span>
              </div>
            </div>
          )}
        </div>

        {/* Offline Bookmarks Migration Alert */}
        {unmigratedCount > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">
                  Sync offline bookmarks ({unmigratedCount} course{unmigratedCount > 1 ? 's' : ''})
                </p>
                <p className="text-xs text-blue-700">
                  Save your browser bookmarks to your permanent StudySync account.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={migrateOfflineBookmarks}
              disabled={isMigrating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap shadow-xs"
            >
              {isMigrating ? 'Syncing...' : 'Sync to My Learning'}
            </button>
          </div>
        )}

        {/* Migration Success Confirmation */}
        {migrationStatus && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Successfully synced {migrationStatus.migratedCount} course(s) to your learning library!</span>
            </div>
            <button
              type="button"
              onClick={clearMigrationStatus}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs (Filter by Status) */}
        {totalCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 pb-3">
            {[
              { id: 'ALL', label: 'All Courses', count: totalCount },
              { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
              { id: 'COMPLETED', label: 'Completed', count: completedCount },
              { id: 'NOT_STARTED', label: 'Not Started', count: notStartedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-text hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <CourseSkeleton key={n} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-red-200 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-text mb-2">Unable to Load Learning Library</h2>
            <p className="text-gray text-base max-w-[500px] mb-6">{error}</p>
            <button
              type="button"
              onClick={refreshLearning}
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-link transition-transform active:scale-95 shadow-md"
            >
              Try Again
            </button>
          </div>
        ) : totalCount === 0 ? (
          /* Empty Library State */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text mb-3">Your Learning Library is Empty</h2>
            <p className="text-gray text-base sm:text-lg max-w-[520px] mb-8 leading-relaxed">
              Explore our catalog, bookmark courses that interest you, and track your progress through each module right here.
            </p>
            <Link
              to="/courses"
              className="px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-link transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              Explore Courses
            </Link>
          </div>
        ) : displayedRecords.length === 0 ? (
          /* Filter Has Zero Results */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-text mb-2">No Courses Found</h3>
            <p className="text-gray text-base max-w-[400px] mb-6">
              You do not have any courses matching the selected filter.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className="px-6 py-2 bg-light-gray text-dark-gray border border-gray-300 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              View All Courses ({totalCount})
            </button>
          </div>
        ) : (
          /* Grid of Learning Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedRecords.map((record) => (
              <LearningCard
                key={record._id}
                record={record}
                onUpdateProgress={updateProgress}
                onStart={startLearning}
                onComplete={completeLearning}
                onRemove={removeRecord}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
