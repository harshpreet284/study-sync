process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables explicitly
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { app } = await import('../server.js');
const { User } = await import('../models/User.js');
const { Resource } = await import('../models/Resource.js');
const { LearningGoal } = await import('../models/LearningGoal.js');
const { LearningPlan } = await import('../models/LearningPlan.js');
const { generateToken } = await import('../utils/jwt.js');
const {
  aiService,
  findCandidateResources,
  validateAndSanitizeWeeks,
  generateDeterministicMockPlan,
  callGroqApi,
} = await import('../services/aiService.js');

console.log('='.repeat(60));
console.log('StudySync AI Study Planner API Integration Test Suite');
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

const runPlanTests = async () => {
  // ---------------------------------------------------------------------------
  // 1. Test Database Isolation Safeguards
  // ---------------------------------------------------------------------------
  console.log('\n[Test Isolation Check]');

  const testUri = process.env.LOCAL_MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/studysync_test';
  process.env.MONGODB_TEST_URI = testUri;

  if (process.env.MONGODB_URI && testUri === process.env.MONGODB_URI) {
    console.error('\n❌ [TEST ABORTED] MONGODB_TEST_URI cannot be identical to development MONGODB_URI.');
    process.exitCode = 1;
    return;
  }

  if (testUri.includes('mongodb+srv') || (!testUri.includes('127.0.0.1') && !testUri.includes('localhost'))) {
    console.error('\n❌ [TEST ABORTED] Test database URI must point strictly to a local test database (127.0.0.1 or localhost).');
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(testUri);
  const dbName = mongoose.connection.name;
  if (dbName !== 'studysync_test') {
    console.error(`\n❌ [TEST ABORTED] Must connect strictly to test database 'studysync_test'. Current: '${dbName}'.`);
    await mongoose.disconnect();
    process.exitCode = 1;
    return;
  }
  console.log(`✓ Confirmed connection strictly to isolated local test database: "${dbName}"`);

  // Start ephemeral test server on random port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/plans`;

  const timestamp = Date.now();
  const createdUserIds = new Set();
  const createdResourceIds = new Set();
  const createdGoalIds = new Set();
  const createdPlanIds = new Set();

  try {
    // -------------------------------------------------------------------------
    // 2. Setup Fixtures: Users, Resources, Goals
    // -------------------------------------------------------------------------
    console.log('\n[Setup: Test Users & Catalog Resources]');
    const passwordHash = await bcrypt.hash('PlanTestPassword123!', 10);

    const userA = await User.create({
      name: 'Plan Learner A',
      email: `plan_user_a_${timestamp}@example.com`,
      passwordHash,
    });
    createdUserIds.add(userA._id.toString());
    const tokenA = generateToken(userA._id);

    const userB = await User.create({
      name: 'Plan Learner B',
      email: `plan_user_b_${timestamp}@example.com`,
      passwordHash,
    });
    createdUserIds.add(userB._id.toString());
    const tokenB = generateToken(userB._id);

    // Create 3 catalog resources with skills matching React and TypeScript
    const resource1 = await Resource.create({
      title: 'Modern React Deep Dive',
      description: 'Comprehensive guide to modern React and state management.',
      type: 'COURSE',
      difficulty: 'INTERMEDIATE',
      estimatedDuration: 12,
      platform: 'StudySync Academy',
      url: 'https://example.com/react-deep-dive',
      category: 'Web Development',
      skills: ['React', 'JavaScript', 'Frontend'],
      modules: [
        { title: 'Hooks', description: 'React Hooks', order: 1 },
        { title: 'Context', description: 'React Context API', order: 2 },
        { title: 'State Management', description: 'Advanced State', order: 3 },
      ],
      thumbnail: 'https://example.com/thumb1.jpg',
    });
    createdResourceIds.add(resource1._id.toString());

    const resource2 = await Resource.create({
      title: 'TypeScript Essentials for Frontend',
      description: 'Master static typing with TypeScript in web applications.',
      type: 'COURSE',
      difficulty: 'BEGINNER',
      estimatedDuration: 8,
      platform: 'StudySync Academy',
      url: 'https://example.com/ts-essentials',
      category: 'Web Development',
      skills: ['TypeScript', 'JavaScript'],
      modules: [
        { title: 'Types', description: 'Primitive and object types', order: 1 },
        { title: 'Interfaces', description: 'Defining contracts', order: 2 },
        { title: 'Generics', description: 'Reusable type logic', order: 3 },
      ],
      thumbnail: 'https://example.com/thumb2.jpg',
    });
    createdResourceIds.add(resource2._id.toString());

    const resource3 = await Resource.create({
      title: 'Building Fullstack Apps with Next.js',
      description: 'Fullstack development with React and Node.js.',
      type: 'TUTORIAL',
      difficulty: 'ADVANCED',
      estimatedDuration: 15,
      platform: 'StudySync Academy',
      url: 'https://example.com/nextjs-fullstack',
      category: 'Web Development',
      skills: ['React', 'Next.js', 'Node.js'],
      modules: [
        { title: 'App Router', description: 'Modern Next.js routing', order: 1 },
        { title: 'Server Actions', description: 'Mutations and forms', order: 2 },
        { title: 'Deployment', description: 'Vercel and self-hosted', order: 3 },
      ],
      thumbnail: 'https://example.com/thumb3.jpg',
    });
    createdResourceIds.add(resource3._id.toString());

    // Goals for User A
    const goalA1 = await LearningGoal.create({
      user: userA._id,
      title: 'Master React & TypeScript',
      description: 'Become proficient in modern React component development.',
      targetSkills: ['React', 'TypeScript'],
      currentLevel: 'BEGINNER',
      weeklyHours: 10,
      targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28), // 4 weeks ahead
      status: 'ACTIVE',
    });
    createdGoalIds.add(goalA1._id.toString());

    const goalANoResources = await LearningGoal.create({
      user: userA._id,
      title: 'Learn Quantum Mechanics Teleportation',
      description: 'Explore topics with zero catalog resources in StudySync.',
      targetSkills: ['QuantumTeleportation404', 'StringTheory999'],
      currentLevel: 'ADVANCED',
      weeklyHours: 5,
      status: 'ACTIVE',
    });
    createdGoalIds.add(goalANoResources._id.toString());

    // Goal for User B
    const goalB1 = await LearningGoal.create({
      user: userB._id,
      title: 'User B TypeScript Goal',
      description: 'Goal strictly owned by User B.',
      targetSkills: ['TypeScript'],
      currentLevel: 'INTERMEDIATE',
      weeklyHours: 8,
      status: 'ACTIVE',
    });
    createdGoalIds.add(goalB1._id.toString());

    console.log('✓ Test fixtures successfully created.');

    // -------------------------------------------------------------------------
    // 3. Authentication Enforcement Tests
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Authentication Guards]');

    // POST /api/plans/generate without token
    const resAuth1 = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId: goalA1._id.toString() }),
    });
    assert(resAuth1.status === 401, 'POST /api/plans/generate without token returns 401');

    // GET /api/plans/:id without token
    const resAuth2 = await fetch(`${baseUrl}/${new mongoose.Types.ObjectId()}`);
    assert(resAuth2.status === 401, 'GET /api/plans/:id without token returns 401');

    // GET /api/plans/goal/:goalId without token
    const resAuth3 = await fetch(`${baseUrl}/goal/${goalA1._id.toString()}`);
    assert(resAuth3.status === 401, 'GET /api/plans/goal/:goalId without token returns 401');

    // Invalid / malformed token
    const resAuth4 = await fetch(`${baseUrl}/goal/${goalA1._id.toString()}`, {
      headers: { Authorization: 'Bearer invalid.token.signature' },
    });
    assert(resAuth4.status === 401, 'Request with invalid token returns 401');

    // -------------------------------------------------------------------------
    // 4. Request Validation & Controlled Errors
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Input Validation]');

    // Missing body
    const resVal1 = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({}),
    });
    assert(resVal1.status === 400, 'POST /generate with empty body returns 400');
    const val1Data = await resVal1.json();
    assert(val1Data.success === false, 'Error response has success: false');

    // Invalid ObjectId format for goalId
    const resVal2 = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ goalId: 'not-a-valid-object-id' }),
    });
    assert(resVal2.status === 400, 'POST /generate with malformed goalId returns 400');

    // Invalid plan ID in GET /:id
    const resVal3 = await fetch(`${baseUrl}/12345-invalid-id`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resVal3.status === 400, 'GET /api/plans/:id with invalid ID format returns 400');
    const val3Data = await resVal3.json();
    assert(val3Data.message === 'Invalid plan ID format.', 'GET /api/plans/:id returns specific plan ID error');

    // Invalid goal ID in GET /goal/:goalId
    const resVal4 = await fetch(`${baseUrl}/goal/xyz-invalid-id`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resVal4.status === 400, 'GET /api/plans/goal/:goalId with invalid ID format returns 400');
    const val4Data = await resVal4.json();
    assert(val4Data.message === 'Invalid goal ID format.', 'GET /api/plans/goal/:goalId routes correctly to getPlanByGoalId');

    // Non-existent goal ID (valid format, but doesn't exist)
    const nonExistentGoalId = new mongoose.Types.ObjectId().toString();
    const resVal5 = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ goalId: nonExistentGoalId }),
    });
    assert(resVal5.status === 404, 'POST /generate with non-existent goalId returns 404');

    // -------------------------------------------------------------------------
    // 5. Ownership Enforcement & Isolation
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Cross-User Ownership Enforcement]');

    // User B tries to generate a plan for User A's goal -> 404 (does not reveal existence)
    const resCrossGen = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ goalId: goalA1._id.toString() }),
    });
    assert(resCrossGen.status === 404, 'User B generating plan for User A goal returns 404 Not Found');

    // User B tries to fetch plan by User A's goalId -> 404
    const resCrossGoal = await fetch(`${baseUrl}/goal/${goalA1._id.toString()}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resCrossGoal.status === 404, 'User B GET /api/plans/goal/:goalA returns 404 Not Found');

    // -------------------------------------------------------------------------
    // 6. Insufficient Resources Handling
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Insufficient Catalog Resources]');

    // User A attempts to generate a plan for goal with no matching skills
    const resNoRes = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ goalId: goalANoResources._id.toString() }),
    });
    assert(resNoRes.status === 400, 'POST /generate with no matching catalog resources returns 400');
    const noResData = await resNoRes.json();
    assert(
      noResData.message.includes('No relevant learning resources found'),
      'Returns controlled insufficient-resources message without calling AI provider'
    );

    // Verify no plan was persisted in database
    const planNoRes = await LearningPlan.findOne({ goal: goalANoResources._id });
    assert(planNoRes === null, 'No plan is persisted in database when resources are insufficient');

    // -------------------------------------------------------------------------
    // 7. Successful Plan Generation via Mock
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Successful Plan Generation]');

    const resGen = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ goalId: goalA1._id.toString() }),
    });
    assert(resGen.status === 200, 'POST /generate returns 200 OK');
    const genData = await resGen.json();
    assert(genData.success === true, 'Response indicates success: true');
    assert(Boolean(genData.data?._id), 'Response includes generated plan _id');
    assert(genData.data.user.toString() === userA._id.toString(), 'Plan user matches authenticated User A');

    const createdPlanId = genData.data._id;
    createdPlanIds.add(createdPlanId);

    // Validate generated weeks structure
    const weeks = genData.data.weeks;
    assert(Array.isArray(weeks) && weeks.length >= 1, 'Plan contains a non-empty weeks array');
    assert(weeks.length <= 12, 'Plan weeks do not exceed bounded maximum of 12');

    // Check sequential weeks and valid content
    for (let i = 0; i < weeks.length; i++) {
      const w = weeks[i];
      assert(w.weekNumber === i + 1, `Week ${i + 1} has sequential weekNumber ${i + 1}`);
      assert(typeof w.focus === 'string' && w.focus.length >= 3, `Week ${i + 1} has non-empty focus`);
      assert(Array.isArray(w.tasks) && w.tasks.length >= 1, `Week ${i + 1} has at least 1 task`);
      assert(Array.isArray(w.resources) && w.resources.length >= 1, `Week ${i + 1} has populated resources`);
      // Verify populated resource contains title and type
      assert(Boolean(w.resources[0].title), `Week ${i + 1} resource is populated with title`);
    }

    // Verify direct database persistence
    const dbPlan = await LearningPlan.findById(createdPlanId);
    assert(dbPlan !== null, 'Plan is persisted in MongoDB');
    assert(dbPlan.weeks.length === weeks.length, 'Persisted plan week count matches returned data');

    // -------------------------------------------------------------------------
    // 8. Plan Retrieval Endpoints
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Plan Retrieval]');

    // GET /api/plans/:id by owner
    const resGetById = await fetch(`${baseUrl}/${createdPlanId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resGetById.status === 200, 'User A GET /api/plans/:id returns 200 OK');
    const getByIdData = await resGetById.json();
    assert(getByIdData.data._id === createdPlanId, 'Retrieved plan matches created plan ID');
    assert(getByIdData.data.goal._id.toString() === goalA1._id.toString(), 'Retrieved plan includes populated goal');

    // User B attempts GET /api/plans/:id for User A's plan -> 404
    const resCrossPlanGet = await fetch(`${baseUrl}/${createdPlanId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resCrossPlanGet.status === 404, 'User B GET /api/plans/:planAId returns 404 Not Found');

    // GET /api/plans/goal/:goalId by owner
    const resGetByGoal = await fetch(`${baseUrl}/goal/${goalA1._id.toString()}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resGetByGoal.status === 200, 'User A GET /api/plans/goal/:goalA returns 200 OK');
    const getByGoalData = await resGetByGoal.json();
    assert(getByGoalData.data._id === createdPlanId, 'Plan retrieved by goal matches created plan');

    // GET /api/plans/goal/:goalId when no plan exists yet -> 200 with data: null
    const resNoPlanYet = await fetch(`${baseUrl}/goal/${goalB1._id.toString()}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resNoPlanYet.status === 200, 'GET /api/plans/goal/:goalB (no plan yet) returns 200 OK');
    const noPlanYetData = await resNoPlanYet.json();
    assert(noPlanYetData.data === null, 'Response data is null when no plan has been generated');

    // -------------------------------------------------------------------------
    // 9. Regeneration & Canonical Plan Updates
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Plan Regeneration]');

    const initialGeneratedAt = new Date(genData.data.generatedAt).getTime();

    // Regenerate plan for the same goal
    const resRegen = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ goalId: goalA1._id.toString() }),
    });
    assert(resRegen.status === 200, 'POST /generate (regeneration) returns 200 OK');
    const regenData = await resRegen.json();

    // Verify same canonical plan ID (upserted in-place)
    assert(regenData.data._id === createdPlanId, 'Regeneration updates existing plan ID instead of creating duplicate');

    // Verify only 1 plan exists in DB for this user + goal
    const planCount = await LearningPlan.countDocuments({
      user: userA._id,
      goal: goalA1._id,
    });
    assert(planCount === 1, 'Exactly one plan exists in database for user and goal');

    // -------------------------------------------------------------------------
    // 10. Strict Output Validation & Security Rejections (Unit / Service Guard)
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Untrusted AI Output Validation & Hallucination Rejection]');

    const candidateList = [resource1, resource2];

    // Case A: Hallucinated / non-candidate resource ID
    const fakeResourceId = new mongoose.Types.ObjectId();
    const rawWeeksWithHallucination = [
      {
        weekNumber: 1,
        focus: 'Intro to React',
        resourceIds: [fakeResourceId.toString()],
        tasks: ['Read chapter 1', 'Do practice exercise'],
      },
    ];
    let rejectedHallucination = false;
    try {
      validateAndSanitizeWeeks(rawWeeksWithHallucination, candidateList);
    } catch (err) {
      rejectedHallucination = true;
      assert(err.statusCode === 422, 'Rejection of hallucinated resource ID returns 422');
      assert(
        err.message.includes('not in the approved catalog candidates'),
        'Rejection message explicitly identifies unapproved resource reference'
      );
    }
    assert(rejectedHallucination, 'validateAndSanitizeWeeks successfully rejected hallucinated resource ID');

    // Case B: Non-sequential week numbers
    const rawWeeksNonSequential = [
      {
        weekNumber: 1,
        focus: 'Week 1 Focus',
        resourceIds: [resource1._id.toString()],
        tasks: ['Task 1', 'Task 2'],
      },
      {
        weekNumber: 3, // Skipped week 2
        focus: 'Week 3 Focus',
        resourceIds: [resource1._id.toString()],
        tasks: ['Task 3', 'Task 4'],
      },
    ];
    let rejectedSeq = false;
    try {
      validateAndSanitizeWeeks(rawWeeksNonSequential, candidateList);
    } catch (err) {
      rejectedSeq = true;
      assert(err.statusCode === 422, 'Non-sequential week numbers trigger 422 error');
    }
    assert(rejectedSeq, 'validateAndSanitizeWeeks rejected non-sequential week numbers');

    // Case C: Empty tasks array
    const rawWeeksEmptyTasks = [
      {
        weekNumber: 1,
        focus: 'Valid Focus Area',
        resourceIds: [resource1._id.toString()],
        tasks: [],
      },
    ];
    let rejectedEmptyTasks = false;
    try {
      validateAndSanitizeWeeks(rawWeeksEmptyTasks, candidateList);
    } catch (err) {
      rejectedEmptyTasks = true;
      assert(err.statusCode === 422, 'Empty tasks array triggers 422 error');
    }
    assert(rejectedEmptyTasks, 'validateAndSanitizeWeeks rejected empty tasks');

    // Case D: Exceeding maximum plan weeks (>12)
    const rawWeeksOver12 = Array.from({ length: 13 }, (_, i) => ({
      weekNumber: i + 1,
      focus: `Week ${i + 1} Focus Area`,
      resourceIds: [resource1._id.toString()],
      tasks: ['Task 1', 'Task 2'],
    }));
    let rejectedOver12 = false;
    try {
      validateAndSanitizeWeeks(rawWeeksOver12, candidateList);
    } catch (err) {
      rejectedOver12 = true;
      assert(err.statusCode === 422, 'Plan with >12 weeks triggers 422 error');
    }
    assert(rejectedOver12, 'validateAndSanitizeWeeks rejected plan exceeding 12 weeks');

    // -------------------------------------------------------------------------
    // 10.5. Exact Skill Matching & Deterministic Candidate Ordering (F-01, F-05)
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Exact Skill Matching & Candidate Resource Ordering]');

    const resDjango = await Resource.create({
      title: 'Python Django Mastery',
      description: 'Full course on Django web framework.',
      type: 'COURSE',
      difficulty: 'INTERMEDIATE',
      estimatedDuration: 10,
      platform: 'StudySync Academy',
      url: 'https://example.com/django-course',
      category: 'Backend',
      skills: ['Django', 'Python'],
      modules: [{ title: 'Intro', description: 'Django setup', order: 1 }],
      thumbnail: 'https://example.com/thumb-django.jpg',
    });
    createdResourceIds.add(resDjango._id.toString());

    const resGo = await Resource.create({
      title: 'Go Programming Fundamentals',
      description: 'Learn Go language for backend systems.',
      type: 'COURSE',
      difficulty: 'BEGINNER',
      estimatedDuration: 8,
      platform: 'StudySync Academy',
      url: 'https://example.com/go-course',
      category: 'Backend',
      skills: ['Go', 'Backend'],
      modules: [{ title: 'Go Basics', description: 'Syntax', order: 1 }],
      thumbnail: 'https://example.com/thumb-go.jpg',
    });
    createdResourceIds.add(resGo._id.toString());

    const resJs = await Resource.create({
      title: 'JavaScript In Depth',
      description: 'Deep dive into modern JavaScript.',
      type: 'COURSE',
      difficulty: 'INTERMEDIATE',
      estimatedDuration: 12,
      platform: 'StudySync Academy',
      url: 'https://example.com/js-course',
      category: 'Frontend',
      skills: ['JavaScript'],
      modules: [{ title: 'JS Engine', description: 'V8 internals', order: 1 }],
      thumbnail: 'https://example.com/thumb-js.jpg',
    });
    createdResourceIds.add(resJs._id.toString());

    const resCpp = await Resource.create({
      title: 'Modern C++ Programming',
      description: 'C++ memory model and performance.',
      type: 'COURSE',
      difficulty: 'ADVANCED',
      estimatedDuration: 20,
      platform: 'StudySync Academy',
      url: 'https://example.com/cpp-course',
      category: 'Systems',
      skills: ['C++', 'Systems'],
      modules: [{ title: 'Pointers', description: 'Smart pointers', order: 1 }],
      thumbnail: 'https://example.com/thumb-cpp.jpg',
    });
    createdResourceIds.add(resCpp._id.toString());

    const resNet = await Resource.create({
      title: 'Enterprise .NET Core',
      description: 'Building microservices with .NET.',
      type: 'COURSE',
      difficulty: 'ADVANCED',
      estimatedDuration: 16,
      platform: 'StudySync Academy',
      url: 'https://example.com/dotnet-course',
      category: 'Backend',
      skills: ['.NET', 'C#'],
      modules: [{ title: '.NET Web API', description: 'Controllers', order: 1 }],
      thumbnail: 'https://example.com/thumb-dotnet.jpg',
    });
    createdResourceIds.add(resNet._id.toString());

    // 1. Exact match for 'Go' must match resGo and NOT match resDjango (substring 'go' in 'django')
    const candidatesGo = await findCandidateResources({ targetSkills: ['Go'] });
    const goIds = candidatesGo.map((r) => r._id.toString());
    assert(goIds.includes(resGo._id.toString()), 'Exact skill "Go" matches Go resource');
    assert(!goIds.includes(resDjango._id.toString()), 'Exact skill "Go" does NOT match "Django" (no substring false positives)');

    // 2. Exact match for 'Java' must NOT match resJs ('JavaScript')
    const candidatesJava = await findCandidateResources({ targetSkills: ['Java'] });
    const javaIds = candidatesJava.map((r) => r._id.toString());
    assert(!javaIds.includes(resJs._id.toString()), 'Skill "Java" does NOT match "JavaScript" (no prefix false positives)');

    // 3. Exact match for 'C' must NOT match resCpp ('C++') or resDjango
    const candidatesC = await findCandidateResources({ targetSkills: ['C'] });
    const cIds = candidatesC.map((r) => r._id.toString());
    assert(!cIds.includes(resCpp._id.toString()), 'Skill "C" does NOT match "C++"');
    assert(!cIds.includes(resDjango._id.toString()), 'Skill "C" does NOT match "Django"');

    // 4. Metacharacter skill 'C++' matches cleanly without regex syntax error
    const candidatesCpp = await findCandidateResources({ targetSkills: ['C++'] });
    const cppIds = candidatesCpp.map((r) => r._id.toString());
    assert(cppIds.includes(resCpp._id.toString()), 'Metacharacter skill "C++" matches safely');

    // 5. Metacharacter skill '.NET' matches cleanly
    const candidatesNet = await findCandidateResources({ targetSkills: ['.NET'] });
    const netIds = candidatesNet.map((r) => r._id.toString());
    assert(netIds.includes(resNet._id.toString()), 'Metacharacter skill ".NET" matches safely');

    // 6. Case-insensitive exact match: 'go' matches 'Go'
    const candidatesGoLower = await findCandidateResources({ targetSkills: ['go'] });
    const goLowerIds = candidatesGoLower.map((r) => r._id.toString());
    assert(goLowerIds.includes(resGo._id.toString()), 'Case-insensitive exact match ("go") matches "Go"');

    // 7. Deterministic sorting: verify candidate ordering is stable
    const candidatesSorted = await findCandidateResources({ targetSkills: ['React', 'JavaScript'] });
    assert(candidatesSorted.length >= 2, 'Multiple candidates found for sorting check');
    for (let c = 0; c < candidatesSorted.length - 1; c++) {
      const timeA = new Date(candidatesSorted[c].createdAt).getTime();
      const timeB = new Date(candidatesSorted[c + 1].createdAt).getTime();
      assert(timeA >= timeB, 'Candidate resources are deterministically sorted by createdAt descending');
    }

    // -------------------------------------------------------------------------
    // 11. Controlled Provider Errors, Mock Mode Proof & Timeout Simulation
    // -------------------------------------------------------------------------
    console.log('\n[Suite: Provider Error Handling & Mock Mode Proof]');

    // Verify mock mode does not make network requests
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;
    globalThis.fetch = async (...args) => {
      fetchCalled = true;
      return originalFetch(...args);
    };

    const mockWeeks = await aiService.generatePlanWeeks({
      user: userA,
      goal: goalA1,
    });
    assert(fetchCalled === false, 'Mock mode strictly makes 0 external network requests');
    assert(Array.isArray(mockWeeks) && mockWeeks.length > 0, 'Mock mode successfully generated validated weeks');

    // Test missing credentials in production mode (must not silently fall back to mock)
    const prevEnv = process.env.NODE_ENV;
    const prevProvider = process.env.AI_PROVIDER;
    const prevKey = process.env.GROQ_API_KEY;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.AI_PROVIDER;
      delete process.env.GROQ_API_KEY;

      let caughtMissingKey = false;
      try {
        await aiService.generatePlanWeeks({ user: userA, goal: goalA1 });
      } catch (err) {
        caughtMissingKey = true;
        assert(err.statusCode === 500, 'Missing GROQ_API_KEY in production throws 500');
        assert(
          err.message.includes('AI provider configuration is missing'),
          'Controlled message for missing credentials'
        );
      }
      assert(caughtMissingKey, 'Production mode correctly refused to silently fall back to mock without API key');
    } finally {
      process.env.NODE_ENV = prevEnv;
      process.env.AI_PROVIDER = prevProvider;
      if (prevKey) process.env.GROQ_API_KEY = prevKey;
    }

    // Test timeout / abort handling in callGroqApi (initial connection abort)
    try {
      process.env.GROQ_API_KEY = 'gsk_test_mock_key';
      globalThis.fetch = async () => {
        const abortErr = new Error('The operation was aborted');
        abortErr.name = 'AbortError';
        throw abortErr;
      };

      let caughtTimeout = false;
      try {
        await callGroqApi({
          goal: goalA1,
          candidateResources: candidateList,
          progressMap: new Map(),
        });
      } catch (err) {
        caughtTimeout = true;
        assert(err.statusCode === 504, 'AbortError in callGroqApi maps to HTTP 504 Gateway Timeout');
        assert(err.message.includes('timed out after 15 seconds'), 'Timeout message clearly explains duration');
      }
      assert(caughtTimeout, 'callGroqApi handles timeout/abort cleanly');

      // Test Full-Response Timeout: headers resolve, but body consumption stalls/aborts (F-02)
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => {
            const bodyAbortErr = new Error('Body stream timed out');
            bodyAbortErr.name = 'AbortError';
            throw bodyAbortErr;
          },
        };
      };

      let caughtBodyTimeout = false;
      try {
        await callGroqApi({
          goal: goalA1,
          candidateResources: candidateList,
          progressMap: new Map(),
        });
      } catch (err) {
        caughtBodyTimeout = true;
        assert(err.statusCode === 504, 'Body stream timeout maps to HTTP 504 Gateway Timeout (F-02 verified)');
      }
      assert(caughtBodyTimeout, 'callGroqApi timeout covers complete response body streaming');

      // Test rate limit 429 from provider
      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 429,
          text: async () => 'Rate limit exceeded',
        };
      };

      let caughtRateLimit = false;
      try {
        await callGroqApi({
          goal: goalA1,
          candidateResources: candidateList,
          progressMap: new Map(),
        });
      } catch (err) {
        caughtRateLimit = true;
        assert(err.statusCode === 429, 'Provider 429 status maps to application HTTP 429');
      }
      assert(caughtRateLimit, 'callGroqApi handles provider rate limits cleanly');

      // Test Model Refusal (F-03)
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  refusal: 'I cannot generate a curriculum for this topic.',
                  content: null,
                },
              },
            ],
          }),
        };
      };

      let caughtRefusal = false;
      try {
        await callGroqApi({
          goal: goalA1,
          candidateResources: candidateList,
          progressMap: new Map(),
        });
      } catch (err) {
        caughtRefusal = true;
        assert(err.statusCode === 502, 'Model refusal maps to controlled HTTP 502 Bad Gateway');
        assert(err.message.includes('refused to generate'), 'Refusal message explains refusal');
      }
      assert(caughtRefusal, 'callGroqApi handles model refusals safely');

      // Test Null Content (F-03)
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: null } }],
          }),
        };
      };

      let caughtNullContent = false;
      try {
        await callGroqApi({
          goal: goalA1,
          candidateResources: candidateList,
          progressMap: new Map(),
        });
      } catch (err) {
        caughtNullContent = true;
        assert(err.statusCode === 502, 'Null message content maps to HTTP 502 Bad Gateway');
      }
      assert(caughtNullContent, 'callGroqApi handles null message content safely');

      // Test Empty Content (F-03)
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: '    ' } }],
          }),
        };
      };

      let caughtEmptyContent = false;
      try {
        await callGroqApi({
          goal: goalA1,
          candidateResources: candidateList,
          progressMap: new Map(),
        });
      } catch (err) {
        caughtEmptyContent = true;
        assert(err.statusCode === 502, 'Empty message content maps to HTTP 502 Bad Gateway');
      }
      assert(caughtEmptyContent, 'callGroqApi handles empty message content safely');

      // Test Malformed JSON in Content (F-03)
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: '{"weeks": [ incomplete json...' } }],
          }),
        };
      };

      let caughtMalformedJson = false;
      try {
        await callGroqApi({
          goal: goalA1,
          candidateResources: candidateList,
          progressMap: new Map(),
        });
      } catch (err) {
        caughtMalformedJson = true;
        assert(err.statusCode === 502, 'Malformed JSON in content maps to HTTP 502 Bad Gateway');
      }
      assert(caughtMalformedJson, 'callGroqApi handles malformed content JSON safely');

      // Test Non-Object / Null JSON Literal in Content (F-03)
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'null' } }],
          }),
        };
      };

      let caughtNullLiteral = false;
      try {
        await callGroqApi({
          goal: goalA1,
          candidateResources: candidateList,
          progressMap: new Map(),
        });
      } catch (err) {
        caughtNullLiteral = true;
        assert(err.statusCode === 502, 'JSON "null" literal in content maps to HTTP 502 Bad Gateway');
      }
      assert(caughtNullLiteral, 'callGroqApi handles JSON "null" literal safely');

      // Test Malformed Plan Structure (missing weeks array) (F-03)
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: '{"notWeeks": []}' } }],
          }),
        };
      };

      let caughtMalformedStructure = false;
      try {
        await callGroqApi({
          goal: goalA1,
          candidateResources: candidateList,
          progressMap: new Map(),
        });
      } catch (err) {
        caughtMalformedStructure = true;
        assert(err.statusCode === 502, 'Missing weeks array in parsed plan maps to HTTP 502 Bad Gateway');
      }
      assert(caughtMalformedStructure, 'callGroqApi handles missing weeks array safely');

      // Test Plan Preservation on Upstream Failure: Existing plan is NOT overwritten
      console.log('Testing existing plan preservation on provider failure...');
      const existingPlanBefore = await LearningPlan.findById(createdPlanId);
      assert(existingPlanBefore !== null, 'Existing plan is present before failed generation attempt');

      // Simulate provider failure during generation
      globalThis.fetch = async (url, options) => {
        if (typeof url === 'string' && url.includes('groq.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              choices: [{ message: { content: '{"invalid": true}' } }],
            }),
          };
        }
        return originalFetch(url, options);
      };

      // Temporarily switch AI_PROVIDER to 'groq' to exercise full route pipeline
      process.env.AI_PROVIDER = 'groq';
      process.env.GROQ_API_KEY = 'gsk_test_mock_key';

      const resFailGen = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ goalId: goalA1._id.toString() }),
      });
      assert(resFailGen.status === 502, 'Upstream provider failure returns 502 Bad Gateway to client');

      // Verify existing plan in database remains completely intact and unmutated
      const existingPlanAfter = await LearningPlan.findById(createdPlanId);
      assert(existingPlanAfter !== null, 'Existing plan is still present after failed generation attempt');
      assert(
        existingPlanAfter._id.toString() === existingPlanBefore._id.toString(),
        'Existing plan ID is preserved'
      );
      assert(
        existingPlanAfter.weeks.length === existingPlanBefore.weeks.length,
        'Existing plan weeks count is preserved'
      );
      assert(
        existingPlanAfter.generatedAt.getTime() === existingPlanBefore.generatedAt.getTime(),
        'Existing plan generatedAt timestamp is NOT modified on failed generation'
      );
    } finally {
      globalThis.fetch = originalFetch;
      process.env.AI_PROVIDER = 'mock';
      delete process.env.GROQ_API_KEY;
    }

    // -------------------------------------------------------------------------
    // 12. User-Keyed Rate Limiting
    // -------------------------------------------------------------------------
    console.log('\n[Suite: User-Keyed Rate Limiting]');

    // Create a dedicated user for rate limit testing to avoid interfering with User A
    const rateLimitUser = await User.create({
      name: 'Rate Limit Test User',
      email: `rate_limit_user_${timestamp}@example.com`,
      passwordHash,
    });
    createdUserIds.add(rateLimitUser._id.toString());
    const rateLimitToken = generateToken(rateLimitUser._id);

    const rateLimitGoal = await LearningGoal.create({
      user: rateLimitUser._id,
      title: 'Rate Limit Goal',
      description: 'Goal to test 5 requests per 15 minutes limit.',
      targetSkills: ['React'],
      currentLevel: 'BEGINNER',
      weeklyHours: 5,
      status: 'ACTIVE',
    });
    createdGoalIds.add(rateLimitGoal._id.toString());

    // Send 5 successful generation requests for rateLimitUser
    console.log('Sending 5 plan generation requests within rate limit window...');
    for (let r = 1; r <= 5; r++) {
      const resRate = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rateLimitToken}`,
        },
        body: JSON.stringify({ goalId: rateLimitGoal._id.toString() }),
      });
      assert(resRate.status === 200, `Rate limit user generation request ${r}/5 returns 200 OK`);
    }

    // 6th generation request must be rate-limited with HTTP 429
    const resRate6 = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rateLimitToken}`,
      },
      body: JSON.stringify({ goalId: rateLimitGoal._id.toString() }),
    });
    assert(resRate6.status === 429, '6th generation request by rateLimitUser returns 429 Too Many Requests');
    const rate6Data = await resRate6.json();
    assert(rate6Data.success === false, 'Rate limit error response has success: false');
    assert(
      rate6Data.message.includes('rate limit reached'),
      'Rate limit response includes controlled explanation message'
    );

    // Verify User B is NOT rate-limited (proves user-keyed rate limiting rather than global/IP)
    const resUserBGen = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ goalId: goalB1._id.toString() }),
    });
    assert(
      resUserBGen.status === 200,
      'User B is not affected by rateLimitUser exhaustion (proves user-keyed rate limiting)'
    );
    const userBGenData = await resUserBGen.json();
    if (userBGenData.data?._id) {
      createdPlanIds.add(userBGenData.data._id);
    }

    // Verify GET /:id and GET /goal/:goalId are NOT subject to the generation rate limiter
    const resGetUnthrottled = await fetch(`${baseUrl}/goal/${rateLimitGoal._id.toString()}`, {
      headers: { Authorization: `Bearer ${rateLimitToken}` },
    });
    assert(
      resGetUnthrottled.status === 200,
      'GET /api/plans/goal/:goalId is not blocked by generation rate limiter'
    );

    console.log('\n' + '='.repeat(60));
    console.log(`AI Study Planner Test Summary: ${passedTests}/${totalTests} assertions passed.`);
    console.log('='.repeat(60));
    console.log('✓ All Study Planner API endpoints, validations, AI service mock, and security controls passed successfully.\n');
  } finally {
    // -------------------------------------------------------------------------
    // Narrowly Scoped Cleanup: Remove Only Records Created in This Run
    // -------------------------------------------------------------------------
    if (createdPlanIds.size > 0) {
      await LearningPlan.deleteMany({ _id: { $in: Array.from(createdPlanIds) } });
    }
    if (createdGoalIds.size > 0) {
      await LearningGoal.deleteMany({ _id: { $in: Array.from(createdGoalIds) } });
    }
    if (createdResourceIds.size > 0) {
      await Resource.deleteMany({ _id: { $in: Array.from(createdResourceIds) } });
    }
    if (createdUserIds.size > 0) {
      await User.deleteMany({ _id: { $in: Array.from(createdUserIds) } });
    }
    console.log('✓ Narrowly scoped cleanup completed for test records.');

    server.close();
    await mongoose.disconnect();
    console.log(`✓ Closed ephemeral server and disconnected cleanly from "${dbName}".`);
  }
};

runPlanTests().catch((err) => {
  console.error('\n❌ Fatal error in AI Study Planner API test suite:', err);
  process.exit(1);
});
