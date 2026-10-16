# StudySync Database Specification

## 1. Database

Database: MongoDB
ODM: Mongoose

The MVP uses five core collections:

- users
- resources
- learningProgress
- learningGoals
- learningPlans

## 2. User

Fields:
- name: String, required
- email: String, required, unique, normalized
- passwordHash: String, required
- createdAt: Date

Rules:
- Email must be unique.
- Password must be hashed before storage.
- passwordHash must never be returned through normal API responses.

## 3. Resource

Fields:
- title: String, required
- description: String, required
- type: Enum, required
- platform: String
- url: String, required
- category: String
- difficulty: Enum
- estimatedDuration: Number
- skills: [String]
- modules: embedded array
- createdAt: Date

Resource types:
- COURSE
- VIDEO
- ARTICLE
- DOCUMENTATION
- TUTORIAL
- BOOK

Modules are embedded because modules do not need an independent lifecycle in the MVP.

Conceptual module fields:
- title
- description
- order

Resources are global and are not owned by individual users.

## 4. LearningProgress

Fields:
- user: ObjectId reference to User, required
- resource: ObjectId reference to Resource, required
- status: Enum
- progress: Number
- startedAt: Date
- completedAt: Date

Status:
- NOT_STARTED
- IN_PROGRESS
- COMPLETED

Progress must be within 0–100.

A LearningProgress record belongs to one user and one resource.

The same user's duplicate learning record for the same resource should be prevented where appropriate.

## 5. LearningGoal

Fields:
- user: ObjectId reference to User, required
- title: String, required
- description: String
- targetSkills: [String]
- currentLevel: Enum
- weeklyHours: Number
- targetDate: Date
- status: Enum
- createdAt: Date

Current levels:
- BEGINNER
- INTERMEDIATE
- ADVANCED

Goal status:
- ACTIVE
- COMPLETED
- ARCHIVED

Every goal belongs to exactly one user.

## 6. LearningPlan

Fields:
- user: ObjectId reference to User, required
- goal: ObjectId reference to LearningGoal, required
- generatedAt: Date
- weeks: embedded array

Week fields:
- weekNumber
- focus
- resources
- tasks

Resources inside a plan should reference actual Resource IDs available in StudySync.

Do not duplicate complete Resource documents inside plans.

For MVP, resource IDs are the canonical reference. Resource title changes do not require plan versioning or snapshots.

## 7. Relationships

User
├── LearningGoals
├── LearningProgress
└── LearningPlans

LearningProgress
└── Resource

LearningPlan
├── LearningGoal
└── Resource references

Resource
└── embedded Modules

## 8. Ownership Rules

User-owned collections must always be queried in the context of the authenticated user.

Never return or modify a goal, progress record, or plan solely because the supplied ID is valid.

The backend must verify ownership.

## 9. Validation

Validate:
- Required fields
- Email format and normalization
- Enum values
- Progress range
- Positive/valid weekly hours
- Valid dates
- Valid ObjectIds
- Resource references
- AI-generated plan structure

## 10. Indexing

Add indexes only when supported by actual query patterns.

At minimum, uniqueness is required for User.email.

Additional indexes should be introduced when resource search or user-specific queries demonstrate a need.

Do not add indexes purely for appearance.

## 11. Seeding

Existing StudySync resource data should be migrated into MongoDB through a controlled seed process.

The seed process should be repeatable and safe to run intentionally.

The existing static resource data should be preserved as the source material for the initial seed rather than manually recreating resources from scratch.
