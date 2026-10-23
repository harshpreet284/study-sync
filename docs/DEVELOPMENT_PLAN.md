# StudySync Development Plan

## 1. Development Principle

Build StudySync incrementally.

Use one meaningful feature/task at a time.

For each task:
1. Inspect relevant existing code.
2. Understand dependencies.
3. Make the smallest reasonable change.
4. Test the change.
5. Run a production/build check where appropriate.
6. Review the diff.
7. Commit a clean checkpoint.

Do not implement the entire application in one agent task.

## 2. Phase 1 — Backend Foundation

Objectives:
- Create backend structure
- Configure Express
- Configure environment variables
- Connect MongoDB
- Add centralized error handling
- Add health endpoint

Acceptance:
- Server starts
- Database connection works
- Health endpoint responds
- Existing frontend remains functional

Git checkpoint:
`chore: initialize backend foundation`

## 3. Phase 2 — Database Models and Seed Data

Objectives:
- Create User
- Resource
- LearningProgress
- LearningGoal
- LearningPlan
- Create controlled resource seed process
- Migrate existing resource data

Acceptance:
- Models validate
- Seed process creates expected resources
- Existing resource information is preserved

Git checkpoint:
`feat: add database models and resource seed data`

## 4. Phase 3 — Authentication

Objectives:
- Registration
- Login
- Authentication middleware
- Current-user endpoint
- Protected routes

Acceptance:
- Valid registration works
- Duplicate email rejected
- Passwords hashed
- Login works
- Protected endpoint rejects unauthenticated requests
- Invalid credentials handled safely

Git checkpoint:
`feat: add user authentication`

## 5. Phase 4 — Resource API and Frontend Migration

Objectives:
- Resource listing
- Search
- Filtering
- Resource detail
- Connect existing frontend to API
- Remove static runtime dependency only after API replacement works

Acceptance:
- Existing resource catalog works through backend
- Existing search/filter behavior remains functional
- Existing visual identity remains intact

Git checkpoint:
`feat: migrate resources to backend API`

## 6. Phase 5 — Personal Learning

Objectives:
- Add resource to learning
- Remove where appropriate
- Start learning
- Update progress
- Complete resource
- My Learning page
- Migrate bookmark persistence from localStorage to backend

Acceptance:
- User data persists across sessions
- Users cannot access another user's learning data
- Progress is correctly stored

Git checkpoint:
`feat: add persistent learning library`

## 7. Phase 6 — Learning Goals

Objectives:
- Create goal
- List goals
- View goal
- Edit goal
- Update goal status

Acceptance:
- Goal data persists
- Ownership checks work
- Validation works

Git checkpoint:
`feat: add learning goals`

## 8. Phase 7 — AI Study Planner

Objectives:
- AI service
- Backend prompt/context construction
- Relevant resource selection
- Structured output
- Validation
- Resource-reference validation
- Plan persistence
- Plan retrieval
- Controlled failure handling

Acceptance:
- Valid goal can generate a plan
- Generated plan references available resources
- Invalid AI output is rejected
- Provider failure is handled
- API key is server-side
- Excessive generation is reasonably protected

Git checkpoint:
`feat: add AI learning plan generation`

## 9. Phase 8 — Dashboard

Objectives:
- Display active goal
- Display overall progress
- Display current learning
- Display current plan/week
- Display next step
- Display learning-library summary

Acceptance:
- Dashboard uses real backend data
- No fabricated statistics
- Loading/empty/error states are handled
- Existing visual identity is preserved

Git checkpoint:
`feat: add learning dashboard`

## 10. Phase 9 — Testing and Hardening

Test critical flows:
- Register → Login
- Browse resources
- Add resource
- Track progress
- Complete resource
- Create goal
- Generate plan
- View plan
- Logout → Login → persistent data
- Cross-user authorization
- Invalid input
- AI failure cases

Also:
- Fix bugs
- Refactor unnecessary duplication
- Remove dead code
- Check console/server warnings
- Run production builds
- Perform security review

Git checkpoint:
`chore: harden application and add tests`

## 11. Phase 10 — Deployment

Objectives:
- Deploy frontend
- Deploy backend
- Configure MongoDB
- Configure production environment variables
- Configure CORS
- Verify AI integration
- Verify production build
- Test deployed critical flows

## 12. Git Strategy

Use:
- `main`
- feature branches for meaningful changes

Examples:
- feature/backend-foundation
- feature/authentication
- feature/resource-api
- feature/learning-library
- feature/learning-goals
- feature/ai-planner
- feature/dashboard

Keep commits focused and reversible.

## 13. Definition of Done

A meaningful task is complete when:
- Code is implemented
- Relevant changes are reviewed
- Tests pass or known failures are documented
- Build passes where applicable
- No unexpected errors remain
- Feature behavior is manually verified where appropriate
- Security implications are considered
- Git diff is reviewed
- A clean commit is created

## 14. Scope Control

Do not add non-MVP features during implementation without explicit approval.

If a potentially useful feature is discovered, record it separately rather than silently expanding the current task.

## 15. Agent Workflow

For substantial tasks, the agent should:
1. Read relevant rules and documentation.
2. Inspect the existing implementation.
3. Identify conflicts or assumptions.
4. Explain the intended change briefly.
5. Implement the task.
6. Test and build.
7. Report what changed, what was tested, assumptions, and unresolved issues.
8. Stop for review rather than continuing into unrelated work.
