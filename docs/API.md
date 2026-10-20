# StudySync API Contract

## 1. Base URL

All application endpoints use the `/api` prefix.

Example:

`/api/resources`

## 2. Response Convention

Successful responses should use:

{
  "success": true,
  "data": {}
}

Error responses should use:

{
  "success": false,
  "message": "Human-readable error message"
}

Exact additional metadata may be added when useful, but responses should remain predictable.

## 3. Authentication

### POST /api/auth/register

Purpose:
Create a new user.

Request:
{
  "name": "User",
  "email": "user@example.com",
  "password": "password"
}

Requirements:
- Validate input
- Normalize email
- Reject duplicate email
- Hash password
- Create user
- Do not return passwordHash

### POST /api/auth/login

Purpose:
Authenticate a user.

Request:
{
  "email": "user@example.com",
  "password": "password"
}

Requirements:
- Validate credentials
- Generate authentication token/session state
- Return safe user information

### GET /api/auth/me

Authentication: Required

Purpose:
Return the currently authenticated user's safe profile.

## 4. Resources

### GET /api/resources

Authentication: Not required.

Purpose:
Return resources.

Supported query parameters may include:
- search
- difficulty
- type
- category

Query parameters may be combined.

The API should return data needed by the existing resource catalog.

### GET /api/resources/:id

Authentication: Not required.

Purpose:
Return a single resource and its details, including modules and skills where applicable.

## 5. Learning

### GET /api/learning

Authentication: Required.

Purpose:
Return the authenticated user's learning records.

### POST /api/learning

Authentication: Required.

Request:
{
  "resourceId": "..."
}

Requirements:
- Validate resource ID
- Verify resource exists
- Associate record with authenticated user
- Prevent inappropriate duplicates

### PATCH /api/learning/:id

Authentication: Required.

Request may include:
{
  "progress": 65,
  "status": "IN_PROGRESS"
}

Requirements:
- Verify learning record ownership
- Validate progress
- Validate status
- Set completion timestamp when appropriate

## 6. Goals

### GET /api/goals

Authentication: Required.

Purpose:
Return the authenticated user's goals.

### POST /api/goals

Authentication: Required.

Request:
{
  "title": "Become a MERN Developer",
  "description": "Build full-stack JavaScript applications",
  "targetSkills": [
    "JavaScript",
    "React",
    "Node.js",
    "Express",
    "MongoDB"
  ],
  "currentLevel": "BEGINNER",
  "weeklyHours": 10,
  "targetDate": "2026-12-01"
}

### GET /api/goals/:id

Authentication: Required.

Requirement:
The requested goal must belong to the authenticated user.

### PATCH /api/goals/:id

Authentication: Required.

Requirement:
The requested goal must belong to the authenticated user.

### DELETE /api/goals/:id

Authentication: Required.

Requirement:
The requested goal must belong to the authenticated user.

Responses:
- `200 OK`: Learning goal deleted successfully.
- `400 Bad Request`: Invalid goal ID format.
- `404 Not Found`: Goal does not exist or does not belong to the authenticated user.

## 7. Learning Plans

### POST /api/plans/generate

Authentication: Required.

Request:
{
  "goalId": "..."
}

Server flow:
1. Authenticate user.
2. Fetch goal.
3. Verify goal ownership.
4. Determine relevant available resources.
5. Construct AI input.
6. Call AI service.
7. Parse and validate structured output.
8. Validate referenced resource IDs.
9. Persist LearningPlan.
10. Return the saved plan.

The client does not provide the AI prompt.

### GET /api/plans/:id

Authentication: Required.

Requirement:
The requested plan must belong to the authenticated user.

## 8. Authorization

For user-owned endpoints:
- Identify user from authenticated request.
- Query the target record in the user's ownership context.
- Reject unauthorized access.

Changing an ID in a URL must never allow one user to access another user's data.

## 9. Validation Errors

Invalid client input should produce a controlled 4xx response.

Do not expose internal stack traces or sensitive implementation details.

## 10. AI Errors

AI provider failures, malformed AI output, timeouts, and rate limits should result in controlled application errors.

Raw provider errors should remain in server-side logs where appropriate.

## 11. API Design Principle

Keep the API small and aligned with actual product requirements.

Do not create endpoints for features that are not part of the approved MVP.
