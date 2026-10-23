# StudySync AI Feature Specification

## 1. Purpose

StudySync uses AI to generate personalized learning plans from a learner's goal, constraints, and available StudySync resources.

This is the primary AI feature in the MVP.

## 2. Why AI Is Used

A learning plan depends on multiple interacting inputs:
- Learning goal
- Current level
- Target skills
- Weekly available study time
- Target timeframe
- Available learning resources

The AI is useful for transforming these inputs into a structured and personalized sequence.

AI is not used merely to generate generic motivational text.

## 3. AI Inputs

The backend should construct the AI context from trusted application data.

Inputs include:
- Goal title
- Goal description
- Target skills
- Current level
- Weekly available hours
- Target date/timeframe
- Relevant StudySync resources

Relevant resources should include sufficient metadata such as:
- Resource ID
- Title
- Type
- Difficulty
- Estimated duration
- Skills
- Modules where useful

## 4. Resource Constraint

The AI must only reference resources supplied by the backend.

It must not invent:
- Resource IDs
- Course titles presented as StudySync resources
- External URLs
- Resources that do not exist in the StudySync database

The backend must validate every returned resource ID.

## 5. Expected Output

The AI should return structured data conceptually matching:

{
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "JavaScript Fundamentals",
      "resourceIds": ["resource-id"],
      "tasks": [
        "Review functions",
        "Practice arrays and objects"
      ]
    }
  ]
}

The exact schema should be implemented with a validation mechanism appropriate to the selected AI provider and backend stack.

## 6. Output Validation

AI output is untrusted input.

Validation must occur before persistence.

Validation should check:
- Valid JSON/structured response
- Required fields
- Correct data types
- Valid week numbers
- Valid resource IDs
- Non-empty meaningful content
- Reasonable structure
- No references to unavailable resources

Invalid output must not be persisted as a valid learning plan.

## 7. Insufficient Resources

If StudySync does not contain enough relevant resources for a meaningful plan, the application should not pretend that it can provide a complete high-quality plan.

The MVP should prefer a controlled insufficient-resource response over hallucinated external resources.

## 8. AI Failure Handling

Possible failures:
- Provider unavailable
- Timeout
- Rate limit
- Malformed output
- Validation failure
- Unexpected provider error

User-facing behavior should be controlled and understandable.

Example:
"We couldn't generate your study plan right now. Please try again."

Technical details should remain server-side.

## 9. AI Endpoint

Primary endpoint:

POST /api/plans/generate

Request:
{
  "goalId": "..."
}

The frontend does not send an arbitrary prompt.

The backend constructs the AI request from authenticated user and database data.

## 10. Regeneration

The MVP may support regenerating a plan.

Regeneration should create a new validated plan state according to the application's persistence strategy.

Plan version history is not required for MVP.

## 11. AI Does Not Control

The AI does not control:
- Authentication
- Authorization
- Database permissions
- Resource existence
- Database ownership
- Progress percentages
- Completion status
- Application navigation
- Deterministic next-step calculations
- Security decisions

## 12. Security

The AI provider credential must remain server-side in environment variables.

It must never be included in:
- Frontend source
- Browser-exposed environment variables
- Git repository
- API responses

The AI generation endpoint should have reasonable abuse/rate protection.

## 13. AI Design Principle

StudySync should be an application with a meaningful AI feature, not an AI chatbot surrounded by unrelated UI.

AI should be used where it adds genuine personalization and should not replace deterministic application logic.
