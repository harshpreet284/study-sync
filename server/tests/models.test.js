import mongoose from 'mongoose';
import {
  User,
  Resource,
  LearningProgress,
  LearningGoal,
  LearningPlan,
} from '../models/index.js';

console.log('='.repeat(60));
console.log('StudySync Model Validation Test Suite');
console.log('='.repeat(60));

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED (Assertion ${totalTests}): ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  } else {
    passedTests++;
    console.log(`✓ PASSED [${totalTests}]: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// 1. User Validation Tests (5 assertions)
// ---------------------------------------------------------------------------
console.log('\n[Suite 1: User Model Validation]');
{
  // 1. Valid User
  const validUser = new User({
    name: 'Alice Developer',
    email: 'Alice.Dev@Example.COM ',
    passwordHash: '$2a$10$fakehashstringforAlice',
  });
  const validUserErr = validUser.validateSync();
  assert(!validUserErr, 'Valid User passes schema validation');
  assert(
    validUser.email === 'alice.dev@example.com',
    'User email is trimmed and normalized to lowercase'
  );

  // 2. Serialization safety (toJSON)
  const jsonUser = validUser.toJSON();
  assert(
    jsonUser.passwordHash === undefined,
    'User toJSON transform strips passwordHash from serialization'
  );

  // 3. Invalid Email Format
  const invalidEmailUser = new User({
    name: 'Bad Email',
    email: 'not-an-email',
    passwordHash: 'hash',
  });
  const badEmailErr = invalidEmailUser.validateSync();
  assert(
    badEmailErr && badEmailErr.errors.email,
    'Invalid email format is rejected by emailRegex'
  );

  // 4. Missing Required Fields
  const emptyUser = new User({});
  const emptyUserErr = emptyUser.validateSync();
  assert(
    emptyUserErr &&
      emptyUserErr.errors.name &&
      emptyUserErr.errors.email &&
      emptyUserErr.errors.passwordHash,
    'Missing required fields (name, email, passwordHash) are rejected'
  );
}

// ---------------------------------------------------------------------------
// 2. Resource Validation Tests (7 assertions)
// ---------------------------------------------------------------------------
console.log('\n[Suite 2: Resource Model Validation]');
{
  // 5. Valid Resource
  const validRes = new Resource({
    title: 'Intro to Go',
    description: 'Learn Go programming from basics',
    type: 'TUTORIAL',
    platform: 'Go.dev',
    url: 'https://go.dev/tour/',
    category: 'Backend Development',
    difficulty: 'BEGINNER',
    estimatedDuration: 10,
    skills: ['Go', 'Backend'],
    modules: [{ title: 'Syntax', description: 'Basics', order: 1 }],
    thumbnail: 'https://images.unsplash.com/photo-example',
    instructor: 'Rob Pike',
    rating: 4.8,
    sourceId: 9999,
  });
  const validResErr = validRes.validateSync();
  assert(!validResErr, 'Valid Resource passes schema validation');

  // 6. Invalid Type Enum
  const badTypeRes = new Resource({
    title: 'Bad Type',
    description: 'Desc',
    type: 'PODCAST',
    url: 'https://example.com',
  });
  const badTypeErr = badTypeRes.validateSync();
  assert(
    badTypeErr && badTypeErr.errors.type,
    'Invalid resource type enum is rejected'
  );

  // 7. Invalid Difficulty Enum
  const badDiffRes = new Resource({
    title: 'Bad Diff',
    description: 'Desc',
    type: 'COURSE',
    url: 'https://example.com',
    difficulty: 'EXPERT',
  });
  const badDiffErr = badDiffRes.validateSync();
  assert(
    badDiffErr && badDiffErr.errors.difficulty,
    'Invalid difficulty enum is rejected'
  );

  // 8. Malformed URL Protocol
  const badUrlRes = new Resource({
    title: 'Bad URL',
    description: 'Desc',
    type: 'ARTICLE',
    url: 'ftp://not-http-url.com',
  });
  const badUrlErr = badUrlRes.validateSync();
  assert(
    badUrlErr && badUrlErr.errors.url,
    'Non-HTTP/HTTPS URL protocol is rejected'
  );

  // 9. Missing URL
  const noUrlRes = new Resource({
    title: 'No URL',
    description: 'Desc',
    type: 'ARTICLE',
  });
  const noUrlErr = noUrlRes.validateSync();
  assert(noUrlErr && noUrlErr.errors.url, 'Missing URL is rejected');

  // 10. Out-of-bounds Rating (> 5)
  const badRatingRes = new Resource({
    title: 'Bad Rating',
    description: 'Desc',
    type: 'COURSE',
    url: 'https://example.com',
    rating: 6,
  });
  const badRatingErr = badRatingRes.validateSync();
  assert(badRatingErr && badRatingErr.errors.rating, 'Rating > 5 is rejected');

  // 11. Negative Estimated Duration
  const negDurRes = new Resource({
    title: 'Negative Duration',
    description: 'Desc',
    type: 'COURSE',
    url: 'https://example.com',
    estimatedDuration: -5,
  });
  const negDurErr = negDurRes.validateSync();
  assert(
    negDurErr && negDurErr.errors.estimatedDuration,
    'Negative estimatedDuration is rejected'
  );
}

// ---------------------------------------------------------------------------
// 3. LearningProgress Validation Tests (5 assertions)
// ---------------------------------------------------------------------------
console.log('\n[Suite 3: LearningProgress Model Validation]');
{
  // 12. Valid Progress
  const validProgress = new LearningProgress({
    user: new mongoose.Types.ObjectId(),
    resource: new mongoose.Types.ObjectId(),
    status: 'IN_PROGRESS',
    progress: 50,
  });
  assert(
    !validProgress.validateSync(),
    'Valid LearningProgress passes schema validation'
  );

  // 13. Progress > 100
  const overProgress = new LearningProgress({
    user: new mongoose.Types.ObjectId(),
    resource: new mongoose.Types.ObjectId(),
    progress: 150,
  });
  const overErr = overProgress.validateSync();
  assert(overErr && overErr.errors.progress, 'Progress > 100 is rejected');

  // 14. Progress < 0
  const underProgress = new LearningProgress({
    user: new mongoose.Types.ObjectId(),
    resource: new mongoose.Types.ObjectId(),
    progress: -10,
  });
  const underErr = underProgress.validateSync();
  assert(underErr && underErr.errors.progress, 'Progress < 0 is rejected');

  // 15. Invalid Status Enum
  const badStatus = new LearningProgress({
    user: new mongoose.Types.ObjectId(),
    resource: new mongoose.Types.ObjectId(),
    status: 'COMPLETELY_DONE',
  });
  const badStatusErr = badStatus.validateSync();
  assert(
    badStatusErr && badStatusErr.errors.status,
    'Invalid progress status enum is rejected'
  );

  // 16. Missing User and Resource References
  const emptyProg = new LearningProgress({});
  const emptyProgErr = emptyProg.validateSync();
  assert(
    emptyProgErr && emptyProgErr.errors.user && emptyProgErr.errors.resource,
    'Missing user and resource references are rejected'
  );
}

// ---------------------------------------------------------------------------
// 4. LearningGoal Validation Tests (3 assertions)
// ---------------------------------------------------------------------------
console.log('\n[Suite 4: LearningGoal Model Validation]');
{
  // 17. Valid Goal
  const validGoal = new LearningGoal({
    user: new mongoose.Types.ObjectId(),
    title: 'Become MERN Developer',
    description: 'Learn fullstack web dev',
    targetSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    currentLevel: 'BEGINNER',
    weeklyHours: 10,
    targetDate: new Date('2026-12-31'),
    status: 'ACTIVE',
  });
  assert(!validGoal.validateSync(), 'Valid LearningGoal passes schema validation');

  // 18. Weekly Hours < 1
  const badHoursGoal = new LearningGoal({
    user: new mongoose.Types.ObjectId(),
    title: 'Goal',
    weeklyHours: 0,
  });
  const badHoursErr = badHoursGoal.validateSync();
  assert(
    badHoursErr && badHoursErr.errors.weeklyHours,
    'Weekly study hours < 1 is rejected'
  );

  // 19. Invalid Goal Status Enum
  const badStatusGoal = new LearningGoal({
    user: new mongoose.Types.ObjectId(),
    title: 'Goal',
    status: 'PAUSED',
  });
  const badGoalStatusErr = badStatusGoal.validateSync();
  assert(
    badGoalStatusErr && badGoalStatusErr.errors.status,
    'Invalid goal status enum is rejected'
  );
}

// ---------------------------------------------------------------------------
// 5. LearningPlan Validation Tests (3 assertions)
// ---------------------------------------------------------------------------
console.log('\n[Suite 5: LearningPlan Model Validation]');
{
  // 20. Valid Plan
  const validPlan = new LearningPlan({
    user: new mongoose.Types.ObjectId(),
    goal: new mongoose.Types.ObjectId(),
    weeks: [
      {
        weekNumber: 1,
        focus: 'JavaScript Core',
        resources: [new mongoose.Types.ObjectId()],
        tasks: ['Complete variables review', 'Build simple calculator'],
      },
    ],
  });
  assert(!validPlan.validateSync(), 'Valid LearningPlan passes schema validation');

  // 21. Week Missing Focus
  const badWeekPlan = new LearningPlan({
    user: new mongoose.Types.ObjectId(),
    goal: new mongoose.Types.ObjectId(),
    weeks: [
      {
        weekNumber: 1,
      },
    ],
  });
  const badWeekErr = badWeekPlan.validateSync();
  assert(
    badWeekErr && badWeekErr.errors['weeks.0.focus'],
    'Weekly plan item missing focus is rejected'
  );

  // 22. Week Number < 1
  const badWeekNumPlan = new LearningPlan({
    user: new mongoose.Types.ObjectId(),
    goal: new mongoose.Types.ObjectId(),
    weeks: [
      {
        weekNumber: 0,
        focus: 'Focus',
      },
    ],
  });
  const badWeekNumErr = badWeekNumPlan.validateSync();
  assert(
    badWeekNumErr && badWeekNumErr.errors['weeks.0.weekNumber'],
    'Week number < 1 is rejected'
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n' + '='.repeat(60));
console.log(`Test Execution Summary: ${passedTests}/${totalTests} assertions passed.`);
console.log('='.repeat(60));

if (passedTests !== 23 || totalTests !== 23) {
  console.error(`❌ Expected exactly 23 assertions, but recorded ${totalTests}.`);
  process.exit(1);
} else {
  console.log('✓ All 23 Mongoose model validation assertions passed successfully.\n');
  process.exit(0);
}
