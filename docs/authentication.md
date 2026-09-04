# StitchTrack Authentication and Tenant Strategy

This document records the authentication, password-security, tenant-isolation,
and authenticated application-shell decisions for StitchTrack V0.2.

## V0.2 goals

V0.2 establishes:

- authenticated user identity,
- secure email/password authentication,
- database-backed sessions,
- Business ownership,
- Business membership,
- explicit tenant context,
- authorization boundaries,
- negative cross-tenant security tests,
- an authenticated SPA-like application shell.

Authentication and tenant authorization are separate concerns.

A valid authenticated session does not by itself authorize access to a
StitchTrack Business.

## Authentication provider

StitchTrack uses Better Auth for authentication and session management.

The initial authentication method is:

- email,
- password.

Better Auth is responsible for authentication infrastructure including:

- authentication users,
- credential accounts,
- sessions,
- authentication verification records.

StitchTrack does not implement its own session-token system.

## Password-storage policy

Passwords must never be stored using reversible encryption.

StitchTrack uses Argon2id for password hashing.

The initial hashing policy is:

- algorithm: Argon2id,
- version: Argon2 version 19,
- memory cost: 19456 KiB,
- time cost: 2,
- parallelism: 1,
- output length: 32 bytes.

These values are an initial security baseline.

The work factor may be increased later after benchmarking the production
environment.

The password library is responsible for generating a unique salt.

Plaintext passwords must never be:

- persisted,
- logged,
- placed into application events,
- returned from APIs,
- stored in session state.

Better Auth will use StitchTrack-provided password hash and verify functions.

The application will not implement password verification independently.

## Password architecture

The intended flow is:

    plaintext password
          |
          v
      Better Auth
          |
          v
    password hash port
          |
          v
       Argon2id
          |
          v
    encoded one-way hash
          |
          v
      PostgreSQL

Password verification is:

    submitted password
          +
      stored hash
          |
          v
       Argon2id
          |
          v
      true / false

There is no password decryption operation.

## Authentication boundary

Better Auth belongs to infrastructure and composition boundaries.

Domain code must not import Better Auth.

Application use cases must not depend directly on Better Auth APIs or types.

Application code should receive an authenticated identity through a
StitchTrack-owned application abstraction.

## Tenant ownership

StitchTrack owns its tenant model.

The tenant entity is:

`Business`

User access to a Business is represented by:

`BusinessMember`

The intended relationship is:

    Authenticated User
            |
            v
      BusinessMember
            |
            v
         Business

Future tenant-owned records must contain or resolve to a Business identifier.

## Better Auth organization plugin

The Better Auth organization plugin is deliberately not used in V0.2.

StitchTrack Business and BusinessMember are product-domain concepts.

Using both Better Auth Organization membership and StitchTrack Business
membership would create competing authorization sources of truth.

Better Auth therefore provides identity and sessions.

StitchTrack owns tenant membership, roles, permissions, and authorization.

## Authorization invariant

Every tenant-sensitive operation must verify:

1. a valid authenticated user,
2. the requested Business,
3. an active BusinessMember relationship,
4. any role or permission required by the operation.

A Business identifier received from a browser, URL, form, or API request is
untrusted until current membership has been verified.

Route protection alone is not sufficient authorization.

## Cross-tenant isolation

The critical V0.2 security invariant is:

A user authorized for Business A must not be able to read, create, update,
delete, or infer tenant-owned data belonging to Business B unless that user
also has valid membership in Business B.

This must be proven with negative integration tests.

## Roles

Roles belong to BusinessMember.

They are not authoritative when copied into browser state.

Sensitive authorization must use current server-side membership data.

The initial role model must remain minimal and be driven by actual
StitchTrack workflows.

## Authenticated application architecture

StitchTrack uses the Next.js App Router.

The product is not implemented as a traditional all-client JavaScript SPA.

Instead, StitchTrack uses an SPA-like application experience with:

- client-side navigation,
- persistent layouts,
- route-level code splitting,
- prefetching,
- partial rendering,
- Server Components by default,
- Client Components only when interaction requires them.

The goal is fast navigation without moving application authorization into the
browser.

## Application shell

The intended high-level structure is:

    Public
      |
      +-- login
      +-- sign-up

    Authenticated application
      |
      +-- persistent layout
      |     |
      |     +-- navigation
      |     +-- active Business
      |     +-- authenticated user menu
      |
      +-- dashboard
      +-- future Clients
      +-- future Orders
      +-- future Settings

The shell may remain mounted as users navigate between internal routes.

Internal navigation should use Next.js navigation primitives such as `Link`
instead of forcing full browser page reloads.

## Rendering policy

Server Components are the default.

Client Components are introduced only for features requiring browser-side
interaction such as:

- local UI state,
- interactive forms,
- dialogs,
- optimistic feedback,
- client-only browser APIs.

Data access and authorization remain server-side.

A Client Component must never become the authority for whether a user may
access a Business resource.

## Latency principle

Performance improvements must not weaken authorization.

StitchTrack should use:

- server-side data access,
- client-side route transitions,
- route prefetching where appropriate,
- persistent layouts,
- minimal browser JavaScript.

The application should not introduce a separate frontend SPA and backend API
unless a concrete product requirement later justifies that complexity.

## Initial V0.2 scope

V0.2 includes:

- Better Auth,
- email/password login,
- Argon2id password hashing,
- PostgreSQL-backed sessions,
- Business,
- BusinessMember,
- tenant context,
- membership authorization,
- cross-tenant isolation tests,
- authenticated application shell.

V0.2 does not include:

- Better Auth Organizations,
- social login,
- enterprise SSO,
- passkeys,
- two-factor authentication,
- custom generic RBAC frameworks,
- Clients,
- Orders,
- Garments,
- measurements,
- fittings,
- payments,
- client portal functionality.

Additional capabilities must be introduced only when required by a concrete
product or security requirement.

## Better Auth runtime footprint

StitchTrack uses Better Auth with the Prisma adapter.

Better Auth provides an optional:

`better-auth/minimal`

entry point for ORM-adapter deployments. It excludes Better Auth's direct
database layer, which StitchTrack does not require when using Prisma.

This is an implementation optimization, not a security or architectural
requirement.

The standard `better-auth` entry point remains acceptable if required by a
feature or compatibility constraint.

Correctness, authentication behavior, security, and maintainability take
priority over bundle-size optimization.

The Prisma adapter remains installed as:

`@better-auth/prisma-adapter`
