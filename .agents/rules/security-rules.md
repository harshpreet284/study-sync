# StudySync Security Rules

These rules are non-negotiable unless explicitly reviewed and approved.

## Secrets

Never hardcode:
- AI provider API keys
- Database credentials
- JWT secrets
- Production credentials
- Other sensitive secrets

Use environment variables.

Never commit `.env` files containing secrets.

## Authentication

- Hash passwords before storage.
- Never store plaintext passwords.
- Validate login credentials safely.
- Protect authenticated endpoints with authentication middleware.
- Never return password hashes.

## Authorization

Authentication is not authorization.

For user-owned data, always verify that the authenticated user owns the requested record.

Protected user-owned entities include:
- LearningProgress
- LearningGoal
- LearningPlan

Never trust a client-supplied ID as proof of ownership.

## Input Validation

Validate all externally supplied input.

This includes:
- Request bodies
- Query parameters where appropriate
- URL parameters
- IDs
- Enum values
- Numeric ranges
- Dates

Do not rely solely on frontend validation.

## AI Security

AI API credentials must remain server-side.

The frontend must never call the AI provider directly using a secret credential.

AI output must be treated as untrusted input.

Validate:
- Structure
- Types
- Resource IDs
- Allowed values
- Required fields

Never allow AI output to directly perform arbitrary database operations.

## AI Abuse Protection

The AI generation endpoint is potentially expensive.

Apply reasonable rate/abuse protection appropriate to the application's scale.

Do not expose a public unauthenticated endpoint that can freely consume AI quota.

## CORS

Configure CORS deliberately for the application's intended frontend origins.

Do not use permissive production CORS settings without justification.

## Errors and Logging

Do not return:
- Stack traces
- Secrets
- Passwords
- Database credentials
- Internal sensitive details

Server logs may contain technical debugging information, but must not intentionally log secrets or passwords.

## User Data

Users must only be able to access their own private learning data.

Test cross-user authorization explicitly.

## Dependency Security

Use maintained dependencies where practical.

Do not install packages simply because an AI agent suggests them.

Before adding a dependency, determine whether it solves a real requirement and whether existing functionality can reasonably handle the need.

## Security Changes

If a feature conflicts with these rules, stop and explain the conflict before weakening the security boundary.
