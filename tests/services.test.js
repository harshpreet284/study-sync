/**
 * Maintained Automated Test Suite for Frontend Services.
 *
 * Tests:
 * - learningService.js (auth guards, headers, response parsing, 409 duplicate handling, input validation)
 * - resourceService.js (bookmark ID normalization, type-coercion equality matching)
 * - authService.js (tokenStorage persistence and extraction)
 *
 * Runs via Node.js built-in test runner: `node --test tests/services.test.js`
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Set up lightweight localStorage mock for Node test environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

// Import frontend service modules under test
const { learningService } = await import('../src/services/learningService.js');
const {
  normalizeBookmarkIds,
  matchesBookmarkId,
} = await import('../src/services/resourceService.js');
const { tokenStorage } = await import('../src/services/authService.js');
const { goalService } = await import('../src/services/goalService.js');

describe('Frontend Services Test Suite', () => {
  let originalFetch;
  let capturedRequests = [];

  beforeEach(() => {
    storage.clear();
    capturedRequests = [];
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    storage.clear();
  });

  // ---------------------------------------------------------------------------
  // 1. Missing Token & Input Validation Guards
  // ---------------------------------------------------------------------------
  describe('learningService: Authentication Guards & Validation', () => {
    it('getLearningRecords rejects with HTTP 401 when token is missing', async () => {
      await assert.rejects(
        async () => {
          await learningService.getLearningRecords({ token: '' });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /Authentication required/i);
          return true;
        }
      );
    });

    it('addLearningRecord rejects with HTTP 401 when token is missing', async () => {
      await assert.rejects(
        async () => {
          await learningService.addLearningRecord(1, { token: '' });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /Authentication required/i);
          return true;
        }
      );
    });

    it('updateLearningProgress rejects with HTTP 401 when token is missing', async () => {
      await assert.rejects(
        async () => {
          await learningService.updateLearningProgress('rec123', { progress: 50 }, { token: '' });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /Authentication required/i);
          return true;
        }
      );
    });

    it('deleteLearningRecord rejects with HTTP 401 when token is missing', async () => {
      await assert.rejects(
        async () => {
          await learningService.deleteLearningRecord('rec123', { token: '' });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /Authentication required/i);
          return true;
        }
      );
    });

    it('addLearningRecord validates resourceId before network call', async () => {
      await assert.rejects(
        async () => {
          await learningService.addLearningRecord('', { token: 'mock-token' });
        },
        /Resource ID is required/i
      );

      await assert.rejects(
        async () => {
          await learningService.addLearningRecord(null, { token: 'mock-token' });
        },
        /Resource ID is required/i
      );
    });

    it('updateLearningProgress validates recordId before network call', async () => {
      await assert.rejects(
        async () => {
          await learningService.updateLearningProgress('', { progress: 20 }, { token: 'mock-token' });
        },
        /Learning record ID is required/i
      );
    });

    it('deleteLearningRecord validates recordId before network call', async () => {
      await assert.rejects(
        async () => {
          await learningService.deleteLearningRecord('', { token: 'mock-token' });
        },
        /Learning record ID is required/i
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Authorization Header & Request Construction
  // ---------------------------------------------------------------------------
  describe('learningService: Authorization Headers & Parameter Construction', () => {
    it('getLearningRecords constructs Authorization header and parses query params', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await learningService.getLearningRecords({
        status: 'IN_PROGRESS',
        token: 'test-jwt-token-abc',
      });

      assert.equal(capturedRequests.length, 1);
      const req = capturedRequests[0];
      assert.match(req.url, /\/api\/learning\?status=IN_PROGRESS/);
      assert.equal(req.options.headers.Authorization, 'Bearer test-jwt-token-abc');
      assert.equal(req.options.headers.Accept, 'application/json');
    });

    it('getLearningRecords omits status query when set to ALL', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await learningService.getLearningRecords({
        status: 'ALL',
        token: 'test-jwt-token-abc',
      });

      assert.equal(capturedRequests.length, 1);
      assert.ok(!capturedRequests[0].url.includes('status='));
    });

    it('getLearningRecords passes through AbortSignal to fetch', async () => {
      const controller = new AbortController();
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
          status: 200,
        });
      };

      await learningService.getLearningRecords({
        token: 'test-jwt',
        signal: controller.signal,
      });

      assert.equal(capturedRequests[0].options.signal, controller.signal);
    });

    it('addLearningRecord sends POST request with correct payload and headers', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Resource added.',
            data: { _id: 'rec1', progress: 0, status: 'NOT_STARTED' },
          }),
          { status: 201 }
        );
      };

      const result = await learningService.addLearningRecord(42, { token: 'token-xyz' });

      assert.equal(capturedRequests.length, 1);
      const req = capturedRequests[0];
      assert.equal(req.options.method, 'POST');
      assert.equal(req.options.headers.Authorization, 'Bearer token-xyz');
      assert.equal(req.options.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(req.options.body), { resourceId: 42 });
      assert.equal(result.isDuplicate, false);
      assert.equal(result.record._id, 'rec1');
    });

    it('updateLearningProgress sends PATCH request with payload and headers', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(
          JSON.stringify({
            success: true,
            data: { _id: 'rec1', progress: 60, status: 'IN_PROGRESS' },
          }),
          { status: 200 }
        );
      };

      const result = await learningService.updateLearningProgress(
        'rec1',
        { progress: 60, status: 'IN_PROGRESS' },
        { token: 'token-xyz' }
      );

      assert.equal(capturedRequests.length, 1);
      const req = capturedRequests[0];
      assert.equal(req.options.method, 'PATCH');
      assert.ok(req.url.endsWith('/api/learning/rec1'));
      assert.deepEqual(JSON.parse(req.options.body), { progress: 60, status: 'IN_PROGRESS' });
      assert.equal(result.progress, 60);
      assert.equal(result.status, 'IN_PROGRESS');
    });

    it('deleteLearningRecord sends DELETE request with Authorization header', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(
          JSON.stringify({ success: true, message: 'Resource removed.' }),
          { status: 200 }
        );
      };

      const result = await learningService.deleteLearningRecord('rec1', { token: 'token-xyz' });

      assert.equal(capturedRequests.length, 1);
      const req = capturedRequests[0];
      assert.equal(req.options.method, 'DELETE');
      assert.ok(req.url.endsWith('/api/learning/rec1'));
      assert.equal(result.success, true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Duplicate (HTTP 409 Conflict) Handling
  // ---------------------------------------------------------------------------
  describe('learningService: Duplicate (409) Handling', () => {
    it('addLearningRecord handles HTTP 409 gracefully without throwing error', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'This resource is already in your learning library.',
          }),
          { status: 409 }
        );
      };

      const result = await learningService.addLearningRecord(99, { token: 'token-xyz' });

      assert.equal(result.isDuplicate, true);
      assert.equal(result.record, null);
      assert.match(result.message, /already in your learning library/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Response Parsing & HTTP Error Handling
  // ---------------------------------------------------------------------------
  describe('learningService: Response Parsing & Error Extraction', () => {
    it('getLearningRecords parses records array and count', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            success: true,
            count: 2,
            data: [
              { _id: 'rec1', progress: 0, status: 'NOT_STARTED' },
              { _id: 'rec2', progress: 100, status: 'COMPLETED' },
            ],
          }),
          { status: 200 }
        );
      };

      const { records, count } = await learningService.getLearningRecords({ token: 'test-token' });
      assert.equal(count, 2);
      assert.equal(records.length, 2);
      assert.equal(records[0]._id, 'rec1');
      assert.equal(records[1].status, 'COMPLETED');
    });

    it('handles non-200 responses by throwing structured error with status', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ success: false, message: 'Resource not found' }),
          { status: 404 }
        );
      };

      await assert.rejects(
        async () => {
          await learningService.deleteLearningRecord('bad-id', { token: 'token-xyz' });
        },
        (err) => {
          assert.equal(err.status, 404);
          assert.match(err.message, /Resource not found/i);
          return true;
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Resource ID Normalization & Equality Matching (resourceService.js)
  // ---------------------------------------------------------------------------
  describe('resourceService: ID Normalization & Equality Logic', () => {
    it('normalizeBookmarkIds converts numeric strings to numbers and trims strings', () => {
      const raw = ['1', ' 2 ', 3, '4'];
      const normalized = normalizeBookmarkIds(raw);
      assert.deepEqual(normalized, [1, 2, 3, 4]);
    });

    it('normalizeBookmarkIds preserves alphanumeric string IDs (e.g. ObjectIds)', () => {
      const raw = ['507f1f77bcf86cd799439011', 'course-abc'];
      const normalized = normalizeBookmarkIds(raw);
      assert.deepEqual(normalized, ['507f1f77bcf86cd799439011', 'course-abc']);
    });

    it('normalizeBookmarkIds deduplicates IDs across mixed string and number types', () => {
      const raw = [1, '1', ' 1 ', 2, '2'];
      const normalized = normalizeBookmarkIds(raw);
      assert.deepEqual(normalized, [1, 2]);
    });

    it('normalizeBookmarkIds removes null, undefined, whitespace-only, and NaN entries', () => {
      const raw = [null, undefined, '', '   ', NaN, Infinity, 5];
      const normalized = normalizeBookmarkIds(raw);
      assert.deepEqual(normalized, [5]);
    });

    it('normalizeBookmarkIds returns empty array on invalid input', () => {
      assert.deepEqual(normalizeBookmarkIds(null), []);
      assert.deepEqual(normalizeBookmarkIds(undefined), []);
      assert.deepEqual(normalizeBookmarkIds('not-an-array'), []);
    });

    it('matchesBookmarkId accurately compares numbers and numeric strings', () => {
      assert.equal(matchesBookmarkId(1, '1'), true);
      assert.equal(matchesBookmarkId('1', 1), true);
      assert.equal(matchesBookmarkId(' 1 ', 1), true);
      assert.equal(matchesBookmarkId(1, 1), true);
    });

    it('matchesBookmarkId accurately compares ObjectId and slug strings', () => {
      const idA = '654321654321654321654321';
      const idB = '654321654321654321654321';
      assert.equal(matchesBookmarkId(idA, idB), true);
      assert.equal(matchesBookmarkId('course-react', 'course-react'), true);
    });

    it('matchesBookmarkId returns false for mismatched IDs or missing inputs', () => {
      assert.equal(matchesBookmarkId(1, 2), false);
      assert.equal(matchesBookmarkId('1', '2'), false);
      assert.equal(matchesBookmarkId(null, 1), false);
      assert.equal(matchesBookmarkId(1, undefined), false);
      assert.equal(matchesBookmarkId(null, null), false);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Token Storage Architecture (authService.js)
  // ---------------------------------------------------------------------------
  describe('authService: Token Storage Isolation', () => {
    it('tokenStorage sets, retrieves, and removes JWT tokens', () => {
      assert.equal(tokenStorage.get(), null);
      tokenStorage.set('jwt-token-12345');
      assert.equal(tokenStorage.get(), 'jwt-token-12345');
      tokenStorage.remove();
      assert.equal(tokenStorage.get(), null);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. goalService: Authentication Guards & Validation
  // ---------------------------------------------------------------------------
  describe('goalService: Authentication Guards & Validation', () => {
    it('getGoals rejects with HTTP 401 when token is missing', async () => {
      await assert.rejects(
        async () => {
          await goalService.getGoals({ token: '' });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /Authentication required/i);
          return true;
        }
      );
    });

    it('getGoalById rejects with HTTP 401 when token is missing', async () => {
      await assert.rejects(
        async () => {
          await goalService.getGoalById('goal123', { token: '' });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /Authentication required/i);
          return true;
        }
      );
    });

    it('getGoalById validates goalId before network call', async () => {
      await assert.rejects(
        async () => {
          await goalService.getGoalById('', { token: 'mock-token' });
        },
        /Goal ID is required/i
      );

      await assert.rejects(
        async () => {
          await goalService.getGoalById(null, { token: 'mock-token' });
        },
        /Goal ID is required/i
      );
    });

    it('createGoal rejects with HTTP 401 when token is missing', async () => {
      await assert.rejects(
        async () => {
          await goalService.createGoal({ title: 'New Goal' }, { token: '' });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /Authentication required/i);
          return true;
        }
      );
    });

    it('createGoal validates title and data object before network call', async () => {
      await assert.rejects(
        async () => {
          await goalService.createGoal(null, { token: 'mock-token' });
        },
        /Goal data is required/i
      );

      await assert.rejects(
        async () => {
          await goalService.createGoal({ title: '' }, { token: 'mock-token' });
        },
        /Goal title is required/i
      );

      await assert.rejects(
        async () => {
          await goalService.createGoal({ title: '   ' }, { token: 'mock-token' });
        },
        /Goal title is required/i
      );
    });

    it('updateGoal rejects with HTTP 401 when token is missing', async () => {
      await assert.rejects(
        async () => {
          await goalService.updateGoal('goal123', { title: 'Updated' }, { token: '' });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /Authentication required/i);
          return true;
        }
      );
    });

    it('updateGoal validates goalId and updates presence before network call', async () => {
      await assert.rejects(
        async () => {
          await goalService.updateGoal('', { title: 'Updated' }, { token: 'mock-token' });
        },
        /Goal ID is required/i
      );

      await assert.rejects(
        async () => {
          await goalService.updateGoal('goal123', {}, { token: 'mock-token' });
        },
        /At least one field update is required/i
      );
    });

    it('deleteGoal rejects with HTTP 401 when token is missing', async () => {
      await assert.rejects(
        async () => {
          await goalService.deleteGoal('goal123', { token: '' });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /Authentication required/i);
          return true;
        }
      );
    });

    it('deleteGoal validates goalId before network call', async () => {
      await assert.rejects(
        async () => {
          await goalService.deleteGoal('', { token: 'mock-token' });
        },
        /Goal ID is required/i
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 8. goalService: Headers, Request Construction & Status Filtering
  // ---------------------------------------------------------------------------
  describe('goalService: Headers, Request Construction & Status Filtering', () => {
    it('getGoals constructs Authorization header and passes ?status query param', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await goalService.getGoals({
        status: 'ACTIVE',
        token: 'test-goal-jwt',
      });

      assert.equal(capturedRequests.length, 1);
      const req = capturedRequests[0];
      assert.match(req.url, /\/api\/goals\?status=ACTIVE/);
      assert.equal(req.options.headers.Authorization, 'Bearer test-goal-jwt');
      assert.equal(req.options.headers.Accept, 'application/json');
    });

    it('getGoals omits status query when status is ALL', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
          status: 200,
        });
      };

      await goalService.getGoals({
        status: 'ALL',
        token: 'test-goal-jwt',
      });

      assert.equal(capturedRequests.length, 1);
      assert.ok(!capturedRequests[0].url.includes('status='));
    });

    it('getGoals passes through AbortSignal to fetch', async () => {
      const controller = new AbortController();
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(JSON.stringify({ success: true, count: 0, data: [] }), {
          status: 200,
        });
      };

      await goalService.getGoals({
        token: 'test-goal-jwt',
        signal: controller.signal,
      });

      assert.equal(capturedRequests[0].options.signal, controller.signal);
    });

    it('createGoal sends POST request with correct payload and headers', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Learning goal created successfully.',
            data: { _id: 'goal-1', title: 'Learn React', currentLevel: 'BEGINNER' },
          }),
          { status: 201 }
        );
      };

      const payload = {
        title: 'Learn React',
        description: 'Frontend library',
        targetSkills: ['React', 'JavaScript'],
        weeklyHours: 10,
      };

      const result = await goalService.createGoal(payload, { token: 'jwt-alpha' });

      assert.equal(capturedRequests.length, 1);
      const req = capturedRequests[0];
      assert.equal(req.options.method, 'POST');
      assert.equal(req.options.headers.Authorization, 'Bearer jwt-alpha');
      assert.equal(req.options.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(req.options.body), payload);
      assert.equal(result.goal._id, 'goal-1');
    });

    it('updateGoal sends PATCH request with encoded URL and payload', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Learning goal updated successfully.',
            data: { _id: 'goal-1', title: 'Updated Goal Title', status: 'COMPLETED' },
          }),
          { status: 200 }
        );
      };

      const result = await goalService.updateGoal(
        'goal-1',
        { title: 'Updated Goal Title', status: 'COMPLETED' },
        { token: 'jwt-alpha' }
      );

      assert.equal(capturedRequests.length, 1);
      const req = capturedRequests[0];
      assert.match(req.url, /\/api\/goals\/goal-1$/);
      assert.equal(req.options.method, 'PATCH');
      assert.equal(req.options.headers.Authorization, 'Bearer jwt-alpha');
      assert.deepEqual(JSON.parse(req.options.body), {
        title: 'Updated Goal Title',
        status: 'COMPLETED',
      });
      assert.equal(result.goal.status, 'COMPLETED');
    });

    it('getGoalById sends GET request with encoded URL, headers and parses response', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(
          JSON.stringify({
            success: true,
            data: { _id: 'goal-456', title: 'Deep Learning', status: 'ACTIVE' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await goalService.getGoalById('goal-456', { token: 'jwt-alpha' });

      assert.equal(capturedRequests.length, 1);
      const req = capturedRequests[0];
      assert.match(req.url, /\/api\/goals\/goal-456$/);
      assert.equal(req.options.method, 'GET');
      assert.equal(req.options.headers.Authorization, 'Bearer jwt-alpha');
      assert.equal(req.options.headers.Accept, 'application/json');
      assert.equal(result._id, 'goal-456');
      assert.equal(result.title, 'Deep Learning');
    });

    it('getGoalById passes through AbortSignal to fetch', async () => {
      const controller = new AbortController();
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(
          JSON.stringify({ success: true, data: { _id: 'goal-789' } }),
          { status: 200 }
        );
      };

      await goalService.getGoalById('goal-789', {
        token: 'test-goal-jwt',
        signal: controller.signal,
      });

      assert.equal(capturedRequests[0].options.signal, controller.signal);
    });

    it('deleteGoal sends DELETE request with Authorization header', async () => {
      globalThis.fetch = async (url, options) => {
        capturedRequests.push({ url, options });
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Learning goal deleted successfully.',
          }),
          { status: 200 }
        );
      };

      const result = await goalService.deleteGoal('goal-1', { token: 'jwt-alpha' });

      assert.equal(capturedRequests.length, 1);
      const req = capturedRequests[0];
      assert.match(req.url, /\/api\/goals\/goal-1$/);
      assert.equal(req.options.method, 'DELETE');
      assert.equal(req.options.headers.Authorization, 'Bearer jwt-alpha');
      assert.equal(result.success, true);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. goalService: Response Parsing & Error Extraction
  // ---------------------------------------------------------------------------
  describe('goalService: Response Parsing & Error Extraction', () => {
    it('getGoals parses goals array and count', async () => {
      const mockGoals = [
        { _id: 'g1', title: 'Goal 1', status: 'ACTIVE' },
        { _id: 'g2', title: 'Goal 2', status: 'COMPLETED' },
      ];

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ success: true, count: 2, data: mockGoals }), {
          status: 200,
        });

      const { goals, count } = await goalService.getGoals({ token: 'jwt' });
      assert.equal(count, 2);
      assert.equal(goals.length, 2);
      assert.equal(goals[0].title, 'Goal 1');
    });

    it('handles non-200 responses by throwing structured error with status', async () => {
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            success: false,
            message: 'Weekly study hours must be a number between 1 and 168.',
          }),
          { status: 400 }
        );

      await assert.rejects(
        async () => {
          await goalService.createGoal({ title: 'Goal', weeklyHours: 999 }, { token: 'jwt' });
        },
        (err) => {
          assert.equal(err.status, 400);
          assert.match(err.message, /Weekly study hours must be a number/i);
          return true;
        }
      );
    });

    it('handles non-JSON error responses (e.g. HTML 502) with fallback error message and status', async () => {
      globalThis.fetch = async () =>
        new Response('<html><body>502 Bad Gateway</body></html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        });

      await assert.rejects(
        async () => {
          await goalService.getGoals({ token: 'jwt-alpha' });
        },
        (err) => {
          assert.equal(err.status, 502);
          assert.match(err.message, /Request failed with status 502/i);
          assert.deepEqual(err.data, {});
          return true;
        }
      );
    });
  });
});
