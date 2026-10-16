# StudySync Product Specification

## 1. Product Overview

StudySync is a personal learning workspace for self-taught and beginner developers learning software development independently.

The application helps users turn a broad learning goal into a structured learning process by combining learning-resource discovery, personal organization, AI-assisted study planning, and progress tracking.

StudySync does not host educational content. It organizes and manages external learning resources.

## 2. Target User

The primary target user is:
- A self-taught developer
- A beginner or early-stage developer
- Someone learning software development independently
- Someone who has access to many learning resources but struggles to organize them into a structured learning process

StudySync is not primarily designed as:
- A course marketplace
- A traditional learning management system
- A social learning network
- An AI coding tutor
- A career/job platform

## 3. Problem

Self-directed developers have access to a large number of courses, tutorials, videos, articles, documentation, and books.

Having access to these resources does not necessarily provide a structured learning process.

Learners may:
- Save too many resources
- Start multiple resources without a clear sequence
- Lose track of what they are currently learning
- Struggle to decide what to study next
- Have difficulty creating a realistic learning schedule around their available time
- Lose visibility into their overall progress toward a learning goal

StudySync addresses the organizational and planning gap between having learning resources and using them as part of a structured learning process.

## 4. Solution

StudySync provides a centralized workspace where a learner can:
1. Define a learning goal
2. Discover relevant learning resources
3. Add resources to their personal learning library
4. Generate an AI-assisted study plan
5. Work through resources and tasks
6. Track progress
7. Determine the next step in their learning plan

The core product loop is:

Goal → Resources → AI Plan → Learn → Track → Next Step

## 5. Core Product Concept

The core entity in StudySync is a Learning Resource.

A learning resource can be:
- COURSE
- VIDEO
- ARTICLE
- DOCUMENTATION
- TUTORIAL
- BOOK

StudySync does not host the resource content itself. Resources contain external URLs and metadata that allow learners to organize and access them.

Resources can be associated with coarse-grained skills such as:
- JavaScript
- React
- Node.js
- Express
- MongoDB
- REST APIs
- Authentication
- Git

A large or complex skill taxonomy is not part of the MVP.

## 6. MVP Features

### 6.1 Authentication
Users can register, log in, log out, and access personal learning data through their account.

### 6.2 Resource Discovery
Users can browse, search, filter, and view resource details, including type, platform/source, difficulty, estimated duration, skills, and modules where applicable.

The existing resource-discovery experience should be preserved and extended rather than unnecessarily redesigned.

### 6.3 Personal Learning Library
Authenticated users can save resources, start learning, track progress, and mark resources completed.

The existing localStorage-based bookmarking behavior will eventually be migrated to persistent backend data associated with the authenticated user.

### 6.4 Learning Goals
Users can create and manage goals containing title, description, target skills, current level, weekly available study hours, target completion date, and status.

### 6.5 AI Study Planning
StudySync includes one primary AI feature: AI-assisted study-plan generation.

The AI uses the learner's goal, current level, target skills, weekly available study time, target timeframe, and relevant resources available in StudySync.

The AI generates a structured learning plan containing weeks, weekly focus, relevant StudySync resources, and learning tasks.

The AI should use resources already available in StudySync rather than inventing external resources or URLs.

AI output must be validated by the backend before being persisted.

### 6.6 Progress Tracking
Users can track status, percentage completion, start date, and completion date where applicable.

Progress is user-specific.

### 6.7 Next-Step Recommendations
StudySync determines the next learning step using application logic based on the user's learning plan and progress. The next-step system does not require an AI request.

### 6.8 Dashboard
Authenticated users have a dashboard showing active learning goal, overall progress, current resource, current plan/week, next learning step, and learning-library summary.

Dashboard information must come from actual application data.

## 7. AI Boundary

AI is an assisting component, not the entire application.

AI is responsible primarily for transforming learner goals and constraints into a structured study plan, organizing relevant available resources, and generating study tasks.

AI is not responsible for authentication, authorization, database permissions, progress tracking, determining whether a resource exists, directly modifying arbitrary database records, security decisions, navigation, or deterministic next-step calculations.

The backend validates and persists AI-generated data.

## 8. MVP Non-Goals

The following are outside the MVP:
- AI chatbot
- AI tutor
- AI code reviewer
- AI interviewer
- GitHub integration
- Social networking
- Community features
- Leaderboards
- Certificates
- Course marketplace
- AI-generated courses
- Job matching
- Career platform functionality
- Complex skill graphs
- Multiple AI agents
- Payment system
- Admin dashboard
- Advanced notification system
- AI-generated external resource discovery

These must not be added during MVP implementation without explicit approval.

## 9. Product Scope Principle

StudySync should prioritize a coherent learning workflow over feature count.

The project should not add functionality simply to appear more sophisticated.

Every new feature should be evaluated against the core problem and MVP boundaries.

## 10. Existing Frontend Preservation

StudySync is an existing frontend application being upgraded into a full-stack application.

The existing visual identity was intentionally designed before the upgrade.

Preserve the existing color palette, typography, visual language, spacing conventions, component styling, page personality, and responsive behavior unless explicitly approved otherwise.

New functionality should visually belong to the existing StudySync product.

The application should not be transformed into a generic AI/SaaS dashboard aesthetic.

## 11. Product Success Criteria

The MVP should support:

Register/Login
→ Define a learning goal
→ Discover relevant resources
→ Add resources to personal learning
→ Generate a study plan
→ Follow the plan
→ Track progress
→ Identify the next learning step

The MVP is successful when this workflow works reliably using persistent backend data and the AI feature adds meaningful personalization without taking over responsibilities that belong to normal application logic.
