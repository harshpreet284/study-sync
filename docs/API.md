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

Purpose:
Generate or regenerate a personalized AI study plan for an existing learning goal.

Authentication: Required (`Authorization: Bearer <token>`)

Rate Limit: 5 requests per 15 minutes per authenticated user.

Request Body:
```json
{
  "goalId": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

Requirements:
- Client must provide a valid 24-character hexadecimal `goalId`.
- The target goal must exist and belong strictly to the authenticated user.
- Goal target skills are matched against catalog resources.
- If no matching catalog resources exist, returns a controlled 400 Bad Request without calling the AI provider.
- In test/mock mode (`NODE_ENV === 'test'` or `AI_PROVIDER === 'mock'`), generates a deterministic plan without external network requests.
- In production, calls Groq API using structured JSON Schema (`openai/gpt-oss-20b` default) with a 15-second timeout.
- Treats AI output as untrusted: strictly validates sequential week numbers (1..12), non-empty focus and tasks, and verifies every referenced resource ID is an approved catalog candidate. Rejects unapproved or hallucinated resource IDs with 422 before persistence.
- Upserts the canonical `LearningPlan` atomically by `{ user, goal }` so that regeneration updates the existing plan in-place without creating duplicates.
- Returns the plan populated with resource and goal metadata.

Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "Learning plan generated successfully.",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "user": "65f1a2b3c4d5e6f7a8b9c0d0",
    "goal": {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Master React & TypeScript",
      "description": "Proficient component development",
      "targetSkills": ["React", "TypeScript"],
      "currentLevel": "beginner",
      "weeklyHours": 10,
      "targetDate": "2026-11-20T00:00:00.000Z",
      "status": "in-progress"
    },
    "generatedAt": "2026-10-20T21:40:00.000Z",
    "weeks": [
      {
        "weekNumber": 1,
        "focus": "Week 1: Mastering React with Modern React Deep Dive",
        "resources": [
          {
            "_id": "65f1a2b3c4d5e6f7a8b9c0d3",
            "title": "Modern React Deep Dive",
            "type": "course",
            "difficulty": "intermediate",
            "estimatedDuration": 12,
            "platform": "StudySync Academy",
            "url": "https://example.com/react-deep-dive",
            "category": "Web Development",
            "skills": ["React", "JavaScript"]
          }
        ],
        "tasks": [
          "Complete introductory modules for Modern React Deep Dive",
          "Practice hands-on exercises focused on React",
          "Review key takeaways and test comprehension"
        ]
      }
    ],
    "createdAt": "2026-10-20T21:40:00.000Z",
    "updatedAt": "2026-10-20T21:40:00.000Z"
  }
}
```

Error Responses:
- `400 Bad Request`: Missing/malformed `goalId`, or insufficient catalog resources matching the goal's target skills.
- `401 Unauthorized`: Missing, expired, or invalid Bearer token.
- `404 Not Found`: Goal does not exist or does not belong to the authenticated user.
- `422 Unprocessable Entity`: AI-generated plan failed schema or resource candidate validation.
- `429 Too Many Requests`: Rate limit exceeded (5 requests per 15 minutes per authenticated user).
- `500 Internal Server Error`: Server configuration error (e.g. missing `GROQ_API_KEY` in production).
- `502 Bad Gateway`: AI provider service unavailable or malformed response.
- `504 Gateway Timeout`: AI provider request timed out after 15 seconds.

### GET /api/plans/:id

Purpose:
Retrieve a single study plan by its plan ID.

Authentication: Required (`Authorization: Bearer <token>`)

Requirements:
- Plan must exist and belong strictly to the authenticated user (`{ _id: id, user: req.user._id }`).
- Cross-user access returns 404 Not Found without disclosing plan existence.
- Populates referenced resource metadata and associated goal metadata.

Success Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "user": "65f1a2b3c4d5e6f7a8b9c0d0",
    "goal": { ... },
    "generatedAt": "2026-10-20T21:40:00.000Z",
    "weeks": [ ... ]
  }
}
```

Error Responses:
- `400 Bad Request`: Invalid plan ID format.
- `401 Unauthorized`: Missing or invalid token.
- `404 Not Found`: Plan does not exist or does not belong to the authenticated user.

### GET /api/plans/goal/:goalId

Purpose:
Retrieve the current study plan associated with a specific learning goal.

Authentication: Required (`Authorization: Bearer <token>`)

Requirements:
- The referenced goal must exist and belong strictly to the authenticated user.
- If the goal belongs to another user or does not exist, returns `404 Not Found`.
- If the goal belongs to the user but no plan has been generated yet, returns `200 OK` with `data: null`.
- If a plan exists, returns `200 OK` with the populated plan.

Success Response — Plan Exists (`200 OK`):
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "user": "65f1a2b3c4d5e6f7a8b9c0d0",
    "goal": { ... },
    "generatedAt": "2026-10-20T21:40:00.000Z",
    "weeks": [ ... ]
  }
}
```

Success Response — No Plan Yet (`200 OK`):
```json
{
  "success": true,
  "data": null,
  "message": "No study plan has been generated for this goal yet."
}
```

Error Responses:
- `400 Bad Request`: Invalid goal ID format.
- `401 Unauthorized`: Missing or invalid token.
- `404 Not Found`: Goal does not exist or does not belong to the authenticated user.


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
