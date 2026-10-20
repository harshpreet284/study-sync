process.env.NODE_ENV = 'test';

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
const { LearningGoal } = await import('../models/LearningGoal.js');
const { generateToken } = await import('../utils/jwt.js');

console.log('='.repeat(60));
console.log('StudySync Learning Goals API Integration Test Suite');
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

const runGoalTests = async () => {
  // ---------------------------------------------------------------------------
  // Test Database Isolation Check
  // ---------------------------------------------------------------------------
  console.log('\n[Test Isolation Check]');

  // Strictly enforce isolated local test database on 127.0.0.1:27017 to protect remote Atlas
  const testUri = process.env.LOCAL_MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/studysync_test';
  process.env.MONGODB_TEST_URI = testUri;

  if (process.env.MONGODB_URI && testUri === process.env.MONGODB_URI) {
    console.error('\n❌ [TEST ABORTED] MONGODB_TEST_URI cannot be identical to development MONGODB_URI.');
    process.exitCode = 1;
    return;
  }

  // Refuse to connect to any non-local or remote Atlas database
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

  // Start ephemeral test server on an open random port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/goals`;

  const timestamp = Date.now();
  const createdUserIds = new Set();
  const createdGoalIds = new Set();

  try {
    // -------------------------------------------------------------------------
    // Setup Test Users: User A & User B
    // -------------------------------------------------------------------------
    console.log('\n[Setup: Test Users]');
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const userA = await User.create({
      name: 'Goal Learner A',
      email: `goal_user_a_${timestamp}@example.com`,
      passwordHash,
    });
    createdUserIds.add(userA._id.toString());
    const tokenA = generateToken(userA._id);

    const userB = await User.create({
      name: 'Goal Learner B',
      email: `goal_user_b_${timestamp}@example.com`,
      passwordHash,
    });
    createdUserIds.add(userB._id.toString());
    const tokenB = generateToken(userB._id);

    console.log(`✓ Created test User A (${userA.email}) and User B (${userB.email})`);

    // -------------------------------------------------------------------------
    // 1. Unauthenticated Access to Every Endpoint
    // -------------------------------------------------------------------------
    console.log('\n[Test 1: Unauthenticated Access Rejections]');
    const dummyId = new mongoose.Types.ObjectId().toString();

    // GET /api/goals
    const resUnauthGet = await fetch(baseUrl);
    assert(resUnauthGet.status === 401, 'Unauthenticated GET /api/goals returns 401 Unauthorized');

    // POST /api/goals
    const resUnauthPost = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My Goal' }),
    });
    assert(resUnauthPost.status === 401, 'Unauthenticated POST /api/goals returns 401 Unauthorized');

    // GET /api/goals/:id
    const resUnauthGetById = await fetch(`${baseUrl}/${dummyId}`);
    assert(resUnauthGetById.status === 401, 'Unauthenticated GET /api/goals/:id returns 401 Unauthorized');

    // PATCH /api/goals/:id
    const resUnauthPatch = await fetch(`${baseUrl}/${dummyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    assert(resUnauthPatch.status === 401, 'Unauthenticated PATCH /api/goals/:id returns 401 Unauthorized');

    // DELETE /api/goals/:id
    const resUnauthDelete = await fetch(`${baseUrl}/${dummyId}`, {
      method: 'DELETE',
    });
    assert(resUnauthDelete.status === 401, 'Unauthenticated DELETE /api/goals/:id returns 401 Unauthorized');

    // -------------------------------------------------------------------------
    // 2. Empty Goals List for User with No Goals
    // -------------------------------------------------------------------------
    console.log('\n[Test 2: Empty Goals List Clean Return]');
    const resEmptyList = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const emptyListData = await resEmptyList.json();
    assert(resEmptyList.status === 200, 'GET /api/goals returns 200 OK for new user');
    assert(emptyListData.success === true, 'Response contains success: true');
    assert(Array.isArray(emptyListData.data), 'Response data is an array');
    assert(emptyListData.data.length === 0, 'Response data is an empty array');
    assert(emptyListData.count === 0, 'Response count is 0');

    // -------------------------------------------------------------------------
    // 3. Validation on Goal Creation (POST /api/goals)
    // -------------------------------------------------------------------------
    console.log('\n[Test 3: Creation Input Validation]');

    // Missing title
    const resMissingTitle = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ description: 'No title' }),
    });
    const missingTitleData = await resMissingTitle.json();
    assert(resMissingTitle.status === 400, 'POST /api/goals without title returns 400');
    assert(missingTitleData.message.includes('title is required'), 'Error explains title is required');

    // Empty/whitespace-only title
    const resEmptyTitle = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: '   ' }),
    });
    assert(resEmptyTitle.status === 400, 'POST /api/goals with whitespace-only title returns 400');

    // Title too long (>200 chars)
    const resLongTitle = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'A'.repeat(201) }),
    });
    assert(resLongTitle.status === 400, 'POST /api/goals with title > 200 characters returns 400');

    // Description too long (>2000 chars)
    const resLongDesc = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', description: 'B'.repeat(2001) }),
    });
    assert(resLongDesc.status === 400, 'POST /api/goals with description > 2000 characters returns 400');

    // Non-array targetSkills
    const resInvalidSkillsType = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', targetSkills: 'React, Node' }),
    });
    assert(resInvalidSkillsType.status === 400, 'POST /api/goals with non-array targetSkills returns 400');

    // targetSkills with invalid items (empty string)
    const resInvalidSkillItem = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', targetSkills: ['React', '  '] }),
    });
    assert(resInvalidSkillItem.status === 400, 'POST /api/goals with empty skill item returns 400');

    // Invalid currentLevel enum
    const resInvalidLevel = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', currentLevel: 'SUPER_HERO' }),
    });
    assert(resInvalidLevel.status === 400, 'POST /api/goals with invalid currentLevel returns 400');

    // Null currentLevel rejected
    const resNullLevel = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', currentLevel: null }),
    });
    assert(resNullLevel.status === 400, 'POST /api/goals with null currentLevel returns 400');

    // Invalid weeklyHours: less than 1
    const resZeroWeeklyHours = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', weeklyHours: 0 }),
    });
    assert(resZeroWeeklyHours.status === 400, 'POST /api/goals with weeklyHours < 1 returns 400');

    // Invalid weeklyHours: greater than 168
    const resHugeWeeklyHours = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', weeklyHours: 200 }),
    });
    assert(resHugeWeeklyHours.status === 400, 'POST /api/goals with weeklyHours > 168 returns 400');

    // Invalid weeklyHours: non-number
    const resStringWeeklyHours = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', weeklyHours: 'ten' }),
    });
    assert(resStringWeeklyHours.status === 400, 'POST /api/goals with non-numeric weeklyHours returns 400');

    // Invalid targetDate: unparseable string
    const resInvalidDate = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', targetDate: 'not-a-valid-date' }),
    });
    assert(resInvalidDate.status === 400, 'POST /api/goals with invalid targetDate returns 400');

    // Invalid targetDate: boolean true
    const resBoolTrueDate = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', targetDate: true }),
    });
    assert(resBoolTrueDate.status === 400, 'POST /api/goals with boolean targetDate returns 400');

    // Invalid targetDate: numeric timestamp
    const resNumDate = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', targetDate: 12345 }),
    });
    assert(resNumDate.status === 400, 'POST /api/goals with numeric targetDate returns 400');

    // Invalid targetDate: empty string
    const resEmptyDate = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', targetDate: '' }),
    });
    assert(resEmptyDate.status === 400, 'POST /api/goals with empty string targetDate returns 400');

    // Invalid targetDate: impossible calendar date (2026-02-31)
    const resFeb31 = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', targetDate: '2026-02-31' }),
    });
    assert(resFeb31.status === 400, 'POST /api/goals with impossible calendar date (2026-02-31) returns 400');

    // Invalid targetDate: impossible calendar date (2026-04-31)
    const resApr31 = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', targetDate: '2026-04-31' }),
    });
    assert(resApr31.status === 400, 'POST /api/goals with impossible calendar date (2026-04-31) returns 400');

    // Invalid status enum
    const resInvalidStatus = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', status: 'PAUSED' }),
    });
    assert(resInvalidStatus.status === 400, 'POST /api/goals with invalid status returns 400');

    // Null status rejected
    const resNullStatus = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Valid Title', status: null }),
    });
    assert(resNullStatus.status === 400, 'POST /api/goals with null status returns 400');

    // -------------------------------------------------------------------------
    // 4. Valid Goal Creation with Defaults, Deduplication & Full Fields
    // -------------------------------------------------------------------------
    console.log('\n[Test 4: Valid Goal Creation & Defaults]');

    // 4a. Minimal goal (default fields applied)
    const resCreateMinimal = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Learn JavaScript Fundamentals',
      }),
    });
    const minGoalData = await resCreateMinimal.json();
    assert(resCreateMinimal.status === 201, 'POST /api/goals with minimal valid body returns 201 Created');
    assert(minGoalData.success === true, 'Response indicates success: true');
    assert(minGoalData.data.title === 'Learn JavaScript Fundamentals', 'Goal title matches');
    assert(minGoalData.data.currentLevel === 'BEGINNER', 'Default currentLevel is BEGINNER');
    assert(minGoalData.data.weeklyHours === 5, 'Default weeklyHours is 5');
    assert(minGoalData.data.status === 'ACTIVE', 'Default status is ACTIVE');
    assert(minGoalData.data.targetDate === null, 'Default targetDate is null');
    assert(Array.isArray(minGoalData.data.targetSkills) && minGoalData.data.targetSkills.length === 0, 'Default targetSkills is []');
    assert(minGoalData.data.user === userA._id.toString(), 'Goal user is derived strictly from JWT, not body');
    const goalA1Id = minGoalData.data._id;
    createdGoalIds.add(goalA1Id);

    // 4b. Full goal with all supported fields, deduplicated skills, and ISO date
    const targetDateStr = '2026-11-30T00:00:00.000Z';
    const resCreateFull = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Master Full-Stack TypeScript',
        description: 'Comprehensive study plan for React and Node with TypeScript',
        targetSkills: [' TypeScript ', 'React', 'typescript', 'Node.js', 'REACT', 'Express', 'Node.JS'],
        currentLevel: 'intermediate', // case-insensitive check
        weeklyHours: 12,
        targetDate: targetDateStr,
        status: 'active',
      }),
    });
    const fullGoalData = await resCreateFull.json();
    assert(resCreateFull.status === 201, 'POST /api/goals with full body returns 201 Created');
    assert(fullGoalData.data.title === 'Master Full-Stack TypeScript', 'Full goal title matches');
    assert(fullGoalData.data.description === 'Comprehensive study plan for React and Node with TypeScript', 'Description matches');
    assert(fullGoalData.data.currentLevel === 'INTERMEDIATE', 'Level normalized to INTERMEDIATE');
    assert(fullGoalData.data.weeklyHours === 12, 'weeklyHours is 12');
    assert(new Date(fullGoalData.data.targetDate).toISOString() === targetDateStr, 'targetDate matches');
    // Deduplication check: ' TypeScript ', 'React', 'typescript', 'Node.js', 'REACT', 'Express', 'Node.JS' -> ['TypeScript', 'React', 'Node.js', 'Express']
    assert(fullGoalData.data.targetSkills.length === 4, 'targetSkills deduplicated to 4 unique skills');
    assert(JSON.stringify(fullGoalData.data.targetSkills) === JSON.stringify(['TypeScript', 'React', 'Node.js', 'Express']), 'targetSkills preserves original casing and order');
    assert(fullGoalData.data.status === 'ACTIVE', 'Status is ACTIVE');
    const goalA2Id = fullGoalData.data._id;
    createdGoalIds.add(goalA2Id);

    // 4c. Goal with date-only string format (YYYY-MM-DD)
    const resDateOnlyGoal = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Date Only Format Goal',
        targetDate: '2026-12-01',
      }),
    });
    const dateOnlyData = await resDateOnlyGoal.json();
    assert(resDateOnlyGoal.status === 201, 'POST /api/goals accepts YYYY-MM-DD date-only string');
    assert(dateOnlyData.data.targetDate !== null, 'targetDate is parsed to Date object');
    createdGoalIds.add(dateOnlyData.data._id);

    // 4d. Goal with valid leap year date (2024-02-29)
    const resLeapGoal = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Leap Year Valid Date Goal',
        targetDate: '2024-02-29',
      }),
    });
    assert(resLeapGoal.status === 201, 'POST /api/goals accepts valid leap year date (2024-02-29)');
    const leapData = await resLeapGoal.json();
    createdGoalIds.add(leapData.data._id);

    // -------------------------------------------------------------------------
    // 5. Protected Field Tampering on Goal Creation
    // -------------------------------------------------------------------------
    console.log('\n[Test 5: Protected Field Tampering Guard (POST)]');
    const maliciousUserId = new mongoose.Types.ObjectId().toString();
    const maliciousGoalId = new mongoose.Types.ObjectId().toString();

    const resTamperPost = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        _id: maliciousGoalId,
        user: maliciousUserId,
        title: 'Tamper Attempt Goal',
        createdAt: '2020-01-01T00:00:00.000Z',
      }),
    });
    const tamperData = await resTamperPost.json();
    assert(resTamperPost.status === 201, 'POST /api/goals creates goal successfully without honoring tampered fields');
    assert(tamperData.data.user === userA._id.toString(), 'user is forced to authenticated user ID, ignoring injected user');
    assert(tamperData.data._id !== maliciousGoalId, '_id is generated by MongoDB, ignoring injected _id');
    const goalA3Id = tamperData.data._id;
    createdGoalIds.add(goalA3Id);

    // -------------------------------------------------------------------------
    // 6. List User Goals (GET /api/goals) with Isolation & Filter
    // -------------------------------------------------------------------------
    console.log('\n[Test 6: Listing Goals & User Isolation]');

    // Create a goal for User B
    const resCreateUserBGoal = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: "User B's Private Goal",
        status: 'COMPLETED',
      }),
    });
    const userBGoalData = await resCreateUserBGoal.json();
    assert(resCreateUserBGoal.status === 201, 'Created goal for User B');
    const goalB1Id = userBGoalData.data._id;
    createdGoalIds.add(goalB1Id);

    // User A fetches their goals
    const resUserAList = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const userAListData = await resUserAList.json();
    assert(resUserAList.status === 200, 'GET /api/goals for User A returns 200 OK');
    assert(userAListData.count === 5, 'User A sees exactly their 5 goals');
    const userAGoalIds = userAListData.data.map((g) => g._id);
    assert(userAGoalIds.includes(goalA1Id), 'Includes Goal A1');
    assert(userAGoalIds.includes(goalA2Id), 'Includes Goal A2');
    assert(userAGoalIds.includes(goalA3Id), 'Includes Goal A3');
    assert(!userAGoalIds.includes(goalB1Id), 'User A CANNOT see User B goal');

    // Status filter testing: User A status=ACTIVE
    const resFilterActive = await fetch(`${baseUrl}?status=ACTIVE`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const filterActiveData = await resFilterActive.json();
    assert(resFilterActive.status === 200, 'GET /api/goals?status=ACTIVE returns 200');
    assert(filterActiveData.data.every((g) => g.status === 'ACTIVE'), 'All returned goals have status ACTIVE');

    // Invalid status filter query param
    const resInvalidFilter = await fetch(`${baseUrl}?status=INVALID_STATUS`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resInvalidFilter.status === 400, 'GET /api/goals with invalid status query returns 400');

    // -------------------------------------------------------------------------
    // 7. Get Single Goal by ID (GET /api/goals/:id)
    // -------------------------------------------------------------------------
    console.log('\n[Test 7: Get Single Goal by ID & Ownership Enforcement]');

    // Invalid ObjectId format -> 400
    const resMalformedId = await fetch(`${baseUrl}/not-a-valid-object-id`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resMalformedId.status === 400, 'GET /api/goals/malformed-id returns 400 Bad Request');

    // Nonexistent valid ObjectId -> 404
    const nonexistentId = new mongoose.Types.ObjectId().toString();
    const resNotFoundId = await fetch(`${baseUrl}/${nonexistentId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resNotFoundId.status === 404, 'GET /api/goals/nonexistent-id returns 404 Not Found');

    // Valid owned goal -> 200
    const resGetOwned = await fetch(`${baseUrl}/${goalA2Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getOwnedData = await resGetOwned.json();
    assert(resGetOwned.status === 200, 'GET /api/goals/:id for owned goal returns 200 OK');
    assert(getOwnedData.data._id === goalA2Id, 'Returned goal ID matches');
    assert(getOwnedData.data.title === 'Master Full-Stack TypeScript', 'Returned goal title matches');

    // Cross-user access attempt: User B trying to access User A's goal -> 404 (does not leak existence)
    const resCrossUserGet = await fetch(`${baseUrl}/${goalA2Id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resCrossUserGet.status === 404, 'User B GET /api/goals/:goalA returns 404 Not Found (ownership enforced)');

    // -------------------------------------------------------------------------
    // 8. Update Goal (PATCH /api/goals/:id)
    // -------------------------------------------------------------------------
    console.log('\n[Test 8: Goal Update Validation & Ownership]');

    // 8a. Empty body -> 400
    const resEmptyPatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({}),
    });
    assert(resEmptyPatch.status === 400, 'PATCH with empty body returns 400');

    // 8b. Only unknown / disallowed fields -> 400
    const resUnknownFieldsPatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ unknownField: 'test', anotherDisallowed: 123 }),
    });
    assert(resUnknownFieldsPatch.status === 400, 'PATCH with only unknown fields returns 400');

    // 8c. Field validation: Empty string title -> 400
    const resEmptyTitlePatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: '   ' }),
    });
    assert(resEmptyTitlePatch.status === 400, 'PATCH with whitespace-only title returns 400');

    // 8d. Field validation: Invalid weeklyHours -> 400
    const resInvalidHoursPatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ weeklyHours: 0 }),
    });
    assert(resInvalidHoursPatch.status === 400, 'PATCH with weeklyHours < 1 returns 400');

    // 8e. Field validation: Invalid status enum -> 400
    const resInvalidStatusPatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ status: 'ABANDONED' }),
    });
    assert(resInvalidStatusPatch.status === 400, 'PATCH with invalid status returns 400');

    // 8f. Fix L-04: Reject null currentLevel in PATCH -> 400
    const resNullLevelPatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ currentLevel: null }),
    });
    assert(resNullLevelPatch.status === 400, 'PATCH with currentLevel: null returns 400');

    // 8g. Fix L-04: Reject null status in PATCH -> 400
    const resNullStatusPatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ status: null }),
    });
    assert(resNullStatusPatch.status === 400, 'PATCH with status: null returns 400');

    // 8h. Fix L-02: Reject boolean/number/impossible date in PATCH
    const resBoolDatePatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ targetDate: true }),
    });
    assert(resBoolDatePatch.status === 400, 'PATCH with boolean targetDate returns 400');

    const resNumDatePatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ targetDate: 999999 }),
    });
    assert(resNumDatePatch.status === 400, 'PATCH with numeric targetDate returns 400');

    const resEmptyDatePatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ targetDate: '' }),
    });
    assert(resEmptyDatePatch.status === 400, 'PATCH with empty string targetDate returns 400');

    const resFeb31Patch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ targetDate: '2026-02-31' }),
    });
    assert(resFeb31Patch.status === 400, 'PATCH with impossible calendar date (2026-02-31) returns 400');

    // 8i. Fix L-02: Clear targetDate by passing null
    const resClearDatePatch = await fetch(`${baseUrl}/${goalA2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ targetDate: null }),
    });
    const clearDateData = await resClearDatePatch.json();
    assert(resClearDatePatch.status === 200, 'PATCH with targetDate: null returns 200 OK');
    assert(clearDateData.data.targetDate === null, 'targetDate was successfully cleared to null');

    // 8j. Fix L-03: Deduplicate targetSkills in PATCH
    const resDedupeSkillsPatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        targetSkills: [' Python ', 'Django', 'python', 'PYTHON', 'PostgreSQL', 'django'],
      }),
    });
    const dedupeSkillsData = await resDedupeSkillsPatch.json();
    assert(resDedupeSkillsPatch.status === 200, 'PATCH with targetSkills returns 200 OK');
    assert(dedupeSkillsData.data.targetSkills.length === 3, 'targetSkills deduplicated to 3 skills in PATCH');
    assert(JSON.stringify(dedupeSkillsData.data.targetSkills) === JSON.stringify(['Python', 'Django', 'PostgreSQL']), 'Preserved original order and first casing in PATCH');

    // 8k. Valid partial update of title and status
    const resValidUpdate1 = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Master Advanced JavaScript and Async Patterns',
        status: 'COMPLETED',
      }),
    });
    const update1Data = await resValidUpdate1.json();
    assert(resValidUpdate1.status === 200, 'PATCH with valid title & status returns 200 OK');
    assert(update1Data.data.title === 'Master Advanced JavaScript and Async Patterns', 'Updated title persists');
    assert(update1Data.data.status === 'COMPLETED', 'Updated status is COMPLETED');

    // 8l. Protected field tampering in PATCH: attempt to reassign user or _id
    const resTamperPatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Safe Title Update',
        user: userB._id.toString(),
        _id: new mongoose.Types.ObjectId().toString(),
      }),
    });
    const tamperPatchData = await resTamperPatch.json();
    assert(resTamperPatch.status === 200, 'PATCH succeeds updating allowed fields');
    assert(tamperPatchData.data.user === userA._id.toString(), 'user cannot be changed via PATCH');
    assert(tamperPatchData.data._id === goalA1Id, '_id cannot be changed via PATCH');
    assert(tamperPatchData.data.title === 'Safe Title Update', 'Allowed title field was updated');

    // 8m. Cross-user update attempt: User B trying to PATCH User A's goal -> 404
    const resCrossUserPatch = await fetch(`${baseUrl}/${goalA1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: 'Malicious Overwrite by User B',
      }),
    });
    assert(resCrossUserPatch.status === 404, 'User B PATCH /api/goals/:goalA returns 404 Not Found (ownership enforced)');

    // Verify User A's goal was NOT modified by User B's attempt
    const resVerifyUnchanged = await fetch(`${baseUrl}/${goalA1Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const unchangedData = await resVerifyUnchanged.json();
    assert(unchangedData.data.title === 'Safe Title Update', "User A's goal remains intact after cross-user attempt");

    // -------------------------------------------------------------------------
    // 9. Delete Goal (DELETE /api/goals/:id)
    // -------------------------------------------------------------------------
    console.log('\n[Test 9: Goal Deletion & Ownership]');

    // Cross-user delete attempt: User B trying to DELETE User A's goal -> 404
    const resCrossUserDelete = await fetch(`${baseUrl}/${goalA3Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resCrossUserDelete.status === 404, 'User B DELETE /api/goals/:goalA returns 404 Not Found (ownership enforced)');

    // User A deletes their own goal -> 200
    const resOwnerDelete = await fetch(`${baseUrl}/${goalA3Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resOwnerDelete.status === 200, 'User A DELETE /api/goals/:goalA returns 200 OK');
    createdGoalIds.delete(goalA3Id);

    // Verify deletion: fetching it again returns 404
    const resGetDeleted = await fetch(`${baseUrl}/${goalA3Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resGetDeleted.status === 404, 'GET on deleted goal returns 404 Not Found');

    console.log('\n' + '='.repeat(60));
    console.log(`Learning Goals API Test Summary: ${passedTests}/${totalTests} assertions passed.`);
    console.log('='.repeat(60));
    console.log('✓ All learning goals API endpoints, validations, and ownership controls passed successfully.\n');
  } finally {
    // -------------------------------------------------------------------------
    // Narrowly Scoped Cleanup: Remove Only Records Created in This Run
    // -------------------------------------------------------------------------
    if (createdGoalIds.size > 0) {
      await LearningGoal.deleteMany({ _id: { $in: Array.from(createdGoalIds) } });
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

runGoalTests().catch((err) => {
  console.error('\n❌ Fatal error in Learning Goals API test suite:', err);
  process.exit(1);
});
