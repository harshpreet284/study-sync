import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { Resource } from '../models/Resource.js';
import { courses } from '../../src/data/courses.js';

// Resolve directory and load environment variables safely
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Curated and verified external learning URLs and resource types.
 *
 * In accordance with Phase 2 rules:
 * - Only authentic, verified external educational URLs are mapped.
 * - Fictional or unverified courses are intentionally omitted here so they
 *   are safely skipped and reported, without inventing fake URLs or
 *   weakening Mongoose schema validation.
 */
const VERIFIED_RESOURCE_METADATA = {
  14: {
    type: 'TUTORIAL',
    platform: 'Go.dev',
    url: 'https://go.dev/tour/',
  },
  17: {
    type: 'COURSE',
    platform: 'Google Developers',
    url: 'https://developer.android.com/courses',
  },
  20: {
    type: 'DOCUMENTATION',
    platform: 'GraphQL Foundation',
    url: 'https://graphql.org/learn/',
  },
  21: {
    type: 'COURSE',
    platform: 'DeepLearning.AI',
    url: 'https://www.deeplearning.ai/',
  },
  22: {
    type: 'DOCUMENTATION',
    platform: 'Vue.js',
    url: 'https://vuejs.org/guide/introduction.html',
  },
  23: {
    type: 'DOCUMENTATION',
    platform: 'Ethereum.org',
    url: 'https://ethereum.org/en/developers/docs/',
  },
  24: {
    type: 'DOCUMENTATION',
    platform: 'Node.js',
    url: 'https://nodejs.org/docs/latest/api/',
  },
  27: {
    type: 'BOOK',
    platform: 'Rust Foundation',
    url: 'https://doc.rust-lang.org/book/',
  },
  29: {
    type: 'COURSE',
    platform: 'Scrum.org',
    url: 'https://www.scrum.org/resources/scrum-guide',
  },
  30: {
    type: 'TUTORIAL',
    platform: 'Blender Guru',
    url: 'https://www.blenderguru.com/',
  },
};

/**
 * Maps difficulty strings from courses.js to approved Resource enums.
 */
const mapDifficulty = (level) => {
  if (!level) return 'BEGINNER';
  const upper = level.toUpperCase();
  if (['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(upper)) {
    return upper;
  }
  return 'BEGINNER';
};

/**
 * Maps syllabus array to embedded modules schema.
 */
const mapModules = (syllabus) => {
  if (!Array.isArray(syllabus)) return [];
  return syllabus.map((item, idx) => ({
    title: item.title || `Module ${idx + 1}`,
    description: item.description || '',
    order: item.week || idx + 1,
  }));
};

/**
 * Parses numeric hours from duration string (e.g., "12 hours" -> 12).
 */
const parseDuration = (durationStr) => {
  if (!durationStr) return 0;
  const parsed = parseInt(durationStr, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Executes repeatable and idempotent seed migration.
 */
export const runSeedMigration = async () => {
  console.log('='.repeat(60));
  console.log('StudySync Resource Seed Migration');
  console.log('='.repeat(60));

  const conn = await connectDB();
  if (!conn) {
    console.error('[Seed Error] Database connection failed. Aborting seed migration.');
    process.exit(1);
  }

  const stats = {
    total: courses.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    skippedRecords: [],
    failedRecords: [],
  };

  try {
    for (const course of courses) {
      const verifiedMeta = VERIFIED_RESOURCE_METADATA[course.id];

      // 1. Check for verified external URL and type
      if (!verifiedMeta || !verifiedMeta.url) {
        stats.skipped++;
        stats.skippedRecords.push({
          sourceId: course.id,
          title: course.title,
          instructor: course.instructor,
          reason: 'Missing/unverifiable external URL. Record was not invented or forced.',
        });
        continue;
      }

      // 2. Map course data to Resource schema
      const mappedResource = {
        sourceId: course.id,
        title: course.title.trim(),
        description: course.description.trim(),
        type: verifiedMeta.type,
        platform: verifiedMeta.platform || course.instructor || '',
        url: verifiedMeta.url,
        category: course.category || '',
        difficulty: mapDifficulty(course.level),
        estimatedDuration: parseDuration(course.duration),
        skills: Array.isArray(course.tags) ? course.tags.map((t) => t.trim()) : [],
        modules: mapModules(course.syllabus),
        thumbnail: course.thumbnail || '',
        instructor: course.instructor || '',
        rating: typeof course.rating === 'number' ? course.rating : 0,
      };

      // 3. Validate against Mongoose schema before database write
      const resourceDoc = new Resource(mappedResource);
      const validationError = resourceDoc.validateSync();
      if (validationError) {
        stats.failed++;
        stats.failedRecords.push({
          sourceId: course.id,
          title: course.title,
          errors: Object.keys(validationError.errors).map(
            (k) => validationError.errors[k].message
          ),
        });
        continue;
      }

      // 4. Safe, idempotent upsert using sourceId
      const existing = await Resource.findOne({ sourceId: course.id });
      if (existing) {
        await Resource.updateOne({ sourceId: course.id }, mappedResource);
        stats.updated++;
      } else {
        await Resource.create(mappedResource);
        stats.inserted++;
      }
    }

    // 5. Output Migration Summary
    console.log('\n--- Migration Results ---');
    console.log(`Total Source Courses:  ${stats.total}`);
    console.log(`Newly Inserted:        ${stats.inserted}`);
    console.log(`Updated (Existing):    ${stats.updated}`);
    console.log(`Skipped (Unverified):  ${stats.skipped}`);
    console.log(`Failed Validation:     ${stats.failed}`);

    if (stats.skippedRecords.length > 0) {
      console.log('\n--- Skipped Records Detail ---');
      stats.skippedRecords.forEach((r) => {
        console.log(`[ID ${r.sourceId}] "${r.title}" (Instructor: ${r.instructor}) -> ${r.reason}`);
      });
    }

    if (stats.failedRecords.length > 0) {
      console.log('\n--- Failed Records Detail ---');
      stats.failedRecords.forEach((r) => {
        console.error(`[ID ${r.sourceId}] "${r.title}" -> ${r.errors.join(', ')}`);
      });
      console.error('\n[Seed Error] Migration encountered validation failures.');
      await disconnectDB();
      process.exit(1);
    }

    console.log('\n✓ Seed migration completed successfully without errors.');
    await disconnectDB();
    return stats;
  } catch (error) {
    console.error('\n[Seed Error] Fatal error during seed migration:', error.message);
    await disconnectDB();
    process.exit(1);
  }
};

// Execute directly when run from CLI
if (process.argv[1] && process.argv[1].endsWith('seedResources.js')) {
  runSeedMigration();
}
