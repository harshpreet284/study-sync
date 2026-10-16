process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables explicitly
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { app } = await import('../server.js');
const { Resource } = await import('../models/Resource.js');
const { escapeRegex } = await import('../controllers/resourceController.js');

console.log('='.repeat(60));
console.log('StudySync Resource Read API Integration Test Suite');
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

const runResourceTests = async () => {
  // ---------------------------------------------------------------------------
  // Unit Test Suite: escapeRegex Utility
  // ---------------------------------------------------------------------------
  console.log('\n[Suite 0: escapeRegex Helper Unit Tests]');
  {
    assert(escapeRegex('react') === 'react', 'Normal alphanumeric string is unmodified');
    assert(
      escapeRegex('react (v19) [hooks] + more? $100 * 5 ^ 2') ===
        'react \\(v19\\) \\[hooks\\] \\+ more\\? \\$100 \\* 5 \\^ 2',
      'All regex metacharacters are safely escaped with backslashes'
    );
    assert(escapeRegex('') === '', 'Empty string returns empty string');
    assert(escapeRegex(null) === '', 'Non-string input returns empty string');
  }

  // ---------------------------------------------------------------------------
  // Test Database Isolation Check
  // ---------------------------------------------------------------------------
  console.log('\n[Test Isolation Check]');
  const testUri = process.env.MONGODB_TEST_URI;

  if (!testUri) {
    console.warn('\n⚠️ [TEST SKIPPED] MONGODB_TEST_URI is not configured in server/.env.');
    console.warn('Skipping integration tests to prevent connecting to the development database.');
    return;
  }

  if (process.env.MONGODB_URI && testUri === process.env.MONGODB_URI) {
    console.error('\n❌ [TEST ABORTED] MONGODB_TEST_URI cannot be identical to development MONGODB_URI.');
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(testUri);
  const dbName = mongoose.connection.name;
  if (dbName !== 'studysync_test') {
    console.error(`\n❌ [TEST ABORTED] MONGODB_TEST_URI must connect to database 'studysync_test'. Current: '${dbName}'.`);
    await mongoose.disconnect();
    process.exitCode = 1;
    return;
  }
  console.log(`✓ Confirmed connection strictly to isolated test database: "${dbName}"`);

  // Start ephemeral test server on an open random port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/resources`;

  const timestamp = Date.now();
  const createdResourceIds = new Set();

  try {
    // -------------------------------------------------------------------------
    // Seed Isolated Test Fixtures
    // -------------------------------------------------------------------------
    const testFixtures = [
      {
        sourceId: 90001,
        title: `React Fundamentals [${timestamp}]`,
        description: 'Learn modern React components and hooks',
        type: 'TUTORIAL',
        platform: 'React Team',
        url: 'https://react.dev/learn',
        category: 'Web Development',
        difficulty: 'BEGINNER',
        estimatedDuration: 0,
        skills: ['React', 'JavaScript', 'Frontend'],
        modules: [{ title: 'Intro', description: 'Components', order: 1 }],
        instructor: '',
        rating: 0,
      },
      {
        sourceId: 90002,
        title: `Advanced TypeScript Architecture [${timestamp}]`,
        description: 'Master generics, conditional types, and compiler API',
        type: 'DOCUMENTATION',
        platform: 'Microsoft',
        url: 'https://www.typescriptlang.org/docs',
        category: 'Web Development',
        difficulty: 'ADVANCED',
        estimatedDuration: 0,
        skills: ['TypeScript', 'JavaScript'],
        modules: [{ title: 'Generics', description: 'Advanced types', order: 1 }],
        instructor: '',
        rating: 0,
      },
      {
        sourceId: 90003,
        title: `PostgreSQL Data Analysis Guide [${timestamp}]`,
        description: 'Relational database queries, window functions, and analytics',
        type: 'COURSE',
        platform: 'PostgreSQL Group',
        url: 'https://www.postgresql.org/docs',
        category: 'Data Science',
        difficulty: 'INTERMEDIATE',
        estimatedDuration: 0,
        skills: ['SQL', 'PostgreSQL', 'Data'],
        modules: [{ title: 'Queries', description: 'Joins and aggregates', order: 1 }],
        instructor: '',
        rating: 0,
      },
    ];

    const insertedDocs = await Resource.insertMany(testFixtures);
    insertedDocs.forEach((doc) => createdResourceIds.add(doc._id.toString()));
    console.log(`✓ Seeded ${insertedDocs.length} isolated test resources into "${dbName}"`);

    const fixtureReact = insertedDocs[0];
    const fixtureTS = insertedDocs[1];
    const fixturePG = insertedDocs[2];

    // -------------------------------------------------------------------------
    // Suite 1: GET /api/resources - Base Listing & Response Contract
    // -------------------------------------------------------------------------
    console.log('\n[Suite 1: GET /api/resources - Base Listing & Response Contract]');
    {
      const res = await fetch(baseUrl);
      const json = await res.json();

      assert(res.status === 200, 'GET /api/resources returns 200 OK');
      assert(json.success === true, 'Response follows { success: true } convention');
      assert(Array.isArray(json.data), 'Response data is an array');
      assert(typeof json.count === 'number', 'Response includes numeric count metadata');
      assert(json.count === json.data.length, 'Count metadata matches data array length');
      assert(json.data.length >= 3, 'Result includes all seeded test resources');

      const foundReact = json.data.find((r) => r.sourceId === 90001);
      assert(foundReact !== undefined, 'Seeded React resource is present in listing');
      assert(foundReact.title === fixtureReact.title, 'Resource title matches database record');
      assert(foundReact.type === 'TUTORIAL', 'Resource type is preserved');
      assert(foundReact.category === 'Web Development', 'Resource category is preserved');
      assert(foundReact.difficulty === 'BEGINNER', 'Resource difficulty is preserved');
    }

    // -------------------------------------------------------------------------
    // Suite 2: GET /api/resources - Category, Difficulty & Type Filters
    // -------------------------------------------------------------------------
    console.log('\n[Suite 2: GET /api/resources - Category, Difficulty & Type Filters]');
    {
      // Category filter (exact & case-insensitive)
      const resCat = await fetch(`${baseUrl}?category=Data%20Science`);
      const jsonCat = await resCat.json();
      assert(resCat.status === 200, 'Filter by category returns 200');
      assert(
        jsonCat.data.every((r) => r.category.toLowerCase() === 'data science'),
        'All returned resources belong to Data Science category'
      );
      assert(
        jsonCat.data.some((r) => r.sourceId === 90003),
        'Data Science results contain PostgreSQL fixture'
      );

      // Case-insensitive category
      const resCatLower = await fetch(`${baseUrl}?category=data%20science`);
      const jsonCatLower = await resCatLower.json();
      assert(
        jsonCatLower.data.some((r) => r.sourceId === 90003),
        'Category filter works case-insensitively'
      );

      // Difficulty filter (normalized to uppercase)
      const resDiff = await fetch(`${baseUrl}?difficulty=ADVANCED`);
      const jsonDiff = await resDiff.json();
      assert(resDiff.status === 200, 'Filter by difficulty returns 200');
      assert(
        jsonDiff.data.every((r) => r.difficulty === 'ADVANCED'),
        'All returned resources have ADVANCED difficulty'
      );
      assert(
        jsonDiff.data.some((r) => r.sourceId === 90002),
        'Advanced results contain TypeScript fixture'
      );

      // Case-insensitive difficulty
      const resDiffLower = await fetch(`${baseUrl}?difficulty=advanced`);
      const jsonDiffLower = await resDiffLower.json();
      assert(
        jsonDiffLower.data.some((r) => r.sourceId === 90002),
        'Difficulty filter normalizes lowercase input to uppercase'
      );

      // Type filter
      const resType = await fetch(`${baseUrl}?type=DOCUMENTATION`);
      const jsonType = await resType.json();
      assert(resType.status === 200, 'Filter by type returns 200');
      assert(
        jsonType.data.every((r) => r.type === 'DOCUMENTATION'),
        'All returned resources have DOCUMENTATION type'
      );
      assert(
        jsonType.data.some((r) => r.sourceId === 90002),
        'Type results contain TypeScript fixture'
      );
    }

    // -------------------------------------------------------------------------
    // Suite 3: GET /api/resources - Safe Search & ReDoS Prevention
    // -------------------------------------------------------------------------
    console.log('\n[Suite 3: GET /api/resources - Search & Safe Character Escaping]');
    {
      // Search by title substring
      const resSearch = await fetch(`${baseUrl}?search=${timestamp}`);
      const jsonSearch = await resSearch.json();
      assert(resSearch.status === 200, 'Search by timestamp returns 200');
      assert(jsonSearch.count === 3, 'Search by timestamp matches all 3 seeded fixtures');

      // Search by skill
      const resSkill = await fetch(`${baseUrl}?search=PostgreSQL`);
      const jsonSkill = await resSkill.json();
      assert(
        jsonSkill.data.some((r) => r.sourceId === 90003),
        'Search matches skill tags successfully'
      );

      // Search with regex special characters (safe escaping, ReDoS resistance)
      const resSpecial = await fetch(`${baseUrl}?search=React%20[${timestamp}]+?^$`);
      const jsonSpecial = await resSpecial.json();
      assert(resSpecial.status === 200, 'Search with regex characters does not throw 500 error');
      assert(jsonSpecial.success === true, 'Response maintains success: true on special chars');
    }

    // -------------------------------------------------------------------------
    // Suite 4: GET /api/resources - Combined Filters & Empty Results
    // -------------------------------------------------------------------------
    console.log('\n[Suite 4: GET /api/resources - Combined Filters & Empty Results]');
    {
      // Combined category + difficulty + type + search
      const combinedUrl = `${baseUrl}?category=Web%20Development&difficulty=BEGINNER&type=TUTORIAL&search=${timestamp}`;
      const resComb = await fetch(combinedUrl);
      const jsonComb = await resComb.json();
      assert(resComb.status === 200, 'Combined filters return 200');
      assert(jsonComb.count === 1, 'Combined filters match exactly 1 specific fixture');
      assert(jsonComb.data[0].sourceId === 90001, 'Combined filter correctly resolves to React fixture');

      // Empty results handled cleanly
      const emptyUrl = `${baseUrl}?search=nonexistent_query_string_xyz_99999`;
      const resEmpty = await fetch(emptyUrl);
      const jsonEmpty = await resEmpty.json();
      assert(resEmpty.status === 200, 'Empty results return 200 OK');
      assert(jsonEmpty.success === true, 'Empty results return success: true');
      assert(jsonEmpty.count === 0, 'Empty results return count: 0');
      assert(Array.isArray(jsonEmpty.data) && jsonEmpty.data.length === 0, 'Empty results return empty array data: []');
    }

    // -------------------------------------------------------------------------
    // Suite 5: GET /api/resources - Input Validation & Hardening
    // -------------------------------------------------------------------------
    console.log('\n[Suite 5: GET /api/resources - Input Validation & Hardening]');
    {
      // 1. Invalid difficulty enum
      const resBadDiff = await fetch(`${baseUrl}?difficulty=IMPOSSIBLE`);
      const jsonBadDiff = await resBadDiff.json();
      assert(resBadDiff.status === 400, 'Invalid difficulty returns 400 Bad Request');
      assert(jsonBadDiff.success === false, 'Invalid difficulty returns success: false');
      assert(
        jsonBadDiff.message.includes('Invalid difficulty'),
        'Error message describes invalid difficulty'
      );

      // 2. Invalid resource type enum
      const resBadType = await fetch(`${baseUrl}?type=INTERACTIVE_SIMULATION`);
      const jsonBadType = await resBadType.json();
      assert(resBadType.status === 400, 'Invalid resource type returns 400 Bad Request');
      assert(jsonBadType.success === false, 'Invalid type returns success: false');
      assert(
        jsonBadType.message.includes('Invalid resource type'),
        'Error message describes invalid resource type'
      );

      // 3. Search query length boundary: exactly 200 characters succeeds
      const search200 = 'a'.repeat(200);
      const res200 = await fetch(`${baseUrl}?search=${search200}`);
      const json200 = await res200.json();
      assert(res200.status === 200, 'Search with exactly 200 characters succeeds with 200 OK');
      assert(json200.success === true, 'Response for 200-char search has success: true');
      assert(Array.isArray(json200.data), 'Response data is an array');

      // 4. Search query length boundary: 201 characters rejected with 400
      const search201 = 'a'.repeat(201);
      const res201 = await fetch(`${baseUrl}?search=${search201}`);
      const json201 = await res201.json();
      assert(res201.status === 400, 'Search with 201 characters returns 400 Bad Request');
      assert(json201.success === false, 'Response has success: false');
      assert(
        json201.message.includes('200 characters'),
        'Error message specifies 200-character search limit'
      );

      // 5. Duplicate search parameters rejected (non-string array)
      const resDupSearch = await fetch(`${baseUrl}?search=first&search=second`);
      const jsonDupSearch = await resDupSearch.json();
      assert(resDupSearch.status === 400, 'Duplicate search parameter returns 400 Bad Request');
      assert(jsonDupSearch.success === false, 'Duplicate search returns success: false');
      assert(
        jsonDupSearch.message.includes('single string'),
        'Error indicates search must be a single string'
      );

      // 6. Duplicate category parameters rejected (non-string array)
      const resDupCat = await fetch(`${baseUrl}?category=Web%20Development&category=Data%20Science`);
      const jsonDupCat = await resDupCat.json();
      assert(resDupCat.status === 400, 'Duplicate category parameter returns 400 Bad Request');
      assert(jsonDupCat.success === false, 'Duplicate category returns success: false');
      assert(
        jsonDupCat.message.includes('single string'),
        'Error indicates category must be a single string'
      );

      // 7. Duplicate difficulty parameters rejected (non-string array)
      const resDupDiff = await fetch(`${baseUrl}?difficulty=BEGINNER&difficulty=ADVANCED`);
      const jsonDupDiff = await resDupDiff.json();
      assert(resDupDiff.status === 400, 'Duplicate difficulty returns 400 Bad Request');
      assert(jsonDupDiff.success === false, 'Duplicate difficulty returns success: false');
      assert(
        jsonDupDiff.message.includes('single string'),
        'Error indicates difficulty must be a single string'
      );

      // 8. Duplicate type parameters rejected (non-string array)
      const resDupType = await fetch(`${baseUrl}?type=TUTORIAL&type=COURSE`);
      const jsonDupType = await resDupType.json();
      assert(resDupType.status === 400, 'Duplicate type returns 400 Bad Request');
      assert(jsonDupType.success === false, 'Duplicate type returns success: false');
      assert(
        jsonDupType.message.includes('single string'),
        'Error indicates type must be a single string'
      );

      // 9. Object-like query parameters rejected (e.g. ?difficulty[gt]=)
      const resObjDiff = await fetch(`${baseUrl}?difficulty[gt]=BEGINNER`);
      const jsonObjDiff = await resObjDiff.json();
      assert(resObjDiff.status === 400, 'Object-like difficulty returns 400 Bad Request');
      assert(jsonObjDiff.success === false, 'Object-like difficulty returns success: false');
      assert(
        jsonObjDiff.message.includes('single string'),
        'Error indicates object-like difficulty is rejected'
      );

      // 10. Object-like query parameters rejected (e.g. ?type[gt]=)
      const resObjType = await fetch(`${baseUrl}?type[gt]=COURSE`);
      const jsonObjType = await resObjType.json();
      assert(resObjType.status === 400, 'Object-like type returns 400 Bad Request');
      assert(jsonObjType.success === false, 'Object-like type returns success: false');
      assert(
        jsonObjType.message.includes('single string'),
        'Error indicates object-like type is rejected'
      );
    }

    // -------------------------------------------------------------------------
    // Suite 6: GET /api/resources/:id - Detail Lookup, ObjectId & sourceId Support
    // -------------------------------------------------------------------------
    console.log('\n[Suite 6: GET /api/resources/:id - Detail Lookup & ID Formats]');
    {
      // 1. Lookup by MongoDB ObjectId
      const resObjId = await fetch(`${baseUrl}/${fixtureReact._id}`);
      const jsonObjId = await resObjId.json();
      assert(resObjId.status === 200, 'Lookup by MongoDB ObjectId returns 200 OK');
      assert(jsonObjId.success === true, 'Lookup by ObjectId returns success: true');
      assert(jsonObjId.data._id === fixtureReact._id.toString(), 'Returned resource ID matches ObjectId');
      assert(jsonObjId.data.title === fixtureReact.title, 'Returned resource title matches');
      assert(Array.isArray(jsonObjId.data.modules), 'Modules array is included in detail response');
      assert(Array.isArray(jsonObjId.data.skills), 'Skills array is included in detail response');

      // 2. Lookup by legacy numeric sourceId
      const resSourceId = await fetch(`${baseUrl}/90001`);
      const jsonSourceId = await resSourceId.json();
      assert(resSourceId.status === 200, 'Lookup by numeric sourceId returns 200 OK');
      assert(jsonSourceId.success === true, 'Lookup by sourceId returns success: true');
      assert(jsonSourceId.data.sourceId === 90001, 'Returned resource sourceId matches numeric query');
      assert(jsonSourceId.data._id === fixtureReact._id.toString(), 'SourceId lookup returns identical document');

      // 3. Non-existent valid MongoDB ObjectId -> 404 Not Found
      const nonExistentObjId = new mongoose.Types.ObjectId().toString();
      const res404Obj = await fetch(`${baseUrl}/${nonExistentObjId}`);
      const json404Obj = await res404Obj.json();
      assert(res404Obj.status === 404, 'Non-existent ObjectId returns 404 Not Found');
      assert(json404Obj.success === false, '404 response has success: false');
      assert(json404Obj.message === 'Resource not found.', '404 message indicates resource not found');

      // 4. Non-existent valid numeric sourceId -> 404 Not Found
      const res404Num = await fetch(`${baseUrl}/99999999`);
      const json404Num = await res404Num.json();
      assert(res404Num.status === 404, 'Non-existent numeric sourceId returns 404 Not Found');
      assert(json404Num.success === false, '404 response has success: false');
      assert(json404Num.message === 'Resource not found.', '404 message indicates resource not found');

      // 5. Malformed ID string -> 400 Bad Request
      const resMalformed = await fetch(`${baseUrl}/invalid-id-not-hex-or-num!`);
      const jsonMalformed = await resMalformed.json();
      assert(resMalformed.status === 400, 'Malformed resource ID returns 400 Bad Request');
      assert(jsonMalformed.success === false, 'Malformed ID returns success: false');
      assert(
        jsonMalformed.message.includes('Invalid resource ID format'),
        'Malformed ID error message is clear and does not leak raw database cast errors'
      );
    }
  } finally {
    // -------------------------------------------------------------------------
    // Narrowly Scoped Cleanup: Delete ONLY created test records
    // -------------------------------------------------------------------------
    if (createdResourceIds.size > 0) {
      const deleteResult = await Resource.deleteMany({
        _id: { $in: Array.from(createdResourceIds).map((id) => new mongoose.Types.ObjectId(id)) },
      });
      console.log(`\n✓ Narrowly scoped cleanup: Deleted exactly ${deleteResult.deletedCount} test-created resource(s) from "${dbName}".`);
    }

    server.close();
    await mongoose.disconnect();
    console.log(`✓ Closed test server and disconnected cleanly from "${dbName}".`);
  }
};

runResourceTests()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log(`Resource API Test Summary: ${passedTests}/${totalTests} assertions passed.`);
    console.log('='.repeat(60));
  })
  .catch((err) => {
    console.error('\n❌ Unhandled error in Resource API test suite:', err);
    process.exitCode = 1;
  });
