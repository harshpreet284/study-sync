# StudySync Project Rules

## Project Context

StudySync is an existing React application being upgraded into a full-stack MERN + AI application.

It is not a greenfield rewrite.

## Rule 1 — Inspect Before Modifying

Before changing code:
- Inspect relevant existing files.
- Understand existing component and data flow.
- Check existing dependencies.
- Identify whether the requested functionality already exists.

Do not assume the repository is empty or follows a generic template.

## Rule 2 — Preserve Existing Product Identity

The existing StudySync visual identity was intentionally designed before the full-stack upgrade.

Do not change without explicit approval:
- Color palette
- Typography
- Major visual language
- Major layout patterns
- Landing page design
- Existing component personality

New UI must look like part of the existing StudySync application.

Do not introduce a generic AI/SaaS dashboard aesthetic.

## Rule 3 — Preserve Working Functionality

Do not rewrite working features merely to use a different coding style or architecture.

When migrating functionality, prefer incremental replacement over destructive rewrites.

## Rule 4 — Follow the Product Scope

Use `docs/PRODUCT.md` as the product scope authority.

Do not add MVP-excluded features without explicit approval.

Do not infer that more features are automatically better.

## Rule 5 — Follow the Architecture

Use `docs/ARCHITECTURE.md` as the architectural authority.

Do not introduce major infrastructure, frameworks, or architectural patterns without a concrete requirement.

## Rule 6 — Follow the Data Contract

Use `docs/DATABASE.md` and `docs/API.md` for database and API decisions.

If current code conflicts with the planned architecture, report the conflict instead of silently rewriting it.

## Rule 7 — AI Boundaries

Use `docs/AI_FEATURE.md`.

AI output is untrusted input and must be validated before persistence.

AI credentials remain server-side.

Do not use AI where deterministic application logic is sufficient.

## Rule 8 — Smallest Reasonable Change

Implement the smallest change that satisfies the requested task.

Avoid unrelated refactors.

Avoid speculative abstractions.

Avoid "cleanup" unrelated to the current task.

## Rule 9 — Explain Conflicts

If implementation requires changing an established product or architectural decision, stop and explain:
- What conflicts
- Why the conflict exists
- Proposed options

Do not silently override the project specification.

## Rule 10 — Verification

After meaningful changes:
- Run relevant tests.
- Run the build where appropriate.
- Check for runtime errors.
- Review changed files.
- Report failures honestly.

Never claim a feature is verified if it was not actually tested.

## Rule 11 — Git Safety

Keep changes focused.

Do not combine unrelated features into one change.

Do not reset, delete, or overwrite user work without explicit approval.

## Rule 12 — Explainability

For substantial changes, report briefly:
- What changed
- Why
- Files affected
- What was tested
- Assumptions
- Unresolved issues

## Rule 13 — Stop at Task Boundary

After completing the requested task and verification, stop.

Do not automatically continue into the next feature.

## Rule 14 — No Feature Creep

Potential future features should be noted separately, not implemented automatically.

## Rule 15 — Human Approval

When requirements are ambiguous and the decision materially affects product scope, architecture, security, data integrity, or visual identity, ask for clarification rather than inventing a major solution.
