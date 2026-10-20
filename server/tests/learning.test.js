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
const { Resource } = await import('../models/Resource.js');
const { LearningProgress } = await import('../models/LearningProgress.js');
const { generateToken } = await import('../utils/jwt.js');

console.log('='.repeat(60));
console.log('StudySync Personal Learning API Integration Test Suite');
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

const runLearningTests = async () => {
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
  const baseUrl = `http://127.0.0.1:${port}/api/learning`;

  const timestamp = Date.now();
  const createdUserIds = new Set();
  const createdResourceIds = new Set();
  const createdLearningIds = new Set();

  try {
    // -------------------------------------------------------------------------
    // Setup Test Fixtures: Two Distinct Users & Two Resources
    // -------------------------------------------------------------------------
    console.log('\n[Setup: Test Users & Catalog Resources]');
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const userA = await User.create({
      name: 'Learner Alpha',
      email: `learner_a_${timestamp}@example.com`,
      passwordHash,
    });
    createdUserIds.add(userA._id.toString());
    const tokenA = generateToken(userA._id);

    const userB = await User.create({
      name: 'Learner Beta',
      email: `learner_b_${timestamp}@example.com`,
      passwordHash,
    });
    createdUserIds.add(userB._id.toString());
    const tokenB = generateToken(userB._id);

    const resDoc1 = await Resource.create({
      sourceId: 80001,
      title: `Node.js Mastery [${timestamp}]`,
      description: 'Comprehensive backend engineering course',
      type: 'COURSE',
      platform: 'OpenCourse',
      url: 'https://example.com/nodejs-mastery',
      category: 'Web Development',
      difficulty: 'INTERMEDIATE',
      estimatedDuration: 0,
      skills: ['Node.js', 'Express', 'Backend'],
      instructor: '',
      rating: 0,
    });
    createdResourceIds.add(resDoc1._id.toString());

    const resDoc2 = await Resource.create({
      sourceId: 80002,
      title: `Advanced MongoDB [${timestamp}]`,
      description: 'Aggregation pipelines and indexing internals',
      type: 'DOCUMENTATION',
      platform: 'MongoDoc',
      url: 'https://example.com/mongodb-advanced',
      category: 'Data Science',
      difficulty: 'ADVANCED',
      estimatedDuration: 0,
      skills: ['MongoDB', 'Database'],
      instructor: '',
      rating: 0,
    });
    createdResourceIds.add(resDoc2._id.toString());

    console.log('✓ Created 2 isolated test users and 2 catalog resources.');

    // -------------------------------------------------------------------------
    // Suite 1: Authentication Enforcement
    // -------------------------------------------------------------------------
    console.log('\n[Suite 1: Authentication Requirement on All Endpoints]');
    {
      const fakeId = new mongoose.Types.ObjectId();

      const getRes = await fetch(baseUrl);
      assert(getRes.status === 401, 'GET /api/learning rejects unauthenticated request with 401');

      const postRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: resDoc1._id }),
      });
      assert(postRes.status === 401, 'POST /api/learning rejects unauthenticated request with 401');

      const patchRes = await fetch(`${baseUrl}/${fakeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: 50 }),
      });
      assert(patchRes.status === 401, 'PATCH /api/learning/:id rejects unauthenticated request with 401');

      const deleteRes = await fetch(`${baseUrl}/${fakeId}`, {
        method: 'DELETE',
      });
      assert(deleteRes.status === 401, 'DELETE /api/learning/:id rejects unauthenticated request with 401');
    }

    // -------------------------------------------------------------------------
    // Suite 2: Empty Library Retrieval
    // -------------------------------------------------------------------------
    console.log('\n[Suite 2: Empty Library Clean Response]');
    {
      const res = await fetch(baseUrl, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'GET /api/learning returns 200 for empty library');
      assert(data.success === true, 'Response has success: true');
      assert(data.count === 0, 'Response count is 0');
      assert(Array.isArray(data.data) && data.data.length === 0, 'Response data is empty array');
    }

    // -------------------------------------------------------------------------
    // Suite 3: Adding Resources to Personal Learning Library (POST /api/learning)
    // -------------------------------------------------------------------------
    console.log('\n[Suite 3: Add Resource & Input Validation]');
    let recordA1Id = '';
    let recordA2Id = '';
    {
      // 1. Missing resourceId
      const resMissing = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const dataMissing = await resMissing.json();
      assert(resMissing.status === 400, 'POST rejects missing resourceId with 400');
      assert(dataMissing.success === false, 'Error response has success: false');

      // 2. Malformed resourceId
      const resMalformed = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId: 'invalid-non-numeric-id' }),
      });
      assert(resMalformed.status === 400, 'POST rejects malformed resourceId format with 400');

      // 3. Non-existent resource ID (valid ObjectId format, but not in DB)
      const nonExistentId = new mongoose.Types.ObjectId();
      const resNonExistent = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId: nonExistentId.toString() }),
      });
      assert(resNonExistent.status === 404, 'POST rejects non-existent resource ID with 404 Not Found');

      // 4. Valid addition using MongoDB ObjectId
      const resAdd1 = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId: resDoc1._id.toString() }),
      });
      const dataAdd1 = await resAdd1.json();
      assert(resAdd1.status === 201, 'POST /api/learning returns 201 Created for valid resource');
      assert(dataAdd1.success === true, 'Response indicates success: true');
      assert(dataAdd1.data.status === 'NOT_STARTED', 'Initial status defaults to NOT_STARTED');
      assert(dataAdd1.data.progress === 0, 'Initial progress defaults to 0');
      assert(dataAdd1.data.startedAt === null, 'Initial startedAt defaults to null');
      assert(dataAdd1.data.completedAt === null, 'Initial completedAt defaults to null');
      assert(dataAdd1.data.resource._id === resDoc1._id.toString(), 'Response populates referenced resource');
      recordA1Id = dataAdd1.data._id;
      createdLearningIds.add(recordA1Id);

      // 5. Valid addition using numeric sourceId
      const resAdd2 = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId: 80002 }),
      });
      const dataAdd2 = await resAdd2.json();
      assert(resAdd2.status === 201, 'POST /api/learning accepts numeric sourceId and returns 201');
      assert(dataAdd2.data.resource._id === resDoc2._id.toString(), 'Correctly resolves sourceId to Resource document');
      recordA2Id = dataAdd2.data._id;
      createdLearningIds.add(dataAdd2.data._id);

      // 6. Duplicate addition rejection (same user + same resource)
      const resDupe = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId: resDoc1._id.toString() }),
      });
      const dataDupe = await resDupe.json();
      assert(resDupe.status === 409, 'Duplicate addition attempt is rejected with 409 Conflict');
      assert(dataDupe.success === false, 'Duplicate response indicates success: false');
      assert(dataDupe.message.includes('already in your learning library'), 'Helpful error message returned on duplicate');
    }

    // -------------------------------------------------------------------------
    // Suite 4: User Ownership & Cross-User Isolation
    // -------------------------------------------------------------------------
    console.log('\n[Suite 4: Ownership Isolation & Multi-User Partitioning]');
    let recordB1Id = '';
    {
      // User A lists their records (should have exactly 2)
      const resListA = await fetch(baseUrl, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const dataListA = await resListA.json();
      assert(resListA.status === 200, 'User A can retrieve their library');
      assert(dataListA.count === 2, 'User A has exactly 2 records');
      assert(dataListA.data.every((r) => r.user === userA._id.toString()), 'All records belong to User A');

      // User B lists their records (should have 0 initially)
      const resListBEmpty = await fetch(baseUrl, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      const dataListBEmpty = await resListBEmpty.json();
      assert(dataListBEmpty.count === 0, 'User B initially has 0 records (isolated from User A)');

      // User B adds the same resource (resDoc1) - should succeed because it is a different user
      const resAddB = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceId: resDoc1._id.toString() }),
      });
      const dataAddB = await resAddB.json();
      assert(resAddB.status === 201, 'User B can add the same resource to their own independent library');
      recordB1Id = dataAddB.data._id;
      createdLearningIds.add(recordB1Id);
      assert(recordB1Id !== recordA1Id, 'User B receives a distinct LearningProgress record ID');

      // User B lists library - should have exactly 1 record
      const resListB = await fetch(baseUrl, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      const dataListB = await resListB.json();
      assert(dataListB.count === 1, 'User B library lists only their own record');
      assert(dataListB.data[0]._id === recordB1Id, 'User B record matches recordB1Id');
    }

    // -------------------------------------------------------------------------
    // Suite 5: Progress & Status Updates (PATCH /api/learning/:id)
    // -------------------------------------------------------------------------
    console.log('\n[Suite 5: Progress/Status Updates & Timestamp Automations]');
    {
      // 1. Invalid ID format
      const resBadId = await fetch(`${baseUrl}/not-a-mongo-id`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: 25 }),
      });
      assert(resBadId.status === 400, 'PATCH with malformed record ID returns 400');

      // 2. Empty payload
      const resEmpty = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      assert(resEmpty.status === 400, 'PATCH with empty body returns 400 Bad Request');

      // 3. Progress < 0
      const resNeg = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: -10 }),
      });
      assert(resNeg.status === 400, 'PATCH with negative progress returns 400');

      // 4. Progress > 100
      const resOver = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: 105 }),
      });
      assert(resOver.status === 400, 'PATCH with progress > 100 returns 400');

      // 5. Invalid progress type (string / NaN)
      const resStrProg = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: 'halfway' }),
      });
      assert(resStrProg.status === 400, 'PATCH with non-number progress returns 400');

      // 6. Invalid status enum
      const resBadStatus = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ABANDONED' }),
      });
      assert(resBadStatus.status === 400, 'PATCH with invalid status enum returns 400');

      // 7. Valid progress update: setting progress to 40%
      const resUpdateProg = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: 40 }),
      });
      const dataUpdateProg = await resUpdateProg.json();
      assert(resUpdateProg.status === 200, 'PATCH with valid progress returns 200 OK');
      assert(dataUpdateProg.data.progress === 40, 'Progress successfully updated to 40');
      assert(dataUpdateProg.data.status === 'IN_PROGRESS', 'Status automatically transitions to IN_PROGRESS when progress > 0');
      assert(dataUpdateProg.data.startedAt !== null, 'startedAt timestamp automatically set');
      assert(dataUpdateProg.data.completedAt === null, 'completedAt remains null while in progress');

      // 8. Valid status update: setting status to COMPLETED
      const resComplete = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const dataComplete = await resComplete.json();
      assert(resComplete.status === 200, 'PATCH with status COMPLETED returns 200 OK');
      assert(dataComplete.data.status === 'COMPLETED', 'Status updated to COMPLETED');
      assert(dataComplete.data.progress === 100, 'Progress automatically set to 100 on COMPLETED');
      assert(dataComplete.data.completedAt !== null, 'completedAt timestamp automatically recorded');

      // 9. Status transition back to IN_PROGRESS: resets completedAt
      const resReopen = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'IN_PROGRESS', progress: 80 }),
      });
      const dataReopen = await resReopen.json();
      assert(resReopen.status === 200, 'PATCH reopening course returns 200');
      assert(dataReopen.data.status === 'IN_PROGRESS', 'Status is IN_PROGRESS');
      assert(dataReopen.data.progress === 80, 'Progress updated to 80');
      assert(dataReopen.data.completedAt === null, 'completedAt is cleared when returning to IN_PROGRESS');

      // 10. Contradictory: status COMPLETED with progress < 100
      const resContra1 = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED', progress: 40 }),
      });
      const dataContra1 = await resContra1.json();
      assert(resContra1.status === 400, 'PATCH rejects status COMPLETED with progress < 100 with 400');
      assert(dataContra1.message.includes('COMPLETED with progress below 100'), 'Error message clarifies COMPLETED progress contradiction');

      // 11. Contradictory: status NOT_STARTED with progress > 0
      const resContra2 = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'NOT_STARTED', progress: 40 }),
      });
      const dataContra2 = await resContra2.json();
      assert(resContra2.status === 400, 'PATCH rejects status NOT_STARTED with progress > 0 with 400');
      assert(dataContra2.message.includes('NOT_STARTED with progress above 0'), 'Error message clarifies NOT_STARTED progress contradiction');

      // 12. Contradictory: progress 100 with status IN_PROGRESS
      const resContra3 = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: 100, status: 'IN_PROGRESS' }),
      });
      const dataContra3 = await resContra3.json();
      assert(resContra3.status === 400, 'PATCH rejects progress 100 with status IN_PROGRESS with 400');
      assert(dataContra3.message.includes('Cannot set status to IN_PROGRESS with progress of 100'), 'Error message clarifies 100% IN_PROGRESS contradiction');

      // 13. Contradictory: progress 100 with status NOT_STARTED
      const resContra4 = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: 100, status: 'NOT_STARTED' }),
      });
      const dataContra4 = await resContra4.json();
      assert(resContra4.status === 400, 'PATCH rejects progress 100 with status NOT_STARTED with 400');
      assert(dataContra4.message.includes('Cannot set status to NOT_STARTED'), 'Error message clarifies NOT_STARTED contradiction');

      // 14. Valid partial update: status IN_PROGRESS alone preserves progress 0 and sets startedAt
      const resPartialProg = await fetch(`${baseUrl}/${recordA2Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      const dataPartialProg = await resPartialProg.json();
      assert(resPartialProg.status === 200, 'PATCH with status IN_PROGRESS alone returns 200');
      assert(dataPartialProg.data.status === 'IN_PROGRESS', 'Status updated to IN_PROGRESS');
      assert(dataPartialProg.data.progress === 0, 'Existing progress 0 is preserved');
      assert(dataPartialProg.data.startedAt !== null, 'startedAt timestamp initialized');
      assert(dataPartialProg.data.completedAt === null, 'completedAt remains null');

      // 15. Valid partial update: progress 100 alone marks completed
      const resProg100 = await fetch(`${baseUrl}/${recordA2Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: 100 }),
      });
      const dataProg100 = await resProg100.json();
      assert(resProg100.status === 200, 'PATCH with progress 100 alone returns 200');
      assert(dataProg100.data.status === 'COMPLETED', 'Status automatically transitions to COMPLETED');
      assert(dataProg100.data.progress === 100, 'Progress is 100');
      assert(dataProg100.data.completedAt !== null, 'completedAt timestamp recorded');

      // 16. Valid reset: status NOT_STARTED with progress 0
      const resReset = await fetch(`${baseUrl}/${recordA2Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'NOT_STARTED', progress: 0 }),
      });
      const dataReset = await resReset.json();
      assert(resReset.status === 200, 'PATCH resetting to NOT_STARTED and 0 progress returns 200');
      assert(dataReset.data.status === 'NOT_STARTED', 'Status reset to NOT_STARTED');
      assert(dataReset.data.progress === 0, 'Progress reset to 0');
      assert(dataReset.data.startedAt === null, 'startedAt reset to null');
      assert(dataReset.data.completedAt === null, 'completedAt reset to null');
    }

    // -------------------------------------------------------------------------
    // Suite 6: Cross-User Authorization Enforcement
    // -------------------------------------------------------------------------
    console.log('\n[Suite 6: Cross-User Unauthorized Mutation Guard]');
    {
      // User B attempts to PATCH User A's record
      const resUnauthorizedPatch = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: 99 }),
      });
      assert(resUnauthorizedPatch.status === 404, 'User B attempting to PATCH User A record returns 404 (ownership scoped)');

      // Verify User A's record remains untouched
      const verifyDoc = await LearningProgress.findById(recordA1Id);
      assert(verifyDoc.progress === 80, 'User A record progress was not modified by User B');

      // User B attempts to DELETE User A's record
      const resUnauthorizedDelete = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenB}`,
        },
      });
      assert(resUnauthorizedDelete.status === 404, 'User B attempting to DELETE User A record returns 404');

      // Verify User A's record still exists
      const verifyStillExists = await LearningProgress.findById(recordA1Id);
      assert(verifyStillExists !== null, 'User A record was not deleted by unauthorized User B');
    }

    // -------------------------------------------------------------------------
    // Suite 7: Mass-Assignment Protection & Identity Derivation
    // -------------------------------------------------------------------------
    console.log('\n[Suite 7: Mass-Assignment & Identity Tampering Protection]');
    {
      // Attempt to tamper with 'user' or 'resource' via body
      const fakeUserId = new mongoose.Types.ObjectId();
      const fakeResourceId = new mongoose.Types.ObjectId();

      const resTamper = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress: 50,
          user: fakeUserId.toString(),
          resource: fakeResourceId.toString(),
        }),
      });
      const dataTamper = await resTamper.json();
      assert(resTamper.status === 200, 'Update succeeds for valid progress');
      assert(dataTamper.data.user === userA._id.toString(), 'Protected user field was not changed');
      assert(dataTamper.data.resource._id === resDoc1._id.toString(), 'Protected resource field was not changed');
    }

    // -------------------------------------------------------------------------
    // Suite 8: Record Deletion (DELETE /api/learning/:id)
    // -------------------------------------------------------------------------
    console.log('\n[Suite 8: Record Deletion & Clean Removal]');
    {
      // 1. Delete owned record
      const resDelete = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenA}`,
        },
      });
      const dataDelete = await resDelete.json();
      assert(resDelete.status === 200, 'DELETE /api/learning/:id returns 200 OK for owned record');
      assert(dataDelete.success === true, 'Delete response indicates success');
      assert(dataDelete.message.includes('removed from learning library'), 'Helpful removal message');

      // 2. Verify record no longer exists in DB
      const checkDoc = await LearningProgress.findById(recordA1Id);
      assert(checkDoc === null, 'Record was deleted from database');
      createdLearningIds.delete(recordA1Id);

      // 3. Deleting an already-deleted or non-existent record returns 404
      const resDeleteAgain = await fetch(`${baseUrl}/${recordA1Id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenA}`,
        },
      });
      assert(resDeleteAgain.status === 404, 'DELETE on already deleted record returns 404 Not Found');

      // 4. Verify User A now has exactly 1 remaining record
      const resListAfter = await fetch(baseUrl, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const dataListAfter = await resListAfter.json();
      assert(dataListAfter.count === 1, 'User A library reflects exactly 1 remaining course');
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Learning API Test Summary: ${passedTests}/${totalTests} assertions passed.`);
    console.log('='.repeat(60));
    console.log('✓ All personal learning API endpoints, validations, and ownership controls passed successfully.\n');
  } finally {
    // -------------------------------------------------------------------------
    // Narrowly Scoped Cleanup: Remove Only Records Created in This Run
    // -------------------------------------------------------------------------
    if (createdLearningIds.size > 0) {
      await LearningProgress.deleteMany({ _id: { $in: Array.from(createdLearningIds) } });
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

runLearningTests().catch((err) => {
  console.error('\n❌ Fatal error in Learning API test suite:', err);
  process.exit(1);
});
