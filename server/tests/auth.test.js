process.env.NODE_ENV = 'test';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables explicitly
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { app, validateJwtConfig } = await import('../server.js');
const { User } = await import('../models/User.js');

console.log('='.repeat(60));
console.log('StudySync Authentication & Security Integration Test Suite');
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

const runAuthTests = async () => {
  // -------------------------------------------------------------------------
  // Suite 0: Startup JWT Configuration Validation
  // -------------------------------------------------------------------------
  console.log('\n[Suite 0: Startup JWT_SECRET Configuration Validation]');
  {
    const originalSecret = process.env.JWT_SECRET;

    // Missing secret
    delete process.env.JWT_SECRET;
    assert(
      validateJwtConfig() === false,
      'validateJwtConfig rejects missing JWT_SECRET at startup'
    );

    // Weak / short secret (< 32 characters)
    process.env.JWT_SECRET = 'short_insecure_secret_12345';
    assert(
      validateJwtConfig() === false,
      'validateJwtConfig rejects weak JWT_SECRET under 32 characters'
    );

    // Valid secret (>= 32 characters)
    process.env.JWT_SECRET = 'a'.repeat(32);
    assert(
      validateJwtConfig() === true,
      'validateJwtConfig accepts cryptographically sufficient secret >= 32 characters'
    );

    // Restore original secret
    process.env.JWT_SECRET = originalSecret;
  }

  // -------------------------------------------------------------------------
  // Test Database Isolation Verification
  // -------------------------------------------------------------------------
  console.log('\n[Test Isolation Check]');
  const testUri = process.env.MONGODB_TEST_URI;

  if (!testUri) {
    console.warn('\n⚠️ [TEST SKIPPED] MONGODB_TEST_URI is not configured in server/.env.');
    console.warn('Skipping integration tests to prevent connecting to the development database.');
    console.warn('Configure MONGODB_TEST_URI pointing to studysync_test to run these tests.\n');
    return;
  }

  // Guard against pointing MONGODB_TEST_URI to development database
  if (process.env.MONGODB_URI && testUri === process.env.MONGODB_URI) {
    console.error('\n❌ [TEST ABORTED] MONGODB_TEST_URI cannot be identical to development MONGODB_URI.');
    console.error('Integration tests require an isolated test database.\n');
    process.exitCode = 1;
    return;
  }

  // Connect strictly to MONGODB_TEST_URI (never fallback to MONGODB_URI)
  await mongoose.connect(testUri);

  const dbName = mongoose.connection.name;
  if (dbName !== 'studysync_test') {
    console.error(`\n❌ [TEST ABORTED] MONGODB_TEST_URI must connect to database 'studysync_test'. Current database: '${dbName}'.`);
    await mongoose.disconnect();
    process.exitCode = 1;
    return;
  }
  console.log(`✓ Confirmed connection strictly to isolated test database: "${dbName}"`);

  // Start ephemeral test server on an open random port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  const timestamp = Date.now();
  const testEmail = `test_auth_${timestamp}@example.com`;
  const testPassword = 'StrongPassword123!';
  const testName = 'Test User Auth';
  let validToken = '';
  let createdUserId = '';

  // Track exact created user IDs for narrowly scoped cleanup
  const createdUserIds = new Set();

  try {
    // -------------------------------------------------------------------------
    // 1. POST /api/auth/register - Validation & Password Boundary Tests
    // -------------------------------------------------------------------------
    console.log('\n[Suite 1: Registration Validation & Password UTF-8 Byte Limits]');
    {
      // Missing all fields
      const res1 = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data1 = await res1.json();
      assert(res1.status === 400, 'Register with empty body returns 400 Bad Request');
      assert(data1.success === false, 'Register response format has success: false');

      // Missing password
      const res2 = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'User', email: 'user@example.com' }),
      });
      assert(res2.status === 400, 'Register with missing password returns 400');

      // Invalid email format
      const res3 = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'User', email: 'not-an-email', password: 'password123' }),
      });
      const data3 = await res3.json();
      assert(res3.status === 400, 'Register with invalid email format returns 400');
      assert(data3.message.includes('valid email'), 'Error message specifies email format requirement');

      // Password too short (< 8 characters: 7 characters)
      const res4 = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'User', email: 'valid@example.com', password: '1234567' }),
      });
      const data4 = await res4.json();
      assert(res4.status === 400, 'Register with password < 8 characters returns 400');
      assert(data4.message.includes('at least 8 characters'), 'Error message specifies 8-character minimum');

      // Password exceeding 72 ASCII bytes (73 characters = 73 bytes)
      const longAsciiPassword = 'a'.repeat(73);
      const res5 = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'User', email: 'longpwd@example.com', password: longAsciiPassword }),
      });
      const data5 = await res5.json();
      assert(res5.status === 400, 'Register with password > 72 bytes (ASCII) returns 400');
      assert(data5.message.includes('72 bytes'), 'Error message specifies 72-byte limit');

      // Password exceeding 72 bytes via multibyte UTF-8 characters
      // 20 emojis (🔑 is 4 bytes each = 80 bytes, though only 20 visual characters)
      const multibyteOverLimitPassword = '🔑'.repeat(20);
      assert(Buffer.byteLength(multibyteOverLimitPassword, 'utf8') === 80, 'Multibyte test password measures 80 UTF-8 bytes');
      const res6 = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'User', email: 'multibyte@example.com', password: multibyteOverLimitPassword }),
      });
      const data6 = await res6.json();
      assert(res6.status === 400, 'Register with multibyte password > 72 bytes returns 400');
      assert(data6.message.includes('72 bytes'), 'Error message reports 72-byte limit for multibyte password');

      // Boundary Case: Exactly 8 characters (valid)
      const exact8Password = '8CharsOK';
      const exact8Email = `exact8_${timestamp}@example.com`;
      const res7 = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Exact 8', email: exact8Email, password: exact8Password }),
      });
      const data7 = await res7.json();
      assert(res7.status === 201, 'Boundary test: Exactly 8-character password succeeds with 201');
      if (data7.data?.user?._id) createdUserIds.add(data7.data.user._id);

      // Boundary Case: Exactly 72 bytes ASCII (valid)
      const exact72Password = 'b'.repeat(72);
      const exact72Email = `exact72_${timestamp}@example.com`;
      const res8 = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Exact 72', email: exact72Email, password: exact72Password }),
      });
      const data8 = await res8.json();
      assert(res8.status === 201, 'Boundary test: Exactly 72-byte password succeeds with 201');
      if (data8.data?.user?._id) createdUserIds.add(data8.data.user._id);
    }

    // -------------------------------------------------------------------------
    // 2. POST /api/auth/register - Successful Registration & Serialization
    // -------------------------------------------------------------------------
    console.log('\n[Suite 2: Successful Registration & Safe Serialization]');
    {
      const res = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          email: testEmail.toUpperCase(), // Test case-insensitive normalization
          password: testPassword,
        }),
      });
      const data = await res.json();

      assert(res.status === 201, 'Successful registration returns 201 Created');
      assert(data.success === true, 'Response indicates success: true');
      assert(data.data && data.data.token, 'Response contains valid JWT token');
      assert(data.data.user && data.data.user.email === testEmail.toLowerCase(), 'User email is normalized to lowercase');
      assert(data.data.user.name === testName, 'User name matches registration data');
      assert(data.data.user.passwordHash === undefined, 'CRITICAL: passwordHash is NEVER exposed in registration response');

      validToken = data.data.token;
      createdUserId = data.data.user._id;
      createdUserIds.add(createdUserId);

      // Verify token payload contains user ID
      const decoded = jwt.decode(validToken);
      assert(decoded && decoded.userId === createdUserId, 'JWT payload contains correct userId claim');
    }

    // -------------------------------------------------------------------------
    // 3. POST /api/auth/register - Duplicate Email Rejection
    // -------------------------------------------------------------------------
    console.log('\n[Suite 3: Duplicate Email Prevention]');
    {
      const res = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Another User',
          email: testEmail, // Identical email
          password: 'AnotherPassword123!',
        }),
      });
      const data = await res.json();
      assert(res.status === 409, 'Duplicate email registration is rejected with 409 Conflict');
      assert(data.success === false, 'Duplicate response format has success: false');
      assert(data.message.toLowerCase().includes('already exists'), 'Duplicate error message is clear and human-readable');
    }

    // -------------------------------------------------------------------------
    // 4. POST /api/auth/login - Credentials & Error Handling
    // -------------------------------------------------------------------------
    console.log('\n[Suite 4: User Login & Security]');
    {
      // Missing fields
      const res1 = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert(res1.status === 400, 'Login with missing fields returns 400');

      // Non-existent email
      const res2 = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `nonexistent_${timestamp}@example.com`, password: testPassword }),
      });
      const data2 = await res2.json();
      assert(res2.status === 401, 'Login with non-existent email returns 401 Unauthorized');
      assert(data2.message === 'Invalid email or password.', 'Generic error message prevents email enumeration');

      // Wrong password
      const res3 = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'WrongPassword999!' }),
      });
      const data3 = await res3.json();
      assert(res3.status === 401, 'Login with wrong password returns 401 Unauthorized');
      assert(data3.message === 'Invalid email or password.', 'Generic error message prevents password enumeration');

      // Successful login
      const res4 = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      const data4 = await res4.json();
      assert(res4.status === 200, 'Login with correct credentials returns 200 OK');
      assert(data4.success === true, 'Login response has success: true');
      assert(data4.data && data4.data.token, 'Login returns new JWT token');
      assert(data4.data.user.passwordHash === undefined, 'CRITICAL: passwordHash is NEVER exposed in login response');
      assert(data4.data.user.email === testEmail.toLowerCase(), 'Login user email matches normalized record');
    }

    // -------------------------------------------------------------------------
    // 5. GET /api/auth/me - Protected Route & Token Verification
    // -------------------------------------------------------------------------
    console.log('\n[Suite 5: Protected Route (/api/auth/me) & Token Verification]');
    {
      // Valid token
      const res1 = await fetch(`${baseUrl}/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${validToken}` },
      });
      const data1 = await res1.json();
      assert(res1.status === 200, 'Valid token returns 200 OK on protected route');
      assert(data1.success === true, 'Protected route returns success: true');
      assert(data1.data.user && data1.data.user._id === createdUserId, 'Returns profile belonging to the authenticated user');
      assert(data1.data.user.passwordHash === undefined, 'passwordHash is never exposed via /api/auth/me');

      // Missing Authorization header
      const res2 = await fetch(`${baseUrl}/me`, { method: 'GET' });
      assert(res2.status === 401, 'Request without Authorization header returns 401 Unauthorized');

      // Missing "Bearer " scheme prefix
      const res3 = await fetch(`${baseUrl}/me`, {
        method: 'GET',
        headers: { Authorization: validToken },
      });
      assert(res3.status === 401, 'Request without Bearer prefix returns 401');

      // Malformed / junk token
      const res4 = await fetch(`${baseUrl}/me`, {
        method: 'GET',
        headers: { Authorization: 'Bearer this.is.not.a.valid.jwt' },
      });
      const data4 = await res4.json();
      assert(res4.status === 401, 'Malformed JWT returns 401 Unauthorized');
      assert(data4.message.includes('Invalid authentication token'), 'Error message reports invalid token');

      // Tampered token (signed with wrong secret)
      const fakeToken = jwt.sign({ userId: createdUserId }, 'wrong_secret_key_12345678901234567890');
      const res5 = await fetch(`${baseUrl}/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${fakeToken}` },
      });
      assert(res5.status === 401, 'Token with invalid signature returns 401 Unauthorized');

      // Expired token
      const expiredToken = jwt.sign(
        { userId: createdUserId },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Expired 1 second ago
      );
      const res6 = await fetch(`${baseUrl}/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      const data6 = await res6.json();
      assert(res6.status === 401, 'Expired token returns 401 Unauthorized');
      assert(data6.message.includes('expired'), 'Error message indicates token expiration');
    }

    // -------------------------------------------------------------------------
    // 6. Security Invariant: Identity Trust & Body Tampering
    // -------------------------------------------------------------------------
    console.log('\n[Suite 6: Identity Derivation Security Invariants]');
    {
      // Attempting to pass a forged userId in query params or headers
      const fakeId = '660000000000000000000099';
      const res = await fetch(`${baseUrl}/me?userId=${fakeId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'X-User-Id': fakeId,
        },
      });
      const data = await res.json();
      assert(res.status === 200, 'Protected route succeeds with valid token');
      assert(data.data.user._id === createdUserId, 'CRITICAL: Identity strictly derives from verified JWT claim, ignoring query/header tampering');
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Auth Integration Test Summary: ${passedTests}/${totalTests} assertions passed.`);
    console.log('='.repeat(60));
    console.log('✓ All authentication, security, and token verification tests passed successfully.\n');
  } finally {
    // Narrowly Scoped Cleanup: Delete ONLY exact IDs created in this run
    if (createdUserIds.size > 0) {
      const idsToDelete = Array.from(createdUserIds);
      await User.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`✓ Narrowly scoped cleanup: Deleted exactly ${idsToDelete.length} test-created record(s) from database "${dbName}".`);
    }

    server.close();
    await mongoose.disconnect();
    console.log(`✓ Disconnected cleanly from "${dbName}".`);
  }
};

runAuthTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
