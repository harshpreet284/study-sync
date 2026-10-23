# StudySync Architecture

## 1. Architecture Overview

StudySync uses a client-server architecture based on the MERN stack with a server-side AI integration.

Core flow:

React Frontend
→ REST API
→ Node.js + Express Backend
→ Mongoose
→ MongoDB

AI flow:

Express Backend
→ AI Service
→ AI Provider
→ Validate Structured Output
→ MongoDB

Do not introduce microservices, GraphQL, message queues, Redis, or other infrastructure unless a concrete requirement justifies it.

## 2. Frontend

The existing React + Vite + Tailwind frontend is the foundation of the application.

The frontend is responsible for:
- Rendering UI
- Routing
- Managing client-side UI state
- Calling backend APIs
- Displaying loading, empty, error, and success states
- Handling authenticated user interactions

API calls should be kept in a service/API layer rather than scattered throughout presentation components.

Existing working components should be reused where appropriate.

## 3. Backend

The backend uses Node.js and Express.

Conceptual structure:

server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
└── server.js

Responsibilities:
- routes: endpoint definitions
- controllers: HTTP request/response handling
- services: business logic and external-service orchestration
- models: Mongoose schemas
- middleware: authentication, authorization, errors, and related cross-cutting concerns
- config: environment/database configuration

Do not create abstractions merely for architectural appearance.

## 4. Database

MongoDB is the primary database and Mongoose is used for schema/model management.

Core collections:
- users
- resources
- learningProgress
- learningGoals
- learningPlans

Resource modules remain embedded in Resource because they do not have meaningful independent lifecycle requirements in the MVP.

User-specific data references the owning User.

## 5. Authentication

Authentication uses hashed passwords and JWT-based authentication.

Flow:

Register
→ Validate input
→ Hash password
→ Store user

Login
→ Find user
→ Compare password
→ Generate authentication token
→ Return authentication state to client

Protected request:

Client
→ Authentication token
→ Express authentication middleware
→ Identify user
→ Controller/service
→ User-owned data

Passwords and password hashes must never be exposed through API responses.

## 6. Authorization

Authentication identifies the user. Authorization determines whether that user may access a resource.

User-owned entities include:
- LearningProgress
- LearningGoal
- LearningPlan

Every operation on these entities must verify ownership.

The backend must never trust an ID supplied by the client without checking that it belongs to the authenticated user.

## 7. Resource Architecture

Resources are global entities.

A Resource can be associated with many users and many learning plans.

User-specific progress must not be stored directly on the Resource document.

Conceptually:

User
→ LearningProgress
→ Resource

LearningPlan
→ Resource references

## 8. AI Architecture

The frontend never calls the AI provider directly.

Flow:

React
→ POST /api/plans/generate
→ Authentication
→ Fetch goal
→ Verify goal ownership
→ Fetch relevant StudySync resources
→ Construct AI input
→ AI Service
→ AI Provider
→ Structured response
→ Validate response
→ Validate resource references
→ Save LearningPlan
→ Return plan

The AI service should remain a backend responsibility.

The AI must not receive arbitrary client-controlled prompts as its primary contract. The backend constructs the relevant context.

## 9. AI Data Boundary

The AI can suggest:
- Ordering of learning resources
- Weekly focus
- Study tasks
- Learning-plan structure

The application controls:
- Authentication
- Authorization
- Resource existence
- Database writes
- Progress
- Permissions
- Navigation
- Deterministic next-step logic

AI output is untrusted input and must be validated before persistence.

## 10. Error Handling

The backend should provide centralized error handling and consistent API error responses.

User-facing errors should be safe and understandable.

Raw internal errors, provider credentials, stack traces, or sensitive implementation details must not be returned to clients.

## 11. Security Boundaries

Minimum requirements:
- Secrets stored in environment variables
- Password hashing
- JWT authentication
- Ownership authorization
- Input validation
- Deliberate CORS configuration
- Server-side AI credentials
- AI output validation
- Protection against excessive AI endpoint usage
- No password hashes in responses

## 12. Architectural Principle

Prefer the simplest architecture that reliably satisfies the current product requirements.

Do not introduce technology or abstraction solely to make the project appear more advanced.
