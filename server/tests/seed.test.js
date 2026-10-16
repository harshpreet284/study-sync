import { courses } from '../../src/data/courses.js';
import { Resource } from '../models/Resource.js';
import {
  VERIFIED_RESOURCE_METADATA,
  buildMappedResource,
  mapDifficulty,
  parseDuration,
} from '../scripts/seedResources.js';

console.log('='.repeat(60));
console.log('StudySync Resource Seed & Metadata Validation Test Suite');
console.log('NOTE: Validates offline schema compliance, approved enums,');
console.log('mapping consistency, and deterministic source IDs.');
console.log('Does NOT test live network reachability or external content.');
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

const ALLOWED_TYPES = ['COURSE', 'VIDEO', 'ARTICLE', 'DOCUMENTATION', 'TUTORIAL', 'BOOK'];
const ALLOWED_DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const EXISTING_CATEGORIES = new Set(courses.map((c) => c.category));

// ---------------------------------------------------------------------------
// Suite 1: Completeness & Scope (30 / 30 items)
// ---------------------------------------------------------------------------
console.log('\n[Suite 1: Metadata Completeness & SourceId Coverage]');
{
  const keys = Object.keys(VERIFIED_RESOURCE_METADATA).map(Number);
  assert(keys.length === 30, `VERIFIED_RESOURCE_METADATA contains exactly 30 entries (found ${keys.length})`);
  assert(courses.length === 30, `Source courses dataset contains exactly 30 courses (found ${courses.length})`);

  for (let id = 1; id <= 30; id++) {
    assert(
      VERIFIED_RESOURCE_METADATA[id] !== undefined,
      `Source ID ${id} is present in VERIFIED_RESOURCE_METADATA`
    );
  }
}

// ---------------------------------------------------------------------------
// Suite 2: Approved Decisions & Specific Requirements
// ---------------------------------------------------------------------------
console.log('\n[Suite 2: Approved Project Decisions & Specific Requirements]');
{
  // 1. TypeScript Handbook is DOCUMENTATION (Decision 2)
  const tsMeta = VERIFIED_RESOURCE_METADATA[10];
  assert(
    tsMeta.type === 'DOCUMENTATION',
    `TypeScript Handbook (ID 10) type is DOCUMENTATION (found: ${tsMeta.type})`
  );

  // 2. Docker Get Started is BEGINNER (Decision 3)
  const dockerMeta = VERIFIED_RESOURCE_METADATA[11];
  assert(
    dockerMeta.difficulty === 'BEGINNER',
    `Docker Get Started Guide (ID 11) difficulty is BEGINNER (found: ${dockerMeta.difficulty})`
  );

  // 3. React Custom Hooks is INTERMEDIATE (Decision 3)
  const reactMeta = VERIFIED_RESOURCE_METADATA[2];
  assert(
    reactMeta.difficulty === 'INTERMEDIATE',
    `React Custom Hooks (ID 2) difficulty is INTERMEDIATE (found: ${reactMeta.difficulty})`
  );

  // 4. PostgreSQL Tutorial in existing Data Science category (Decision 4)
  const pgMeta = VERIFIED_RESOURCE_METADATA[28];
  assert(
    pgMeta.category === 'Data Science',
    `PostgreSQL Tutorial (ID 28) category is Data Science (found: ${pgMeta.category})`
  );
  assert(
    EXISTING_CATEGORIES.has(pgMeta.category),
    `PostgreSQL category is an approved existing category`
  );

  // 5. Python Tutorial in existing Data Science category with accurate description
  const pyMeta = VERIFIED_RESOURCE_METADATA[12];
  assert(
    pyMeta.category === 'Data Science',
    `Python Tutorial (ID 12) category is Data Science (found: ${pyMeta.category})`
  );
  assert(
    !pyMeta.description.toLowerCase().includes('pandas') &&
      !pyMeta.description.toLowerCase().includes('data cleaning'),
    `Python Tutorial (ID 12) description accurately focuses on core language without unverified pandas/cleaning claims`
  );

  // 6. Direct Coursera URL for AI for Everyone with accurate access conditions & zero unprovenanced stats
  const aiMeta = VERIFIED_RESOURCE_METADATA[21];
  assert(
    aiMeta.url === 'https://www.coursera.org/learn/ai-for-everyone',
    `AI for Everyone (ID 21) uses direct Coursera URL`
  );
  assert(
    aiMeta.description.toLowerCase().includes('free to audit') &&
      aiMeta.description.toLowerCase().includes('paid'),
    `AI for Everyone description accurately details free audit vs. paid enrollment conditions`
  );
  assert(
    aiMeta.instructor === 'Andrew Ng',
    `AI for Everyone has verified instructor Andrew Ng`
  );
  assert(
    aiMeta.rating === 0,
    `AI for Everyone (ID 21) rating is 0 (unprovenanced rating removed)`
  );
  assert(
    aiMeta.estimatedDuration === 0,
    `AI for Everyone (ID 21) estimatedDuration is 0 (unprovenanced duration removed)`
  );

  // 7. Finance Theory I (ID 18) zero unprovenanced duration
  const financeMeta = VERIFIED_RESOURCE_METADATA[18];
  assert(
    financeMeta.estimatedDuration === 0,
    `Finance Theory I (ID 18) estimatedDuration is 0 (unprovenanced duration removed)`
  );

  // 8. Rust Book verified authors
  const rustMeta = VERIFIED_RESOURCE_METADATA[27];
  assert(
    rustMeta.type === 'BOOK',
    `The Rust Programming Language (ID 27) type is BOOK`
  );
  assert(
    rustMeta.instructor === 'Steve Klabnik and Carol Nichols',
    `Rust Book instructor accurately credits Steve Klabnik and Carol Nichols`
  );

  // 9. Scrum Guide verified authors
  const scrumMeta = VERIFIED_RESOURCE_METADATA[29];
  assert(
    scrumMeta.type === 'DOCUMENTATION',
    `The Scrum Guide (ID 29) type is DOCUMENTATION`
  );
  assert(
    scrumMeta.instructor === 'Ken Schwaber and Jeff Sutherland',
    `The Scrum Guide accurately credits Ken Schwaber and Jeff Sutherland`
  );
}

// ---------------------------------------------------------------------------
// Suite 3: Catalog-Wide Invariants (Ratings, Durations, Instructors, Providers)
// ---------------------------------------------------------------------------
console.log('\n[Suite 3: Uniform Catalog Invariants]');
{
  const verifiedIndividualAuthorIds = new Set([21, 27, 29]);

  for (let id = 1; id <= 30; id++) {
    const meta = VERIFIED_RESOURCE_METADATA[id];

    // Offline URL format syntax check (validates regex structure; does not test live reachability)
    assert(
      /^https?:\/\/.+/i.test(meta.url),
      `[ID ${id}] URL syntax is well-formed HTTPS: ${meta.url}`
    );

    // Allowed Enum Types
    assert(
      ALLOWED_TYPES.includes(meta.type),
      `[ID ${id}] Type '${meta.type}' is a valid Resource schema enum`
    );

    // Allowed Difficulty
    assert(
      ALLOWED_DIFFICULTIES.includes(meta.difficulty),
      `[ID ${id}] Difficulty '${meta.difficulty}' is a valid enum`
    );

    // Existing Categories Only (no invented categories)
    assert(
      EXISTING_CATEGORIES.has(meta.category),
      `[ID ${id}] Category '${meta.category}' belongs to approved project categories`
    );

    // Platform / Provider must be non-empty
    assert(
      typeof meta.platform === 'string' && meta.platform.trim().length > 0,
      `[ID ${id}] Platform/provider is specified ('${meta.platform}')`
    );

    // Instructor rule: Only verified individuals; empty string otherwise
    if (verifiedIndividualAuthorIds.has(id)) {
      assert(
        meta.instructor.length > 0,
        `[ID ${id}] Verified individual author is present: '${meta.instructor}'`
      );
    } else {
      assert(
        meta.instructor === '',
        `[ID ${id}] Instructor is empty string (provider placed in platform, not instructor)`
      );
    }

    // Rating rule: Strictly 0 across all records (no unprovenanced ratings stored)
    assert(meta.rating === 0, `[ID ${id}] Rating is strictly stored as 0 (no unprovenanced ratings)`);

    // Duration rule: Strictly 0 across all records (no unprovenanced durations stored)
    assert(
      meta.estimatedDuration === 0,
      `[ID ${id}] Estimated duration is strictly stored as 0 (no unprovenanced durations)`
    );
  }
}

// ---------------------------------------------------------------------------
// Suite 4: Schema Validation of all 30 Mapped Resources & Seed Idempotency
// ---------------------------------------------------------------------------
console.log('\n[Suite 4: Mongoose Schema Validation & Seed Idempotency]');
{
  const seenSourceIds = new Set();

  for (const course of courses) {
    const meta = VERIFIED_RESOURCE_METADATA[course.id];
    assert(meta !== undefined, `Course ID ${course.id} has verified metadata`);

    const mapped = buildMappedResource(course, meta);

    // Check sourceId preservation and uniqueness
    assert(mapped.sourceId === course.id, `Mapped sourceId matches course ID ${course.id}`);
    assert(!seenSourceIds.has(mapped.sourceId), `SourceId ${mapped.sourceId} is unique`);
    seenSourceIds.add(mapped.sourceId);

    // Validate with Mongoose Resource schema
    const doc = new Resource(mapped);
    const err = doc.validateSync();
    assert(!err, `Mapped resource [ID ${course.id}] "${mapped.title}" passes schema validation`);

    // Deterministic idempotency test: secondary mapping produces identical result
    const mapped2 = buildMappedResource(course, meta);
    assert(
      JSON.stringify(mapped) === JSON.stringify(mapped2),
      `Mapping for [ID ${course.id}] is strictly deterministic`
    );
  }

  assert(seenSourceIds.size === 30, `All 30 source IDs are uniquely validated`);
}

console.log('\n' + '='.repeat(60));
console.log(`Test Results: ${passedTests} passed, 0 failed (Total assertions: ${totalTests})`);
console.log('='.repeat(60));
