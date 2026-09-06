# StitchTrack V0.2 Authentication and Tenant Data Model

This document defines the persistence and ownership model for authentication
and tenant isolation before any V0.2 database migration is created.

## Design goals

The V0.2 persistence model must:

- use Better Auth's supported authentication schema,
- keep authentication and tenant authorization separate,
- support users belonging to more than one Business,
- make tenant membership explicit,
- prevent duplicate memberships,
- support immediate membership suspension,
- use consistent identifiers,
- support negative cross-tenant tests,
- avoid storing tenant authorization as session truth.

## Ownership boundaries

Better Auth owns:

- User
- Account
- Session
- Verification

StitchTrack owns:

- Business
- BusinessMember
- business authorization rules
- tenant context

StitchTrack must not create a second authentication User table.

BusinessMember references the Better Auth User identifier.

## Identifier strategy

V0.2 uses UUID identifiers for authentication and StitchTrack tenant records.

The intended Better Auth configuration will explicitly use UUID database IDs.

Business and BusinessMember also use UUID identifiers.

Using one identifier strategy avoids unnecessary conversion and mixed-key
behavior between authentication and product-owned tables.

## Better Auth User

User represents authenticated identity.

Required authentication data includes:

- id
- name
- email
- emailVerified
- optional image
- createdAt
- updatedAt

Email is unique.

StitchTrack will not add business roles, active Business identifiers, tenant
permissions, or unrelated product profile data directly to the authentication
User record in V0.2.

## Better Auth Account

Account represents an authentication method belonging to a User.

For email/password authentication, the credential Account stores the encoded
password hash.

Plaintext passwords are never persisted.

The password field contains an Argon2id encoded one-way hash when StitchTrack
email/password authentication is used.

Authentication account identity uses Better Auth's supported account model.

StitchTrack V0.2 uses email/password authentication only. The pinned Better
Auth 1.7.2 runtime type surface does not expose an account identity-strategy
configuration option, so StitchTrack does not force an unsupported setting.

The authentication schema retains issuer, accountId, and their compound unique
constraint. An explicit external-provider identity strategy must be reviewed
before social login or other OAuth/OIDC providers are introduced.

## Better Auth Session

Session represents authenticated state.

Session contains authentication information such as:

- userId
- unique session token
- expiration
- optional IP address
- optional user-agent metadata
- timestamps

Session establishes identity.

Session does not establish authoritative Business authorization.

V0.2 will not add `businessId`, Business role, or Business permissions to the
Session table as an authorization source of truth.

A remembered or selected Business identifier may later exist as UI state, but
it remains untrusted until current BusinessMember membership is verified on the
server.

## Better Auth Verification

Verification stores temporary authentication verification state required by
Better Auth.

StitchTrack does not reuse this table for product approvals, garment approvals,
client approval links, or business workflow verification.

Those are separate product-domain concepts.

## Business

Business is the StitchTrack tenant.

Initial fields:

- id
- name
- createdAt
- updatedAt

No slug is required in V0.2.

A slug should be introduced only when a concrete routing or public-identifier
requirement exists.

Business does not contain authentication credentials.

## BusinessMember

BusinessMember represents one User's membership in one Business.

Initial fields:

- id
- businessId
- userId
- role
- status
- createdAt
- updatedAt

There must be at most one BusinessMember row for a given:

`businessId + userId`

A User may belong to multiple Businesses.

A Business may contain multiple Users.

## Membership role

The initial role set is deliberately small:

- OWNER
- MEMBER

OWNER represents a user permitted to administer the Business.

MEMBER represents an authenticated Business participant without owner
authority.

Additional roles such as manager, production staff, finance, or fitter are not
introduced until actual StitchTrack workflows require them.

## Membership status

The initial membership statuses are:

- ACTIVE
- SUSPENDED

Only ACTIVE membership authorizes tenant access.

SUSPENDED membership remains recorded but grants no Business access.

Suspension is preferred over deleting a membership during normal offboarding.

Pending invitations are not part of V0.2 and therefore no INVITED or PENDING
state is introduced yet.

## Business creation invariant

Creating a Business and its initial OWNER BusinessMember must occur in one
transaction.

A successfully created Business must not exist without its initial active
OWNER membership.

## Ownership invariant

Every Business must have at least one ACTIVE OWNER.

Future owner-removal or role-change operations must prevent removal or
suspension of the last active OWNER.

This is an application/domain invariant and cannot be reliably represented by a
simple database constraint alone.

## Tenant authorization invariant

For a tenant-sensitive operation:

1. authenticate the User,
2. obtain the requested Business identifier,
3. treat that identifier as untrusted,
4. load BusinessMember using both businessId and userId,
5. require membership status ACTIVE,
6. require the necessary role when the operation is role-sensitive,
7. only then access tenant-owned data.

Authentication without membership is not authorization.

## Tenant context

TenantContext is derived server-side from:

- authenticated User identity,
- requested Business,
- current ACTIVE BusinessMember.

Conceptually:

    authenticatedUserId
            +
       requestedBusinessId
            |
            v
    membership verification
            |
            v
        TenantContext

TenantContext is not created merely because a Business ID exists in a URL,
cookie, request body, or browser state.

## Unique constraints

BusinessMember requires a compound uniqueness constraint on:

`businessId + userId`

This prevents duplicate membership rows for the same User and Business.

Better Auth authentication uniqueness and indexes should follow the schema
generated for the exact installed Better Auth version.

We will not manually guess authentication constraints that the official schema
generator can provide.

## Index strategy

BusinessMember should support efficient lookup by:

- businessId
- userId
- businessId + userId

The compound unique constraint serves the authorization lookup.

Additional indexes should be justified by observed query patterns.

Better Auth's recommended indexes for authentication models should be retained
when its Prisma schema is generated.

## Deletion behavior

Authentication and tenant deletion must be deliberate.

BusinessMember -> User should not silently disappear because an authentication
User is deleted.

BusinessMember -> Business should not silently disappear because a Business is
hard-deleted.

The initial model should therefore prefer restrictive deletion behavior for
StitchTrack membership relationships.

Normal user offboarding uses membership suspension.

Normal Business lifecycle does not use uncontrolled hard deletion.

Future account-deletion and Business-deletion workflows must explicitly define
retention, audit, privacy, and historical-data behavior before destructive
cascades are introduced.

## Session revocation

Suspending BusinessMember immediately removes tenant authorization even if the
User still has a valid Better Auth session.

The User may remain authenticated while being unauthorized for that Business.

This is intentional.

Authentication state and Business access state are separate.

## Prisma generation strategy

Better Auth's official schema generator will be used as the source for the
authentication portion of the Prisma schema.

The exact Better Auth version used by StitchTrack must be pinned when
generating the schema.

The generated authentication schema will be reviewed before migration.

StitchTrack Business and BusinessMember models will then be added deliberately.

Prisma remains responsible for creating and applying the migration.

Better Auth's direct database migration mechanism will not be used with the
Prisma adapter.

## Performance

Authentication correctness comes first.

Once the required Prisma relations exist, V0.2 may enable Better Auth database
joins after integration testing.

Tenant authorization queries should be direct indexed membership lookups rather
than scanning all memberships.

No authorization result is trusted solely because it was previously rendered
in the browser.

## V0.2-B exclusions

This model does not yet include:

- Client
- Order
- Garment
- measurements
- client portal users
- invitations
- teams
- granular custom permissions
- product audit events
- payments
- fittings
- approval links

Those concepts must not be added to the V0.2 tenant schema without a concrete
release requirement.

## TenantContext

A TenantContext is the server-side representation of an authenticated user's
validated access to one Business.

A TenantContext contains:

- authenticated user ID,
- business ID,
- BusinessMember ID,
- BusinessMember role.

A TenantContext is created only when the authenticated user has an ACTIVE
BusinessMember record for the exact requested Business.

The requested business ID is untrusted input until membership has been checked.

Tenant resolution requires all of the following to match:

- authenticated user ID,
- requested business ID,
- membership status ACTIVE.

A TenantContext is not produced when:

- the request is unauthenticated,
- the BusinessMember is SUSPENDED,
- the user requests another Business,
- the user has no membership,
- the requested Business does not exist.

Unauthenticated requests result in UNAUTHORIZED.

Authenticated requests that fail tenant membership resolution result in the
same FORBIDDEN application error. Tenant resolution does not reveal whether the
Business exists or whether a membership is suspended, absent, or associated
with another Business.

The Application layer defines the tenant membership reader port and TenantContext
contract without depending on Prisma or Better Auth.

The Prisma infrastructure adapter implements that port using an ACTIVE
membership query scoped by both user ID and business ID.

## Tenant authorization

Tenant resolution and action authorization are separate concerns.

TenantContext resolution answers:

"Does this authenticated user currently have access to this Business?"

Role authorization answers:

"Is the resolved membership role permitted to perform this action?"

V0.2 supports two tenant roles:

- OWNER
- MEMBER

Authorization operates only on a server-resolved TenantContext. The role used
for authorization comes from the ACTIVE BusinessMember record returned by the
tenant membership infrastructure adapter.

A role supplied by a browser, form, URL, API body, or other client-controlled
input is never authoritative.

The allowed roles for an action are trusted application policy. They must be
defined by server-side application or use-case code and must not be derived
from client-controlled request data.

When a resolved membership role is not permitted, authorization returns the
generic FORBIDDEN application error:

"You do not have permission to perform this action."

V0.2 does not introduce custom roles, granular permission records, policy
engines, or a generic RBAC framework. Those capabilities require concrete
product requirements before they are added.
