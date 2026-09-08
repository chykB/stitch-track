# Measurements and Style References Domain

## Purpose

V0.4 introduces the next two pieces of StitchTrack's tailoring record:

- versioned Client measurements,
- Garment style references.

The purpose is to preserve reusable measurement history for a Client and
capture the visual references associated with an individual physical Garment.

V0.4 does not yet decide which measurement version or style references are
approved for production.

That decision belongs to the versioned agreement and approval workflow in V0.5.

## Relationship to V0.3

V0.3 established:

Business
  |
  +-- Client
       |
       +-- Order
            |
            +-- Garment

V0.4 extends that structure as:

Business
  |
  +-- Client
  |    |
  |    +-- MeasurementVersion
  |          |
  |          +-- MeasurementEntry
  |
  +-- Order
       |
       +-- Garment
            |
            +-- StyleReference

Every record introduced in V0.4 remains tenant-owned and contains an explicit
businessId.

## Tenant ownership

MeasurementVersion, MeasurementEntry, and StyleReference are all owned by a
Business.

Tenant ownership must never be inferred from browser-controlled identifiers.

Before a tenant-owned V0.4 use case executes, the server must establish:

1. the authenticated User,
2. an ACTIVE BusinessMember for the requested Business,
3. the TenantContext,
4. any required role authorization.

All persistence reads and writes must be scoped to the verified businessId.

Knowing a MeasurementVersion, MeasurementEntry, StyleReference, Client, or
Garment UUID must never grant cross-Business access.

## Measurements

Measurements represent body measurements recorded for a Client.

Measurements belong to the Client rather than directly to an Order or Garment.

This reflects the practical fact that a Client's measurements can be reused
across more than one tailoring order while still changing over time.

A Client therefore owns a history of immutable MeasurementVersion records.

## MeasurementVersion

A MeasurementVersion represents one measurement-taking event for one Client.

Minimum V0.4 MeasurementVersion data:

- id
- businessId
- clientId
- measuredAt
- unit
- optional note
- createdAt

A MeasurementVersion is itself one historical version.

V0.4 does not require a sequential version number such as 1, 2, or 3.
The immutable UUID and measuredAt timestamp are sufficient to identify a
specific version without introducing concurrency-sensitive numbering.

### MeasurementVersion invariants

- A MeasurementVersion belongs to exactly one Business.
- A MeasurementVersion belongs to exactly one Client.
- The Client and MeasurementVersion must belong to the same Business.
- A MeasurementVersion must contain at least one MeasurementEntry.
- measuredAt records when the measurements were taken.
- createdAt records when StitchTrack persisted the version.
- unit applies to every MeasurementEntry in the version.
- Supported V0.4 units are CENTIMETER and INCH.
- Units must not be mixed inside one MeasurementVersion.
- StitchTrack does not automatically convert measurements between units in
  V0.4.
- A persisted MeasurementVersion is immutable.
- Correcting or retaking measurements creates a new MeasurementVersion.
- V0.4 does not overwrite an older MeasurementVersion.
- V0.4 does not delete MeasurementVersion history.

There is no mutable "current measurements" record.

A user interface may identify the most recent available MeasurementVersion for
convenience, but older versions remain first-class historical records.

## MeasurementEntry

A MeasurementEntry represents one named measurement inside a
MeasurementVersion.

Examples include:

- Bust
- Waist
- Hip
- Shoulder
- Sleeve length
- Trouser length
- Neck
- Inseam

StitchTrack must not hard-code a universal list of tailoring measurements in
V0.4.

Different garments, businesses, clients, and tailoring methods require
different measurement names.

Minimum V0.4 MeasurementEntry data:

- id
- businessId
- measurementVersionId
- label
- normalizedKey
- value
- createdAt

### MeasurementEntry invariants

- A MeasurementEntry belongs to exactly one Business.
- A MeasurementEntry belongs to exactly one MeasurementVersion.
- The MeasurementVersion and MeasurementEntry must belong to the same Business.
- label must not be empty after trimming.
- normalizedKey is derived from the measurement label for duplicate detection.
- Two entries in the same MeasurementVersion must not share the same
  normalizedKey.
- value must be a positive decimal measurement.
- The unit is inherited from the parent MeasurementVersion.
- MeasurementEntry records are immutable after the version is created.
- V0.4 does not silently overwrite an individual measurement value.
- A correction requires creating a new MeasurementVersion.

The normalizedKey exists to prevent accidental duplicates such as:

- Waist
- waist
- " Waist "

inside the same MeasurementVersion while preserving a human-readable label.

## Measurement creation boundary

Creating a MeasurementVersion is one business operation.

The version and all of its MeasurementEntry records must be persisted
atomically.

The system must never leave behind a MeasurementVersion with only some of the
submitted entries because one entry failed.

This operation therefore requires a transaction at the infrastructure boundary.

## Garment measurement selection

V0.4 deliberately does not add a measurementVersionId to Garment.

Creating measurement history and deciding which historical measurements become
part of an agreed garment specification are different business operations.

The architecture already treats "used measurements" as historical business
evidence.

V0.5 introduces the versioned agreement and initial approval workflow.

That agreement will be the appropriate place to reference the exact
MeasurementVersion used for an agreed garment specification.

This prevents V0.4 from introducing premature approval semantics or a mutable
Garment pointer that could silently change historical meaning.

## StyleReference

A StyleReference represents one visual design reference associated with one
physical Garment.

Style references belong to Garment rather than Order because different
Garments in the same Order may have completely different designs.

Example:

An Order may contain:

- one Senator top,
- one pair of Senator trousers,
- one agbada.

Each physical Garment can therefore have its own reference images.

Minimum V0.4 StyleReference data:

- id
- businessId
- garmentId
- sourceUrl
- optional label
- optional note
- createdAt

### StyleReference invariants

- A StyleReference belongs to exactly one Business.
- A StyleReference belongs to exactly one Garment.
- The Garment and StyleReference must belong to the same Business.
- A Garment may have zero, one, or many StyleReference records.
- sourceUrl must identify the visual reference.
- sourceUrl must use an allowed web URL scheme.
- optional label and note are descriptive only.
- Attaching a StyleReference does not mean the Client approved it.
- Attaching a StyleReference does not make it the final production design.
- StyleReference records are immutable in V0.4.
- Corrections create another StyleReference rather than silently rewriting
  historical reference data.
- V0.4 does not introduce destructive StyleReference deletion.

## Style reference storage boundary

V0.4 models the business record for a style reference.

Binary image data must not be stored directly in PostgreSQL.

StyleReference stores a sourceUrl that identifies where the reference image is
available.

The mechanism that produces the URL may later be:

- managed object storage,
- an upload service,
- an imported external image reference.

V0.4 must not couple the domain model to a specific cloud storage provider.

A storage provider may be introduced at the infrastructure boundary when the
upload workflow requires it.

## Approval boundary

Neither MeasurementVersion nor StyleReference represents approval.

V0.4 answers:

- what measurements were recorded for this Client?
- what design references were attached to this Garment?

V0.4 does not answer:

- which measurements did the Client approve for this Garment?
- which style reference became the agreed design?
- what exact specification is currently approved?
- has the Client approved production?

Those questions belong to V0.5.

V0.5 must reference immutable V0.4 records rather than copying mutable values
that could later change.

## Database relationship enforcement

Persistence must structurally prevent cross-Business parent relationships.

The intended relational constraints are equivalent to:

- MeasurementVersion `(clientId, businessId)` references
  Client `(id, businessId)`.
- MeasurementEntry `(measurementVersionId, businessId)` references
  MeasurementVersion `(id, businessId)`.
- StyleReference `(garmentId, businessId)` references
  Garment `(id, businessId)`.

MeasurementVersion should expose a composite unique key equivalent to
`(id, businessId)` so child records can enforce the Business boundary.

The existing Client and Garment composite Business relationships remain
unchanged.

## Resource lookup rule

V0.4 tenant-owned repository operations must never perform unscoped resource
lookups such as:

findById(resourceId)

They must require the verified Business boundary, for example:

findById(businessId, resourceId)

or an equivalent tenant-scoped operation.

This applies to:

- MeasurementVersion,
- MeasurementEntry when independently addressed,
- StyleReference.

## Parent resource validation

Creating a MeasurementVersion requires proving that the requested Client exists
inside the current TenantContext Business.

Creating a StyleReference requires proving that the requested Garment exists
inside the current TenantContext Business.

A browser-supplied clientId or garmentId is only a requested identifier.

It is never authorization evidence.

## Historical integrity

V0.4 follows the architecture rule that historical business evidence should
evolve toward append-oriented records.

Therefore:

- old MeasurementVersion records are not overwritten,
- old MeasurementEntry values are not rewritten,
- StyleReference records are not silently replaced,
- newer measurements create a new MeasurementVersion,
- newer style references create additional StyleReference records.

V0.5 can safely reference these immutable records when constructing an approved
agreement.

## Explicitly outside V0.4

V0.4 does not implement:

- measurement approval,
- measurement selection for an approved garment specification,
- style approval,
- approved garment versions,
- versioned client agreements,
- change requests,
- client approval links,
- fittings,
- fitting adjustments,
- fabric inventory,
- quotations,
- prices,
- deposits,
- payment ledger,
- delivery,
- client portal,
- notifications,
- automatic image analysis,
- AI measurement extraction,
- image similarity search,
- automatic unit conversion,
- custom measurement templates,
- destructive measurement history deletion.

These capabilities must not be pulled into V0.4 simply because later product
versions will require them.

## Required V0.4 security and integrity evidence

Before V0.4 can be released, automated tests must prove at minimum:

- Business A can create measurement history for its own Client.
- Business A cannot create a MeasurementVersion for Business B's Client.
- Business A cannot read Business B's MeasurementVersion by UUID.
- database constraints reject a cross-Business Client-to-MeasurementVersion
  relationship.
- MeasurementVersion and all MeasurementEntry records are created atomically.
- duplicate normalized measurement names in one version are rejected.
- invalid or non-positive measurement values are rejected.
- Business A can create a StyleReference for its own Garment.
- Business A cannot create a StyleReference for Business B's Garment.
- Business A cannot read Business B's StyleReference by UUID.
- database constraints reject a cross-Business Garment-to-StyleReference
  relationship.
- forged browser-supplied Business identifiers do not override TenantContext.

## V0.4 success condition

V0.4 is successful when an authenticated and authorized Business user can:

1. create immutable, dated measurement history for a Client,
2. retrieve that Client's historical MeasurementVersions,
3. attach one or more StyleReferences to an individual Garment,
4. retrieve the Garment's StyleReferences,

while PostgreSQL, application boundaries, transaction handling, and automated
negative tests prevent cross-tenant relationships, partial measurement
versions, and cross-tenant resource access.

V0.4 must stop at recorded facts.

The selection and approval of those facts becomes V0.5.
