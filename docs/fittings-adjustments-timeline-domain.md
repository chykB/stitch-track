# V0.7 Fittings, Adjustments, and Garment Timeline Domain Contract

## 1. Purpose

V0.7 adds fitting evidence, garment-specific adjustments, and a chronological garment timeline without weakening the versioned agreement and change-control guarantees delivered in V0.5 and V0.6.

The milestone must let an authenticated Business member answer:

- When was a fitting planned?
- Did it happen or was it cancelled?
- What was observed during the fitting?
- What garment-specific adjustments were recorded?
- Which adjustments were completed or voided?
- Did the fitting reveal a material change that required Change Control?
- What happened to the garment, in chronological order, without reconstructing the story from separate screens?

V0.7 must preserve this central distinction:

> Body measurements, garment fitting observations, production adjustments, and approved garment terms are different kinds of facts and must not silently overwrite one another.

---

## 2. Existing authoritative boundaries

V0.7 builds on existing authoritative records.

### Client-level measurement history

`MeasurementVersion` belongs to:

- Business
- Client

It is immutable historical client measurement evidence.

It is not inherently garment-specific.

Existing measurement history must remain client-level.

### Garment-level approved terms

`AgreementVersion` belongs to the exact:

- Business
- Client
- Order
- Garment

An approved AgreementVersion is the authoritative garment baseline.

Its selected `measurementVersionId`, design, fabric, quantity, price, delivery date, notes, and exact style references are part of that versioned baseline.

### Garment-level post-approval change control

V0.6 owns material post-approval change semantics:

- ChangeRequest
- ChangeProposalVersion
- ChangeProposalDecision
- ChangeRequestClosure
- resulting amended AgreementVersion

V0.7 must not create a second path for altering an approved agreement.

### Timeline

The timeline is a read model.

It is not a new source of truth.

V0.7 must not persist generic "timeline event" rows merely to duplicate authoritative records that already exist elsewhere.

---

## 3. Core definitions

### Fitting

A fitting is a garment-specific business event where the garment is assessed against the client and the currently understood garment requirements.

A fitting may be:

- scheduled for a future time;
- later completed;
- cancelled;
- or recorded directly after it already occurred.

### Fitting observation

A fitting observation describes what was found during a completed fitting.

It is garment-specific evidence.

It is not automatically:

- a new body measurement;
- an approved design change;
- a price change;
- a delivery-date change;
- or a replacement agreement.

### Fitting adjustment

A fitting adjustment is a garment-specific production correction identified from a completed fitting that remains within the approved AgreementVersion baseline stored for that fitting.

Examples may include:

- take in a seam to achieve the already approved fit;
- shorten an unfinished hem to match the approved specification;
- correct garment shaping without changing the approved design;
- fix construction discovered during fitting.

An adjustment is not a mechanism for silently changing approved terms.

### Material fitting discovery

If a fitting reveals that the garment should use different approved terms, the discovery belongs in Change Control.

Examples include changing:

- design;
- style;
- fabric;
- quantity;
- price;
- delivery date;
- or the measurement version selected by the approved AgreementVersion.

Those changes require the existing V0.6 ChangeRequest → proposal → client decision → amended AgreementVersion workflow.

---


## 4. FittingSession

A FittingSession is the stable garment-scoped identity for one planned or recorded fitting.

Conceptual fields:

- id
- businessId
- clientId
- orderId
- garmentId
- scheduledFor nullable
- note nullable
- createdByMembershipId
- createdAt

The Business, Client, Order, and Garment chain must be internally consistent.

The Client and Order are derived from the authoritative Garment/Order chain.

The browser must not choose trusted parent identifiers.

FittingSession is append-oriented.

It does not contain a mutable lifecycle status.

Its current state is derived from whether a terminal FittingOutcome exists.

A persisted FittingSession with no terminal outcome must have a non-null `scheduledFor`.

A direct historical fitting may have `scheduledFor = null` only when the FittingSession and its COMPLETED FittingOutcome are created atomically.

This prevents an outcome-less fitting from existing without either a schedule or a completed historical event.

### Scheduling

A Business member may create a future FittingSession with `scheduledFor`.

For the normal scheduling operation:

- `scheduledFor` must be in the future at creation time;
- scheduling does not mean the fitting occurred;
- scheduling does not freeze an AgreementVersion as the fitting baseline.

The approved baseline actually assessed is recorded when the fitting is completed.

### Direct completed fitting

A Business member may record a fitting that already occurred.

The application may create:

- the FittingSession; and
- its COMPLETED FittingOutcome

atomically.

The historical fitting time is represented by FittingOutcome.occurredAt.

### Rescheduling

V0.7 does not overwrite the original scheduled time.

To reschedule:

1. cancel the old FittingSession;
2. create a new FittingSession with the new scheduled time.

This preserves scheduling history.

---


## 5. FittingOutcome

A FittingSession has at most one terminal FittingOutcome.

Allowed outcomes:

- COMPLETED
- CANCELLED

Conceptual fields:

- id
- businessId
- fittingSessionId
- outcome
- occurredAt
- baselineAgreementVersionId nullable
- resultingMeasurementVersionId nullable
- observationSummary nullable
- cancellationReason nullable
- recordedByMembershipId
- createdAt

Derived FittingSession state:

- no outcome → SCHEDULED
- COMPLETED outcome → COMPLETED
- CANCELLED outcome → CANCELLED

The state is derived.

V0.7 must not persist a second mutable status field that can disagree with the terminal outcome.

### COMPLETED

COMPLETED means the fitting actually took place.

`occurredAt` represents when the fitting actually occurred.

A fitting can be recorded after the fact, therefore `occurredAt` may be earlier than `createdAt`.

`occurredAt` must not be in the future.

For COMPLETED:

- `baselineAgreementVersionId` is required;
- `resultingMeasurementVersionId` is optional;
- `observationSummary` is required and non-empty;
- `cancellationReason` must be null.

A satisfactory fitting still has meaningful evidence, for example:

> Fit checked against the approved garment terms; no production adjustment required.

### Historical approved baseline

A completed fitting must permanently reference the exact approved AgreementVersion that was authoritative at the fitting's `occurredAt`.

The baseline is server-derived.

The browser must not determine the authoritative fitting baseline.

Historical derivation must mirror the conservative V0.6 current-approved-baseline semantics.

For the fitting's `occurredAt`:

1. consider AgreementVersions for the Garment whose `createdAt` is at or before `occurredAt`;
2. select the highest revision among those versions;
3. that latest historical version is an approved baseline only when its APPROVED AgreementResolution also occurred at or before `occurredAt`;
4. if that latest historical version had no resolution yet, or had a REJECTED or WITHDRAWN resolution at that time, no approved fitting baseline exists.

V0.7 must not skip over a newer unresolved/rejected/withdrawn AgreementVersion merely to reuse an older approved revision.

If no approved baseline exists under those rules, the fitting cannot be recorded as COMPLETED for that `occurredAt`.

A later AgreementVersion or later AgreementResolution never rewrites the fitting's stored baseline.

This keeps the fitting interpretable against the exact agreement state that existed when it occurred.

### CANCELLED

CANCELLED means the fitting did not take place.

For CANCELLED:

- `baselineAgreementVersionId` must be null;
- `resultingMeasurementVersionId` must be null;
- `observationSummary` must be null;
- `cancellationReason` is required and non-empty.

A cancelled fitting cannot later become COMPLETED.

A completed fitting cannot later become CANCELLED.

### Terminal integrity

There must never be two terminal outcomes for one FittingSession.

Concurrent attempts must not create contradictory outcomes.

---

### Resulting measurement provenance

A COMPLETED fitting may optionally reference one resulting MeasurementVersion
through `resultingMeasurementVersionId`.

This relationship means:

> this immutable client MeasurementVersion was explicitly recorded as resulting from this completed fitting.

The MeasurementVersion remains ordinary client-level immutable evidence.

It does not mean:

- the MeasurementVersion becomes the garment's approved measurement;
- the AgreementVersion changes;
- a ChangeProposalVersion is approved;
- the newest measurement automatically wins.

When `resultingMeasurementVersionId` is present:

- the MeasurementVersion must belong to the same Business as the fitting;
- the MeasurementVersion must belong to the same Client as the fitting;
- the relationship is stored as part of the immutable COMPLETED FittingOutcome.

Because FittingOutcome is immutable, resulting measurement provenance must be
known when the fitting completion is recorded.

If a fitting has already been completed without a resulting measurement,
V0.7 does not mutate that historical FittingOutcome later to attach one.

Creating or referencing the resulting MeasurementVersion never changes an
AgreementVersion.

If the garment should use that MeasurementVersion as its approved measurement
baseline, V0.6 Change Control is still required.

---

## 6. FittingAdjustment

A FittingAdjustment is immutable evidence of a garment-specific production correction identified from a completed fitting.

Conceptual fields:

- id
- businessId
- clientId
- orderId
- garmentId
- fittingSessionId
- description
- recordedByMembershipId
- createdAt

An adjustment:

- must belong to a COMPLETED fitting;
- must belong to the same Business/Client/Order/Garment chain as the fitting;
- inherits the completed fitting's exact `baselineAgreementVersionId`;
- must have a meaningful non-empty description;
- cannot change the approved agreement;
- cannot change a MeasurementVersion;
- cannot silently select a different measurement version;
- cannot change price;
- cannot change delivery date;
- cannot change quantity;
- cannot replace approved style/design evidence.

The baseline does not need to be copied into every FittingAdjustment row if it can be reached immutably through its completed fitting.

The adjustment baseline is historical evidence.

A later approved AgreementVersion does not rebase or rewrite the adjustment.
The adjustment remains interpretable against the completed fitting's stored
baseline even when a newer AgreementVersion later becomes the current approved
baseline.

This historical relationship does not create another current-baseline
mechanism. Any change to approved garment terms still requires V0.6 Change
Control.


An adjustment may be created in the same transaction that completes a fitting, provided the completed fitting evidence and adjustment are persisted atomically and all invariants hold.

If approved terms need to change, Change Control is required instead.

---

## 7. FittingAdjustmentResolution

An adjustment may have at most one terminal resolution.

Allowed outcomes:

- COMPLETED
- VOIDED

Conceptual fields:

- id
- businessId
- fittingAdjustmentId
- outcome
- occurredAt
- note nullable for COMPLETED
- reason required for VOIDED
- recordedByMembershipId
- createdAt

`occurredAt` must not be in the future.

### COMPLETED

COMPLETED means the production adjustment was carried out.

It does not mean the client approved a new agreement.

It does not create a new AgreementVersion.

### VOIDED

VOIDED preserves an adjustment that was recorded but intentionally abandoned.

The original adjustment remains historical evidence.

V0.7 must never delete the adjustment to represent a void.

### Integrity

A resolved adjustment cannot receive another resolution.

Concurrent resolution attempts must not create contradictory results.

---


## 8. Measurement boundary

MeasurementVersion remains a client-level immutable record.

A fitting must not automatically create or modify a MeasurementVersion merely because the fitting occurred.

If staff determine during a fitting that the client's body measurements genuinely changed:

1. staff explicitly create a new MeasurementVersion through the existing measurement workflow;
2. the previous MeasurementVersion remains preserved;
3. the fitting completion may atomically record that new MeasurementVersion through `resultingMeasurementVersionId`;
4. merely creating or referencing the MeasurementVersion does not change the garment's approved baseline;
5. if the garment should use that MeasurementVersion instead of the one in the current approved AgreementVersion, that selection change must go through V0.6 Change Control.

This means:

> new body measurement evidence != automatically approved garment measurement baseline

There must be no implicit "latest measurement wins" rule.

There must also be no inference that a MeasurementVersion belongs to a fitting merely because:

- it belongs to the same Client;
- it was recorded on the same day;
- it was recorded near the fitting time;
- or it is currently the newest client measurement.

`FittingOutcome.resultingMeasurementVersionId` is the explicit fitting provenance relationship.

---

## 9. Change-control boundary

A fitting can reveal a material change, but a fitting cannot approve or apply one.

The existing V0.6 workflow remains authoritative.

Material fitting discovery:

Fitting
→ ChangeRequest
→ ChangeProposalVersion
→ client decision
→ amended approved AgreementVersion

### FittingChangeRequestLink

V0.7 preserves fitting provenance through a separate immutable relationship rather than changing the meaning of ChangeRequest.

Conceptual fields:

- businessId
- fittingSessionId
- changeRequestId
- createdByMembershipId
- createdAt

The relationship means:

> this ChangeRequest originated from a material discovery made during this fitting.

It does not change any V0.6 ChangeRequest lifecycle rule.

Required integrity:

- fitting and ChangeRequest belong to the same Business;
- fitting and ChangeRequest belong to the same Client/Order/Garment chain;
- the fitting must be COMPLETED;
- one ChangeRequest has at most one fitting provenance source;
- one fitting may lead to multiple ChangeRequests over time;
- duplicate fitting/request links are forbidden.

### Existing V0.6 rules remain authoritative

Creating a ChangeRequest from a fitting must still enforce all V0.6 rules, including:

- a current approved garment baseline must exist;
- only one active ChangeRequest may exist for the Garment;
- the request baseline is the V0.6 current approved baseline at the time the ChangeRequest is created;
- request provenance does not force the ChangeRequest to reuse the fitting's older baseline;
- request origin/requestedBy/channel/recorder semantics remain unchanged.

This distinction is important.

For example:

- fitting occurred against approved revision 1;
- revision 2 was later approved;
- staff then create a material ChangeRequest based on the fitting evidence.

That ChangeRequest must use revision 2 if revision 2 is now the V0.6 current approved baseline.

The fitting remains historical evidence against revision 1.

The ChangeRequest acts on the current approved baseline.

The creation of the ChangeRequest and its FittingChangeRequestLink should be atomic so provenance cannot be partially recorded.

---

## 10. Garment timeline

The garment timeline is derived.

There is no generic persisted TimelineEvent table in V0.7.

The timeline combines authoritative garment-scoped facts into one deterministic chronological read model.

Candidate event types:

- GARMENT_CREATED
- STYLE_REFERENCE_RECORDED
- AGREEMENT_VERSION_CREATED
- AGREEMENT_RESOLVED
- CHANGE_REQUESTED
- CHANGE_PROPOSAL_CREATED
- CHANGE_PROPOSAL_DECIDED
- CHANGE_REQUEST_CLOSED
- FITTING_SCHEDULED
- FITTING_COMPLETED
- FITTING_CANCELLED
- FITTING_MEASUREMENT_RECORDED
- FITTING_ADJUSTMENT_RECORDED
- FITTING_ADJUSTMENT_COMPLETED
- FITTING_ADJUSTMENT_VOIDED

The timeline may later be extended by V0.8 and V0.9 for financial and delivery events.

### Event timestamps

Use the authoritative domain timestamp when one exists.

Examples:

- garment creation → Garment.createdAt
- style reference → StyleReference.createdAt
- agreement version → AgreementVersion.createdAt
- agreement resolution → AgreementResolution.occurredAt
- change request → ChangeRequest.requestedAt
- change proposal → ChangeProposalVersion.createdAt
- change decision → ChangeProposalDecision.occurredAt
- change closure → ChangeRequestClosure.occurredAt
- fitting scheduled → FittingSession.createdAt, with scheduledFor as event metadata
- fitting completed/cancelled → FittingOutcome.occurredAt
- fitting measurement → referenced MeasurementVersion.measuredAt
- adjustment recorded → FittingAdjustment.createdAt
- adjustment resolution → FittingAdjustmentResolution.occurredAt

`FITTING_SCHEDULED` represents the historical act of scheduling.

It is therefore ordered by the time the scheduling record was created, not by the future appointment time.

`scheduledFor` remains visible event metadata.

### Deterministic ordering

Timeline ordering must be stable.

When event timestamps are equal, use deterministic secondary ordering:

1. authoritative event timestamp;
2. source createdAt;
3. stable event-kind rank;
4. source record ID.

The stable event-kind rank must be defined in application code and tested.

The same persisted state must always produce the same timeline order.

Timeline construction must not write data.

## 11. Measurement leakage rule

This is a critical V0.7 rule.

The current garment record can retrieve measurement history for the garment's Client.

That does not make every client MeasurementVersion a garment event.

The timeline must not flatten every `measurementVersions` entry into the garment timeline.

Doing so could display a MeasurementVersion created for another garment belonging to the same Client.

A MeasurementVersion may be surfaced in garment-specific history only when it is explicitly referenced by garment-scoped evidence, for example:

- an AgreementVersion;
- a ChangeProposalVersion;
- or a FittingOutcome `resultingMeasurementVersionId`.

No inference based on:

- "latest measurement";
- timestamps;
- same Client;
- or proximity to a fitting

is sufficient.

---

## 12. Current approved baseline

V0.7 must reuse the existing current-approved-baseline semantics from V0.6.

Fittings and adjustments do not create a new baseline.

Only the established agreement/change-control workflow changes the approved garment baseline.

A production adjustment therefore never causes:

- a new AgreementVersion;
- a new agreement revision number;
- a new selected MeasurementVersion;
- or an implicit approval.

---

## 13. Tenancy and authorization

All V0.7 Business mutations require an authenticated TenantContext.

Trusted values derive server-side where possible.

The browser must not authoritatively provide:

- businessId;
- clientId;
- orderId;
- garmentId;
- recordedByMembershipId;
- createdByMembershipId;
- fitting ownership;
- adjustment ownership;
- fitting baseline identity;
- fitting-measurement ownership;
- timeline source identity.

Route-bound IDs must still be verified against the current TenantContext.

Foreign or inaccessible records return NOT_FOUND rather than exposing cross-tenant existence.

All recorder/creator membership IDs come from TenantContext.

V0.7 introduces no anonymous client fitting mutation capability.

---

## 14. Append-oriented evidence

The following records are historical evidence and must not be silently edited or deleted:

- FittingSession identity/scheduling record;
- FittingOutcome, including any resulting measurement provenance;
- FittingAdjustment;
- FittingAdjustmentResolution;
- any fitting-to-change provenance relationship.

Correction is represented by later evidence, terminal resolution, cancellation, or a new record.

Historical facts remain inspectable.

---


## 15. Concurrency and database integrity

Correctness takes priority over premature optimization.

Database constraints must protect important invariants independently of application validation.

Required protections include:

- tenant-safe Business/Client/Order/Garment chains;
- at most one FittingOutcome per FittingSession;
- COMPLETED fitting requires an approved baseline;
- COMPLETED fitting requires an observation summary;
- CANCELLED fitting cannot carry a baseline or observation summary;
- CANCELLED fitting requires a cancellation reason;
- completed fitting baseline belongs to the same Garment chain;
- outcome-less FittingSession requires a schedule;
- COMPLETED fitting may reference at most one resulting MeasurementVersion;
- referenced resulting MeasurementVersion belongs to the same Business and Client;
- CANCELLED fitting cannot reference a resulting MeasurementVersion;
- at most one FittingAdjustmentResolution per adjustment;
- adjustment cannot point to a foreign fitting;
- fitting recorder belongs to the same Business;
- adjustment recorder belongs to the same Business;
- resolution recorder belongs to the same Business;
- fitting/change provenance cannot cross Business/Client/Order/Garment chains;
- each ChangeRequest has at most one fitting provenance source;
- duplicate terminal operations cannot succeed concurrently.

Lifecycle mutations that can race should use the established per-Garment serialization approach where appropriate.

This includes operations that determine:

- the approved fitting baseline;
- fitting terminal outcome;
- fitting-to-change provenance;
- adjustment terminal resolution.

Read-only timeline construction does not require a mutation lock.

---

## 16. Application operations

Expected V0.7 application operations include:

### Fittings

- schedule fitting
- record completed fitting
- complete scheduled fitting
- cancel fitting
- list fitting history for Garment

Completing a fitting must derive and persist the exact approved AgreementVersion effective at `occurredAt`.

When a resulting MeasurementVersion is recorded for that fitting, the completion
operation must validate its Business and Client ownership and persist its ID
atomically in the immutable FittingOutcome.

The MeasurementVersion remains client-level evidence and does not mutate the
approved garment baseline.

### Adjustments

- record fitting adjustment
- resolve adjustment as completed
- resolve adjustment as voided

### Change-control provenance

- create ChangeRequest from completed fitting
- atomically persist FittingChangeRequestLink
- list fitting provenance for ChangeRequests where required by history/timeline reads

The fitting-originated ChangeRequest operation must reuse the existing V0.6 change-control rules rather than implementing a weaker parallel lifecycle.

### Timeline

- get garment timeline

The timeline use case reads authoritative source records and returns a derived projection.

It performs no mutation.

Application use cases own business rules.

Infrastructure implements persistence ports.

Presentation validates input, resolves authenticated context, binds trusted IDs, calls application operations, and returns safe responses.

## 17. Garment record presentation

The existing garment record remains the Business workspace for V0.7.

It should gain:

- fitting scheduling/recording controls;
- fitting history;
- fitting observations;
- adjustment recording;
- adjustment resolution controls;
- clear action to route material discoveries into Change Control;
- unified chronological garment timeline.

The UI must visually distinguish:

- body measurement history;
- approved agreement;
- pending/material Change Control;
- fitting observations;
- production adjustments.

The UI must not imply that an adjustment changed the approved baseline.

---

## 18. Timeline presentation

The unified timeline should answer:

> What happened to this garment, and in what order?

Each entry should identify:

- event type;
- event time;
- concise human-readable description;
- relevant revision/outcome/state;
- source record identifier where useful.

Timeline presentation may link users to the detailed section for the underlying source record.

The detailed source records remain authoritative.

The timeline itself remains a projection.

---

## 19. Explicitly out of scope for V0.7

V0.7 does not introduce:

- invoices;
- payment ledger;
- balance calculations;
- refunds;
- automated payment reconciliation;
- delivery completion;
- delivery confirmation;
- full search;
- client accounts;
- fitting actions from the anonymous client portal;
- appointment reminders;
- calendar integration;
- SMS or WhatsApp automation;
- fitting photo/file storage;
- AI fitting recommendations;
- automatic measurement inference;
- automatic creation of ChangeRequests;
- automatic approval of changes;
- deleting historical fitting evidence.

Financial ledger work belongs to V0.8.

Delivery, search, and broader completed-garment history belong to V0.9.

---


## 20. End-to-end acceptance proofs

V0.7 is not complete until integration proof demonstrates at least these scenarios.

### Proof 1 — fitting lifecycle

Schedule fitting A.

Cancel fitting A.

Schedule fitting B.

Complete fitting B.

Verify:

- fitting A still exists;
- its original schedule remains preserved;
- fitting A derives CANCELLED;
- fitting B derives COMPLETED;
- fitting B stores the exact approved AgreementVersion effective when it occurred;
- no contradictory terminal outcomes exist;
- no mutable duplicate fitting status can disagree with its outcome.

### Proof 2 — production adjustment does not alter baseline

Start from approved AgreementVersion revision 1.

Complete a fitting against revision 1.

Record and complete a production adjustment.

Verify:

- fitting baseline is revision 1;
- approved AgreementVersion is unchanged;
- Agreement revision number is unchanged;
- selected MeasurementVersion is unchanged;
- price is unchanged;
- delivery date is unchanged;
- adjustment history remains visible.

### Proof 3 — body measurement change stays separate

Start from approved AgreementVersion revision 1 using MeasurementVersion A.

During the fitting workflow, explicitly create MeasurementVersion B for the same Client.

Complete the fitting and atomically persist B as the FittingOutcome
`resultingMeasurementVersionId`.

Verify:

- A remains preserved;
- B exists in client measurement history;
- the immutable COMPLETED FittingOutcome explicitly references B;
- revision 1 still selects A;
- B does not become the approved garment measurement merely because it is newer or fitting-related.

### Proof 4 — fitting baseline remains historically stable

Approve revision 1.

Complete fitting A against revision 1.

Later approve revision 2 through Change Control.

Read fitting A again.

Verify:

- fitting A still references revision 1;
- revision 2 does not rewrite fitting A;
- adjustment evidence from fitting A remains interpretable against revision 1.

### Proof 5 — material fitting discovery uses current Change Control baseline

Complete fitting A against approved revision 1.

Later make revision 2 the current approved baseline.

From fitting A, create a material ChangeRequest.

Verify:

- the fitting remains linked to revision 1;
- the ChangeRequest uses revision 2 as its V0.6 current approved baseline;
- a FittingChangeRequestLink connects fitting A to the request;
- the link does not alter ChangeRequest lifecycle semantics;
- approval of the proposal creates the next amended AgreementVersion;
- fitting provenance remains immutable historical evidence.

### Proof 6 — active ChangeRequest protection still applies

Complete a fitting.

Create one active ChangeRequest for the Garment.

Attempt to create another fitting-originated ChangeRequest while the first is active.

Verify:

- the second request is rejected by existing V0.6 rules;
- no orphan provenance link is created;
- no duplicate active request exists.

### Proof 7 — tenant safety

Attempt to read or mutate a fitting, adjustment, FittingOutcome containing resulting-measurement provenance, provenance link, or timeline through another Business context.

Verify:

- no cross-tenant record is exposed;
- operation returns NOT_FOUND or the established safe equivalent;
- no mutation occurs.

### Proof 8 — no same-client measurement leakage

Create two Garments for one Client.

Create measurement evidence relevant only to Garment B.

Read Garment A's timeline.

Verify:

- Garment B's unrelated measurement evidence does not appear in Garment A's timeline.

Then complete a fitting for Garment A with a different MeasurementVersion recorded as its `resultingMeasurementVersionId`.

Verify:

- that explicitly referenced resulting measurement may appear in Garment A's timeline;
- unrelated client measurements still do not appear.

### Proof 9 — deterministic timeline

Create multiple authoritative source events, including equal timestamps.

Read the garment timeline repeatedly.

Verify:

- ordering is deterministic;
- equal timestamps use the defined secondary ordering;
- every timeline entry maps to authoritative persisted evidence;
- no generic TimelineEvent rows are stored;
- timeline reads perform no mutation.

## 21. V0.7 implementation slices

### V0.7-A — domain contract

Documentation only.

Lock:

- fitting semantics;
- adjustment boundary;
- measurement boundary;
- Change Control boundary;
- timeline derivation rules;
- security and integrity requirements.

### V0.7-B — fitting and adjustment domain/application core

Implement pure fitting, resulting-measurement provenance, adjustment, and fitting/change provenance domain rules, application ports, and use cases.

No Prisma dependency in Domain or Application.

### V0.7-C — tenant-safe persistence schema and integrity

Add fitting, resulting-measurement provenance, adjustment, and fitting/change provenance persistence structures, migration, foreign-key chains, unique constraints, conditional integrity checks, timestamp checks where appropriate, and integrity tests.

### V0.7-D — transactional persistence and concurrency

Implement repositories and per-Garment serialized lifecycle operations.

Prove terminal-outcome and adjustment-resolution concurrency safety.

### V0.7-E — authenticated Business fitting workflow

Add server actions and Business UI for:

- scheduling;
- completing;
- cancelling fittings;
- recording adjustments;
- resolving adjustments;
- routing material fitting discoveries toward Change Control.

### V0.7-F — derived garment timeline

Build the tenant-safe timeline read model from authoritative records.

Integrate it into the garment workspace.

Do not persist duplicate timeline events.

### V0.7-G — end-to-end proof and release completion

Prove:

- fitting lifecycle;
- adjustment isolation;
- measurement isolation;
- fitting → Change Control → amended baseline;
- tenant safety;
- deterministic timeline;
- no cross-garment measurement leakage.

Then run the full release gates before V0.7 merge/tag.

---


## 22. Non-negotiable V0.7 invariants

1. A fitting does not alter an approved AgreementVersion.
2. A completed fitting permanently records the exact approved AgreementVersion authoritative at its occurredAt.
3. Historical fitting baseline derivation mirrors V0.6 latest-version semantics and never skips a newer unresolved/rejected/withdrawn revision to reuse an older approval.
4. A later AgreementVersion or resolution never rewrites historical fitting baseline evidence.
5. Fitting state is derived from immutable session/outcome evidence, not a mutable duplicate status.
6. An outcome-less fitting session must represent an actual scheduled fitting.
7. An adjustment does not alter an approved AgreementVersion.
8. A fitting does not silently create a MeasurementVersion.
9. Fitting-to-measurement provenance is represented by the optional immutable FittingOutcome `resultingMeasurementVersionId`.
10. A fitting-linked MeasurementVersion remains client-level evidence and does not automatically become the garment measurement.
11. A newer MeasurementVersion does not automatically become the garment measurement.
12. Material changes use V0.6 Change Control.
13. A fitting-originated ChangeRequest uses the V0.6 current approved baseline at request creation, not necessarily the historical fitting baseline.
14. Fitting-to-ChangeRequest provenance is immutable and does not weaken ChangeRequest lifecycle rules.
15. Historical fitting, measurement-provenance, adjustment, and change-provenance evidence is append-oriented.
16. The garment timeline is derived, not a second source of truth.
17. Client-level measurement history must not leak into unrelated garment timeline entries.
18. Recorder and creator identity comes from authenticated TenantContext.
19. Foreign resources are not exposed across tenants.
20. Timeline construction performs no writes.
