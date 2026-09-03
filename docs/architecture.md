# StitchTrack Architecture

## Purpose

StitchTrack uses a modular application architecture with explicit separation of concerns.

The architecture is designed to keep business rules independent from frameworks, databases, user interfaces, and external services.

The core dependency direction is:

Presentation
    ↓
Application
    ↓
Domain

Infrastructure implements interfaces defined by the application layer.

Dependencies must point inward toward business rules.

---

## Architectural Layers

### Domain

The domain layer contains business concepts and business rules.

Examples in future phases may include:

- garment lifecycle rules
- approval rules
- measurement rules
- fitting rules
- payment calculations
- delivery rules

The domain layer may contain:

- entities
- value objects
- domain types
- domain errors
- pure business functions
- domain invariants

The domain layer must not depend on:

- React
- Next.js
- Prisma
- PostgreSQL
- HTTP
- browser APIs
- Server Actions
- Route Handlers
- infrastructure implementations

Domain code should be testable without starting Next.js or connecting to a database.

---

### Application

The application layer coordinates use cases.

Examples in future phases may include:

- CreateClient
- CreateGarment
- ApproveGarmentVersion
- RecordFitting
- RecordPayment
- CompleteDelivery

The application layer may contain:

- use cases
- application services
- repository interfaces
- external service interfaces
- commands
- queries
- input contracts
- output contracts

The application layer may depend on the domain layer.

The application layer must not directly depend on:

- Prisma
- PostgreSQL
- Next.js
- React
- Route Handlers
- Server Actions
- concrete infrastructure repositories

If a use case needs persistence, the application layer defines an interface for that dependency.

Example:

ClientRepository

The infrastructure layer later provides the concrete implementation.

---

### Infrastructure

The infrastructure layer connects StitchTrack to technical systems.

Examples in future phases may include:

- Prisma repositories
- PostgreSQL access
- private file storage
- email delivery
- logging adapters
- external service integrations

Infrastructure may depend on:

- application interfaces
- domain types
- Prisma
- database drivers
- external service SDKs

Infrastructure must not contain core business rules.

For example:

PrismaGarmentRepository

may save a Garment, but it must not decide whether a garment is allowed to become CONFIRMED.

That rule belongs to the domain.

---

### Presentation

The presentation layer handles interaction with users and external callers.

In the Next.js application this includes:

- App Router pages
- React components
- Server Actions
- Route Handlers
- form parsing
- request validation
- response formatting

Presentation code may call application use cases.

Presentation code must not directly access Prisma or PostgreSQL.

Presentation code must not implement core business rules.

A Server Action should normally:

1. establish authenticated context when required
2. validate incoming data
3. call an application use case
4. translate the use-case result into a presentation response

It should not decide business policy.

---

## Module Structure

Product capabilities will be introduced only when their implementation phase begins.

A mature module may eventually use this shape:

src/modules/<module-name>/
├── domain/
├── application/
├── infrastructure/
└── presentation/

Not every module must contain every directory.

Directories should be created only when required.

Do not create empty architectural placeholders.

---

## Shared Code

Cross-cutting technical capabilities may live under:

src/shared/

Examples may later include:

- database
- validation
- errors
- observability
- authentication support
- security helpers
- storage abstractions

Shared code must not become a dumping ground.

A utility belongs in shared code only when it represents a genuinely reusable technical concern.

Product-specific business rules belong inside their product module.

---

## Dependency Rules

### Allowed

Presentation -> Application

Presentation -> Domain types where appropriate

Application -> Domain

Infrastructure -> Application

Infrastructure -> Domain

Infrastructure -> external technical libraries

---

### Forbidden

Domain -> Presentation

Domain -> Application

Domain -> Infrastructure

Domain -> Next.js

Domain -> React

Domain -> Prisma

Application -> Presentation

Application -> Infrastructure

Application -> Prisma

Application -> Next.js

Presentation -> Infrastructure

Presentation -> Prisma

---

## Database Rule

Prisma is an infrastructure concern.

When Prisma is introduced, application and domain modules must not import:

@prisma/client

or the generated Prisma client directly.

Database access must go through infrastructure implementations.

---

## Business Rule Example

Incorrect:

Server Action
    -> checks whether garment can be approved
    -> updates Prisma directly

Correct:

Server Action
    -> validates request
    -> calls ApproveGarmentVersion use case
        -> invokes domain approval rules
        -> uses repository interface
            -> Prisma repository persists transaction

---

## Historical Data Rule

Approved or financially significant business history should be append-oriented.

Future implementations must avoid silently overwriting records that represent:

- client approvals
- garment versions
- used measurements
- verified payments
- delivery history

Exact rules will be implemented in the relevant product versions.

---

## Transaction Rule

A use case that changes multiple records as one business operation must use an atomic transaction when partial completion would create an invalid state.

Examples later include:

- approving a garment version and changing the current version
- approving a paid change and creating its charge
- reversing financial entries

Transaction implementation belongs to infrastructure.

Business transaction requirements belong to application/domain logic.

---

## Tenant Security Rule

When tenancy is introduced in V0.2, every tenant-owned operation must establish the authenticated business context on the server.

Client-supplied business identifiers must never be trusted as authorization.

Tenant isolation must be enforced server-side and tested with negative cross-tenant tests.

---

## Testing Boundaries

### Unit tests

Used primarily for:

- domain rules
- pure functions
- application use cases

They should normally run without PostgreSQL.

### Integration tests

Used for:

- Prisma repositories
- PostgreSQL constraints
- transactions
- migrations

They must eventually run against PostgreSQL.

### End-to-end tests

Used for critical user workflows through the running application.

---

## Framework Rule

The domain model is not a Next.js model.

Next.js is the application's delivery framework.

If the framework changed in the future, the core business rules should require minimal changes.

---

## YAGNI Rule

Do not implement capabilities before their phase requires them.

In particular, V0.1 must not prematurely implement:

- authentication
- tenancy
- clients
- garments
- measurements
- approvals
- fittings
- billing
- portal tokens
- vector search
- AI functionality

Architecture should support future requirements without implementing them early.

---

## Current V0.1 State

V0.1 currently contains:

- Next.js App Router
- React
- strict TypeScript
- ESLint
- production build configuration

The existing V0.0 HTML, CSS, JavaScript and localStorage prototype remains preserved as reference material.

Product domain implementation begins only in later versioned phases.
