# Client, Order, and Garment Domain

## Purpose

V0.3 introduces StitchTrack's first tenant-owned product records:

- Client
- Order
- Garment

The purpose of V0.3 is to establish the smallest correct operational core for
recording who a tailoring Business is working for, the order being handled,
and the individual physical garments contained in that order.

V0.3 does not yet model measurements, style references, approvals, fittings,
commercial changes, payments, delivery, or the client portal.

## Tenant ownership

Client, Order, and Garment are all owned by a Business.

Every tenant-owned persistence record introduced in V0.3 must contain an
explicit `businessId`.

Tenant ownership must never be inferred from browser-controlled input alone.

Before a tenant-owned use case executes, the server must establish:

1. the authenticated User,
2. an ACTIVE BusinessMember for the requested Business,
3. the TenantContext,
4. any role authorization required by the action.

All persistence operations must be scoped to the verified `businessId`.

## Client

A Client represents a person for whom the Business performs tailoring work.

Minimum V0.3 Client data:

- id
- businessId
- name
- phone
- optional email
- createdAt
- updatedAt

### Client invariants

- A Client belongs to exactly one Business.
- Client names must not be empty after trimming.
- Phone is required in V0.3 because it is the primary practical contact
  identifier for the target tailoring workflow.
- Email is optional.
- Phone and email are not globally unique.
- V0.3 does not automatically merge Clients with similar names or contact data.
- V0.3 does not introduce Client deletion.
- A Client from one Business must never be readable or usable by another
  Business.

StitchTrack must not impose a unique phone constraint because shared phone
numbers, alternate formatting, and family contacts are valid real-world cases.

## Order

An Order represents one tailoring engagement for one Client.

Minimum V0.3 Order data:

- id
- businessId
- clientId
- createdAt
- updatedAt

### Order invariants

- An Order belongs to exactly one Business.
- An Order belongs to exactly one Client.
- The Client and Order must belong to the same Business.
- An Order cannot exist for a Client owned by another Business.
- An Order must contain at least one Garment before later workflow versions may
  treat it as a complete tailoring job.
- V0.3 does not introduce commercial totals, deposits, balance, approval state,
  fitting state, delivery state, or payment state.
- V0.3 does not introduce Order deletion.

No business workflow status is introduced merely to make the schema appear
complete. Statuses will be added only when their lifecycle and transition rules
are defined by later product versions.

## Garment

A Garment represents one physical custom item being made or altered.

Minimum V0.3 Garment data:

- id
- businessId
- orderId
- name
- createdAt
- updatedAt

Examples of Garment names include:

- Wedding gown
- Senator top
- Senator trousers
- Blouse
- Skirt

### Garment invariants

- A Garment belongs to exactly one Business.
- A Garment belongs to exactly one Order.
- The Garment and Order must belong to the same Business.
- One Garment record represents one physical item.
- Quantity is therefore not a Garment field.
- If a Client orders three physical shirts, the Order contains three Garment
  records even when the shirts are similar.
- Garment names must not be empty after trimming.
- V0.3 does not introduce Garment deletion.

The one-record-per-physical-item rule is required because later measurements,
fittings, changes, approvals, delivery evidence, and history may differ for
otherwise similar garments.

## Relationship structure

The V0.3 ownership structure is:

Business
  |
  +-- Client
       |
       +-- Order
            |
            +-- Garment

The business boundary also exists explicitly on every tenant-owned record:

Business
  |
  +-- Client.businessId
  +-- Order.businessId
  +-- Garment.businessId

This repetition is intentional.

It allows every tenant-owned query to contain an explicit Business boundary and
allows the database to enforce same-Business parent-child relationships.

## Database relationship enforcement

Persistence must prevent cross-tenant parent relationships structurally.

The intended relational constraints are equivalent to:

- Order `(clientId, businessId)` references Client `(id, businessId)`.
- Garment `(orderId, businessId)` references Order `(id, businessId)`.

This prevents:

- a Business A Order from referencing a Business B Client,
- a Business A Garment from referencing a Business B Order.

Application authorization remains required. Database constraints provide an
additional integrity boundary and do not replace TenantContext authorization.

## Resource lookup rule

A tenant-owned resource lookup must not follow this pattern:

`findById(resourceId)`

and then trust the returned record.

The persistence boundary must instead include the verified tenant:

`findById(businessId, resourceId)`

or an equivalent tenant-scoped operation.

Knowing a valid UUID must never grant cross-Business access.

## Parent resource validation

Creating an Order requires proving that the requested Client exists inside the
same verified Business.

Creating a Garment requires proving that the requested Order exists inside the
same verified Business.

A client-supplied `businessId`, `clientId`, or `orderId` is treated only as a
request identifier. It is not authorization evidence.

## Historical integrity

V0.3 does not introduce destructive deletion workflows for Client, Order, or
Garment records.

Later versions will contain approved, financial, fitting, and delivery history.
The product must therefore evolve toward explicit correction, cancellation, or
voiding semantics rather than silently rewriting historical business evidence.

V0.3 does not implement those later history mechanisms prematurely.

## Required V0.3 security evidence

Before V0.3 can be released, automated tests must prove at minimum:

- Business A can create and read its own Client.
- Business A cannot read Business B's Client by UUID.
- Business A cannot create an Order using Business B's Client.
- Business A cannot read Business B's Order by UUID.
- Business A cannot create a Garment using Business B's Order.
- Business A cannot read Business B's Garment by UUID.
- forged client-supplied Business identifiers do not override TenantContext.
- database constraints reject cross-Business Client-to-Order relationships.
- database constraints reject cross-Business Order-to-Garment relationships.

These tests extend the tenant security evidence established in V0.2 from the
membership boundary to actual tenant-owned product data.

## Explicitly outside V0.3

V0.3 does not implement:

- measurements,
- measurement versioning,
- style reference images,
- fabric records,
- quotations,
- prices,
- deposits,
- balances,
- payment ledger,
- initial approval,
- change requests,
- client approvals,
- fitting workflow,
- fitting adjustments,
- delivery workflow,
- client portal,
- notifications,
- AI features,
- search infrastructure,
- analytics,
- custom roles,
- granular permissions.

Those capabilities belong to later roadmap versions and must not be pulled into
V0.3 simply because the future product will eventually need them.

## V0.3 success condition

V0.3 is successful when an authenticated and authorized Business user can
safely create and retrieve:

Client -> Order -> individual Garments

while PostgreSQL, application boundaries, and automated negative tests jointly
prevent cross-tenant relationships and cross-tenant resource access.
