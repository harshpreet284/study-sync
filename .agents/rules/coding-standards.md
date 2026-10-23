# StudySync Coding Standards

## General

- Follow the existing project's language and conventions.
- Use clear, descriptive names.
- Prefer simple readable code.
- Keep files and functions focused.
- Avoid unnecessary abstraction.

## Existing Code

Do not rewrite working code solely because a different style is preferred.

Match established patterns when they remain reasonable.

## React

- Keep presentation components focused.
- Reuse components when reuse is meaningful.
- Keep API communication out of presentation components when a service layer is appropriate.
- Handle loading, empty, error, and success states explicitly.
- Avoid unnecessary global state.

Do not introduce Redux or another state-management library unless actual complexity justifies it.

## Backend

Use clear separation between:
- Routes
- Controllers
- Services
- Models
- Middleware

Controllers should primarily handle HTTP concerns.

Business logic should live in services when it is substantial or reusable.

Database access should not be scattered arbitrarily through unrelated layers.

## API

- Keep endpoints aligned with `docs/API.md`.
- Validate client input.
- Return predictable responses.
- Do not expose internal errors or sensitive data.

## Database

- Follow `docs/DATABASE.md`.
- Use references versus embedded data according to the documented model.
- Do not duplicate global resources unnecessarily.
- Add indexes when query patterns justify them.

## AI

- Keep AI integration behind the backend.
- Validate structured model output.
- Never trust model-generated IDs or database instructions without validation.
- Do not expose provider credentials.

## Abstraction Rule

Do not create abstractions before there is a real need.

Avoid:
- Generic factories without multiple implementations
- Deep service hierarchies
- Utility wrappers around one simple operation
- Frameworks/libraries introduced solely for appearance

## Comments

Write comments when they explain a non-obvious decision or constraint.

Do not add comments that merely restate obvious code.

## Refactoring

Refactor when:
- duplication is meaningful
- complexity is hurting maintainability
- a clear architectural boundary is being violated

Do not refactor unrelated code during feature implementation unless required for correctness.
