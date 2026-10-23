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
 * All 30 entries have been live-verified against authoritative documentation,
 * tutorials, official books, and learning platforms.
 */
export const VERIFIED_RESOURCE_METADATA = {
  1: {
    title: 'Getting Started with the Web',
    description:
      'A practical introduction to web development for absolute beginners, covering basic HTML structure, CSS styling, and JavaScript interactivity.',
    type: 'TUTORIAL',
    platform: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web',
    category: 'Web Development',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  2: {
    title: 'Reusing Logic with Custom Hooks',
    description:
      'Official guide to React custom hooks: extract stateful logic into reusable functions, share logic between components, and follow React hook conventions.',
    type: 'DOCUMENTATION',
    platform: 'React Team',
    url: 'https://react.dev/learn/reusing-logic-with-custom-hooks',
    category: 'Web Development',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  3: {
    title: 'Pandas Getting Started Tutorials',
    description:
      'Hands-on beginner tutorials for data analysis with pandas, covering data ingestion, filtering, aggregation, reshaping, and plotting.',
    type: 'TUTORIAL',
    platform: 'Pandas Dev Team',
    url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html',
    category: 'Data Science',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  4: {
    title: 'Figma Design Help & Tutorials',
    description:
      'Official documentation and learning guides for digital interface design, wireframing, components, and interactive prototyping in Figma.',
    type: 'TUTORIAL',
    platform: 'Figma',
    url: 'https://help.figma.com/hc/en-us/categories/360002042553-Figma-design',
    category: 'Design',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  5: {
    title: 'Next.js Official Learn Course',
    description:
      'Official interactive course to build full-stack web applications with Next.js, covering App Router, React Server Components, server actions, and deployment.',
    type: 'COURSE',
    platform: 'Vercel',
    url: 'https://nextjs.org/learn',
    category: 'Web Development',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  6: {
    title: 'TensorFlow Tutorials',
    description:
      'Comprehensive tutorials for machine learning and deep learning with TensorFlow and Keras, from beginner models to convolutional and recurrent neural networks.',
    type: 'TUTORIAL',
    platform: 'Google / TensorFlow Team',
    url: 'https://www.tensorflow.org/tutorials',
    category: 'Artificial Intelligence',
    difficulty: 'ADVANCED',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  7: {
    title: 'Introducing SwiftUI Tutorials',
    description:
      'Step-by-step interactive tutorials by Apple Developer to build native iOS user interfaces, manage state and data flow, and compose complex views.',
    type: 'TUTORIAL',
    platform: 'Apple Developer',
    url: 'https://developer.apple.com/tutorials/swiftui',
    category: 'Mobile Development',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  8: {
    title: 'OWASP Top 10 Standard',
    description:
      'The globally recognized standard security document for developers and web application security, documenting the most critical security risks and mitigations.',
    type: 'DOCUMENTATION',
    platform: 'OWASP Foundation',
    url: 'https://owasp.org/www-project-top-ten/',
    category: 'Security',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  9: {
    title: 'AWS Hands-On Tutorials',
    description:
      'Hands-on tutorials and architectural guides covering core AWS services (EC2, S3, RDS, Lambda). Free educational content; practical execution requires an active AWS account subject to Free Tier limits and cloud infrastructure billing.',
    type: 'TUTORIAL',
    platform: 'Amazon Web Services',
    url: 'https://aws.amazon.com/getting-started/hands-on/',
    category: 'Cloud',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  10: {
    title: 'The TypeScript Handbook',
    description:
      'The official guide to TypeScript, explaining type annotations, interfaces, generics, union types, and type narrowing for modern JavaScript developers.',
    type: 'DOCUMENTATION',
    platform: 'Microsoft',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    category: 'Web Development',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  11: {
    title: 'Docker Get Started Guide',
    description:
      'Official hands-on walkthrough to understand containerization, write Dockerfiles, build and run container images, use Docker Compose, and manage persistent volumes.',
    type: 'TUTORIAL',
    platform: 'Docker',
    url: 'https://docs.docker.com/get-started/',
    category: 'DevOps',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  12: {
    title: 'The Python Tutorial',
    description:
      'The official Python 3 tutorial introducing fundamental programming concepts, language syntax, control flow, data structures, functions, and standard modules.',
    type: 'TUTORIAL',
    platform: 'Python Software Foundation',
    url: 'https://docs.python.org/3/tutorial/',
    category: 'Data Science',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  13: {
    title: 'MDN CSS Layout Guide',
    description:
      'Comprehensive MDN guide on modern CSS layout mechanisms, including Flexbox, CSS Grid, multi-column layout, positioning, and responsive media queries.',
    type: 'TUTORIAL',
    platform: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout',
    category: 'Web Development',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  14: {
    title: 'A Tour of Go',
    description:
      'Interactive browser-based walkthrough introducing the Go programming language syntax, packages, basic types, methods, interfaces, and concurrency with goroutines and channels.',
    type: 'TUTORIAL',
    platform: 'Go.dev',
    url: 'https://go.dev/tour/',
    category: 'Backend Development',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  15: {
    title: 'Google Search Central SEO Starter Guide',
    description:
      'Official Google search engine optimization guide covering indexing, structured metadata, site hierarchy, content optimization, and mobile-friendly web practices.',
    type: 'DOCUMENTATION',
    platform: 'Google Search Central',
    url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    category: 'Marketing',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  16: {
    title: 'PortSwigger Web Security Academy',
    description:
      'Comprehensive hands-on training labs and materials covering modern web vulnerabilities, including SQL injection, cross-site scripting (XSS), CSRF, and authentication bypasses.',
    type: 'COURSE',
    platform: 'PortSwigger',
    url: 'https://portswigger.net/web-security/all-topics',
    category: 'Security',
    difficulty: 'ADVANCED',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  17: {
    title: 'Android Basics with Compose',
    description:
      'Official multi-unit curriculum from Google Developers teaching native Android app development using Kotlin and modern declarative UI with Jetpack Compose.',
    type: 'COURSE',
    platform: 'Google Developers',
    url: 'https://developer.android.com/courses/android-basics-compose/course',
    category: 'Mobile Development',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  18: {
    title: 'Finance Theory I',
    description:
      'Comprehensive MIT Sloan School of Management undergraduate course covering financial markets, valuation, discounted cash flow (DCF), risk and return, and capital budgeting.',
    type: 'COURSE',
    platform: 'MIT OpenCourseWare',
    url: 'https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/',
    category: 'Finance',
    difficulty: 'ADVANCED',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  19: {
    title: 'Unity Junior Programmer Pathway',
    description:
      'Official guided pathway from Unity Learn designed to teach core C# scripting, gameplay mechanics, animation, physics, and debugging in the Unity editor.',
    type: 'COURSE',
    platform: 'Unity Technologies',
    url: 'https://learn.unity.com/pathway/junior-programmer',
    category: 'Game Development',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  20: {
    title: 'Introduction to GraphQL',
    description:
      'Official introduction to the GraphQL query language, schema definition language (SDL), type system, queries, mutations, and resolvers.',
    type: 'DOCUMENTATION',
    platform: 'GraphQL Foundation',
    url: 'https://graphql.org/learn/',
    category: 'Backend Development',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  21: {
    title: 'AI for Everyone',
    description:
      'Non-technical foundational course on artificial intelligence concepts, machine learning terminology, realistic AI capabilities, and societal impact. Free to audit video lectures and readings; paid enrollment required for graded assignments and verified certificates.',
    type: 'COURSE',
    platform: 'Coursera',
    url: 'https://www.coursera.org/learn/ai-for-everyone',
    category: 'Artificial Intelligence',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: 'Andrew Ng',
    rating: 0,
  },
  22: {
    title: 'Vue.js 3 Official Guide',
    description:
      'The official guide to Vue 3, covering template syntax, reactive state, components, directives, lifecycle hooks, and the Composition API.',
    type: 'DOCUMENTATION',
    platform: 'Vue.js',
    url: 'https://vuejs.org/guide/introduction.html',
    category: 'Web Development',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  23: {
    title: 'Ethereum Developer Documentation',
    description:
      'Official community documentation for building on Ethereum, covering smart contracts, Solidity, transactions, the EVM, and decentralized applications (dapps).',
    type: 'DOCUMENTATION',
    platform: 'Ethereum.org',
    url: 'https://ethereum.org/en/developers/docs/',
    category: 'Technology',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  24: {
    title: 'Node.js Official Learning Path',
    description:
      'Interactive tutorials and guides from the OpenJS Foundation covering asynchronous JavaScript, event loop, HTTP servers, modules, and streams in Node.js.',
    type: 'TUTORIAL',
    platform: 'OpenJS Foundation',
    url: 'https://nodejs.org/en/learn',
    category: 'Backend Development',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  25: {
    title: 'Cambridge in Colour Photography Tutorials',
    description:
      'Practical conceptual tutorials on digital photography fundamentals, shutter speed, aperture, ISO, exposure, camera sensors, and lighting.',
    type: 'TUTORIAL',
    platform: 'Cambridge in Colour',
    url: 'https://www.cambridgeincolour.com/tutorials.htm',
    category: 'Creative',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  26: {
    title: 'Atlassian Agile Coach Guides',
    description:
      'In-depth reference guides on modern agile software delivery frameworks, Scrum ceremonies, Kanban boards, sprint estimation, and backlog grooming.',
    type: 'DOCUMENTATION',
    platform: 'Atlassian',
    url: 'https://www.atlassian.com/agile',
    category: 'Business',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  27: {
    title: 'The Rust Programming Language',
    description:
      'Affectionately known as "the Book", the official definitive book on Rust, covering ownership, borrowing, lifetimes, pattern matching, error handling, and safe concurrency.',
    type: 'BOOK',
    platform: 'Rust Foundation',
    url: 'https://doc.rust-lang.org/book/',
    category: 'Backend Development',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: 'Steve Klabnik and Carol Nichols',
    rating: 0,
  },
  28: {
    title: 'PostgreSQL Official Tutorial',
    description:
      'Official tutorial for PostgreSQL, introducing relational database concepts, SQL querying, table creation, joins, aggregations, updates, and transactions.',
    type: 'TUTORIAL',
    platform: 'PostgreSQL Global Development Group',
    url: 'https://www.postgresql.org/docs/current/tutorial.html',
    category: 'Data Science',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
  29: {
    title: 'The Scrum Guide',
    description:
      'The definitive 13-page guide to Scrum: the rules of the game. Covers Scrum theory, values, accountabilities, events, and artifacts.',
    type: 'DOCUMENTATION',
    platform: 'Scrum.org',
    url: 'https://www.scrum.org/resources/scrum-guide',
    category: 'Business',
    difficulty: 'BEGINNER',
    estimatedDuration: 0,
    instructor: 'Ken Schwaber and Jeff Sutherland',
    rating: 0,
  },
  30: {
    title: 'Blender Official User Manual',
    description:
      'Official comprehensive documentation and reference manual for the open-source 3D suite, covering 3D modeling, sculpting, UV unwrapping, materials, lighting, and rendering.',
    type: 'DOCUMENTATION',
    platform: 'Blender Foundation',
    url: 'https://docs.blender.org/manual/en/latest/',
    category: 'Design',
    difficulty: 'INTERMEDIATE',
    estimatedDuration: 0,
    instructor: '',
    rating: 0,
  },
};

/**
 * Maps difficulty strings from courses.js to approved Resource enums.
 */
export const mapDifficulty = (level) => {
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
export const mapModules = (syllabus) => {
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
export const parseDuration = (durationStr) => {
  if (!durationStr) return 0;
  const parsed = parseInt(durationStr, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Maps course and verified metadata to a validated Resource schema object.
 */
export const buildMappedResource = (course, verifiedMeta) => {
  return {
    sourceId: course.id,
    title: (verifiedMeta.title || course.title).trim(),
    description: (verifiedMeta.description || course.description).trim(),
    type: verifiedMeta.type,
    platform: (verifiedMeta.platform || '').trim(),
    url: verifiedMeta.url,
    category: verifiedMeta.category || course.category || '',
    difficulty: verifiedMeta.difficulty || mapDifficulty(course.level),
    estimatedDuration:
      typeof verifiedMeta.estimatedDuration === 'number'
        ? verifiedMeta.estimatedDuration
        : 0,
    skills:
      verifiedMeta.skills ||
      (Array.isArray(course.tags) ? course.tags.map((t) => t.trim()) : []),
    modules: verifiedMeta.modules || mapModules(course.syllabus),
    thumbnail: course.thumbnail || '',
    instructor: verifiedMeta.instructor || '',
    rating: typeof verifiedMeta.rating === 'number' ? verifiedMeta.rating : 0,
  };
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
      const mappedResource = buildMappedResource(course, verifiedMeta);

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
