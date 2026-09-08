# V0.5 Versioned Agreement and Approval Domain

## Purpose

V0.5 introduces a versioned agreement for a garment and records the
terminal resolution of an exact agreement version: client approval,
client rejection, or Business withdrawal before a client decision.

The agreement connects the immutable facts already introduced in V0.4
with the commercial and delivery terms proposed for the garment.

V0.5 answers:

> Exactly what did the Business propose, and exactly how was that
> proposal resolved?

For client decisions, StitchTrack also preserves whether the client
approved or rejected the exact proposal.

V0.5 does not implement post-approval change control. That belongs to
V0.6.

---

## Domain Boundary

The core relationship is:

Business
└── Client
    └── Order
        └── Garment
            ├── StyleReference
            └── AgreementVersion
                ├── exact MeasurementVersion
                ├── exact StyleReference set
                └── AgreementResolution

A MeasurementVersion remains a historical measurement fact.

A StyleReference remains a historical design reference.

Neither record receives an approval flag.

Approval applies to the complete AgreementVersion that references them.

---

# 1. AgreementVersion

An AgreementVersion is an immutable proposal describing the terms for
one Garment at one point in time.

## Fields

- id
- businessId
- clientId
- orderId
- garmentId
- revisionNumber
- measurementVersionId?
- designSummary
- fabricDescription?
- quantity
- priceAmount
- currency
- deliveryDate
- note?
- supersedesAgreementVersionId?
- createdAt

## Meaning

### businessId

Identifies the tenant that owns the agreement.

### clientId

Identifies the Client derived from:

Garment → Order → Client

The browser must not be trusted to choose this Client.

### orderId

Identifies the Order derived from the Garment.

The browser must not be trusted to choose this Order.

### garmentId

Identifies the Garment the agreement describes.

### revisionNumber

A positive sequential integer scoped to one Garment.

Examples:

- revision 1
- revision 2
- revision 3

The browser must never assign revision numbers.

The application assigns the next revision based on the existing
agreement history.

The database must prevent duplicate revision numbers for the same
Business and Garment.

### measurementVersionId

Optional reference to the exact MeasurementVersion used by this
agreement.

If present:

- it must belong to the same Business;
- it must belong to the Client derived from the Garment's Order;
- it must reference one immutable MeasurementVersion;
- later measurement records do not change this agreement.

A MeasurementVersion is not globally "approved".

It is approved only in the context of an approved AgreementVersion that
references it.

### designSummary

Required textual description of the proposed garment design.

This is the human-readable agreement summary.

It must not be silently changed after creation.

### fabricDescription

Optional description of the fabric relevant to this agreement.

V0.5 does not introduce inventory or fabric-stock management.

### quantity

Positive integer representing the number of matching garment items
covered by this agreement.

V0.5 does not create inventory quantities or stock movements.

### priceAmount

Positive decimal representing the proposed total price for this
agreement version.

This value is an agreement term.

It is not a payment, invoice, deposit, balance, or financial-ledger
entry.

Those belong to V0.8.

The persistence contract for V0.5 is:

- PostgreSQL DECIMAL(19,4);
- maximum 15 normalized integer digits;
- maximum 4 fractional digits;
- value must be greater than zero;
- excess precision must be rejected rather than silently rounded.

Domain and application layers represent monetary values as canonical
decimal strings.

JavaScript floating-point numbers must not be used for persisted or
domain monetary values.

Infrastructure converts between the canonical decimal string and the
database decimal representation.

### currency

Three-letter uppercase currency code recorded with the agreement.

The persisted form must match:

`^[A-Z]{3}$`

Examples:

- NGN
- USD
- GBP

This format validation alone does not claim that every possible
three-letter value is a recognized ISO currency.

V0.5 does not implement exchange rates, tax, VAT, or currency
conversion.

### deliveryDate

The proposed calendar delivery date for this agreement version.

It is a calendar date rather than an instant in time.

The database should persist it using PostgreSQL DATE semantics rather
than a timestamp so timezone conversion cannot move the agreed delivery
day.

A later rejected or withdrawn version may contain a different delivery
date.

An approved version preserves the delivery date that was actually
agreed.

### note

Optional supporting agreement note.

### supersedesAgreementVersionId

Null for revision 1.

For later revisions, references the immediately previous
AgreementVersion for the same Business and Garment.

That previous version must have a terminal outcome of:

- REJECTED; or
- WITHDRAWN.

An APPROVED AgreementVersion cannot be superseded by the ordinary V0.5
revision workflow.

This makes the revision chain explicit.

### createdAt

Timestamp recording when the immutable agreement version was created.

---

# 2. AgreementStyleReference

AgreementVersion and StyleReference have a many-to-many relationship.

An AgreementVersion may contain zero or more StyleReferences.

A separate association record captures the exact StyleReferences that
were included in an agreement.

Conceptually:

AgreementVersion
└── AgreementStyleReference
    └── StyleReference

## Fields

- businessId
- agreementVersionId
- styleReferenceId
- garmentId
- createdAt

## Rules

Every linked StyleReference must:

- belong to the same Business;
- belong to the same Garment as the AgreementVersion.

A StyleReference is not globally approved.

Approval of the AgreementVersion means the reference was part of the
approved agreement.

Adding another StyleReference later must not modify an older
AgreementVersion.

The application creates a new AgreementVersion if the proposed
reference set changes before initial approval.

---

# 3. AgreementResolution

AgreementResolution is an immutable terminal record describing what
happened to one exact AgreementVersion.

It prevents client decisions from being confused with proposals that
the Business itself withdrew before the client responded.

## Fields

- id
- businessId
- agreementVersionId
- outcome
- occurredAt
- clientNameSnapshot?
- clientDecisionChannel?
- evidenceNote
- recordedByMembershipId
- createdAt

## Outcome

Allowed values:

- APPROVED
- REJECTED
- WITHDRAWN

The meanings are strict:

### APPROVED

The client accepted the exact AgreementVersion.

### REJECTED

The client declined the exact AgreementVersion.

REJECTED must never be used merely because the Business wants to edit,
correct, replace, or withdraw its own pending proposal.

### WITHDRAWN

The Business withdrew the pending AgreementVersion before a client
approval or rejection was recorded.

Typical reasons include:

- incorrect commercial terms;
- incorrect delivery date;
- wrong MeasurementVersion selected;
- wrong StyleReference selected;
- proposal replaced before the client responded.

WITHDRAWN is not a client rejection.

## Derived state

There is no mutable status field stored on AgreementVersion.

Its state is derived as:

- no AgreementResolution → PENDING
- APPROVED resolution → APPROVED
- REJECTED resolution → REJECTED
- WITHDRAWN resolution → WITHDRAWN

This prevents duplicated state from disagreeing with the historical
resolution record.

## occurredAt

Timestamp representing when the approval, rejection, or withdrawal
actually occurred.

It may differ from createdAt because staff may record an event after it
happened.

occurredAt must not:

- precede the AgreementVersion createdAt timestamp;
- be in the future when the resolution is recorded.

## clientNameSnapshot

Required for:

- APPROVED;
- REJECTED.

It stores the client's name as understood when the client decision was
recorded.

This preserves historical evidence even if the Client record is renamed
later.

For WITHDRAWN, clientNameSnapshot is null because withdrawal is a
Business action rather than a client decision.

## clientDecisionChannel

Required when outcome is:

- APPROVED;
- REJECTED.

Allowed values:

- WHATSAPP
- EMAIL
- PHONE
- IN_PERSON
- OTHER

It records how the client's decision was communicated.

For WITHDRAWN, clientDecisionChannel is null because the terminal action
came from the Business rather than the client.

## evidenceNote

Required note explaining the evidence or reason for the outcome.

Examples:

- "Approved by WhatsApp message."
- "Confirmed during fitting appointment."
- "Client requested a different sleeve design."
- "Withdrawn because the wrong delivery date was entered."

For APPROVED or REJECTED, the note should identify the operational
evidence as clearly as practical.

For WITHDRAWN, the note records why the Business withdrew the proposal.

V0.5 does not claim this information is cryptographic proof or legal
non-repudiation.

For V0.5, sufficient operational evidence for a client decision is:

- the exact immutable AgreementVersion;
- clientNameSnapshot;
- clientDecisionChannel;
- occurredAt;
- evidenceNote;
- recordedByMembershipId;
- createdAt.

Direct client-generated evidence belongs to the V0.6 client workflow.

## recordedByMembershipId

Identifies the authenticated Business member who recorded the
resolution.

The membership must belong to the same Business and must be authorized
when the operation is performed.

recordedByMembershipId is derived from the authenticated tenant context.
The browser must not supply it as trusted input.

clientNameSnapshot is derived from the AgreementVersion's Client when
APPROVED or REJECTED is recorded.

The browser must not supply clientNameSnapshot as trusted input.

The historical resolution remains valid if that membership later
becomes inactive.

V0.5 supports staff-recorded client decisions.

Direct client approval through secure client links belongs to V0.6.

## Immutability

One AgreementVersion may have at most one AgreementResolution.

A terminal outcome cannot be rewritten.

For example:

APPROVED → REJECTED

REJECTED → APPROVED

WITHDRAWN → APPROVED

are not allowed.

Historical corrections require a separate future workflow rather than
rewriting the original evidence.

---

# 4. Agreement Lifecycle

## First proposal

When no AgreementVersion exists for a Garment:

1. derive Business, Order, and Client from the authenticated Garment;
2. create revision 1;
3. reference the selected MeasurementVersion, if any;
4. reference the selected StyleReferences;
5. preserve the commercial and delivery terms;
6. leave the agreement PENDING until an AgreementResolution exists.

---

## Pending proposal

While the latest AgreementVersion has no AgreementResolution:

- its contents cannot be edited;
- another AgreementVersion cannot be created;
- exactly one terminal resolution may be recorded.

If the proposal itself must change before the client responds, V0.5
does not mutate the immutable version and does not fabricate a client
rejection.

The Business records the existing proposal as WITHDRAWN before creating
the replacement version.

---

## Withdrawal

When the latest AgreementVersion receives WITHDRAWN:

- that version remains permanently preserved;
- its measurement reference remains preserved;
- its style-reference set remains preserved;
- its commercial and delivery terms remain preserved;
- the withdrawal reason remains preserved;
- the next AgreementVersion may be created.

The next revision:

- receives revisionNumber + 1;
- supersedes the withdrawn version;
- may use a different MeasurementVersion;
- may use different StyleReferences;
- may use different design or commercial terms.

---

## Rejection

When the latest AgreementVersion receives REJECTED:

- that version remains permanently preserved;
- its measurement reference remains preserved;
- its style-reference set remains preserved;
- its price and delivery terms remain preserved;
- the rejection evidence remains preserved;
- the next AgreementVersion may be created.

The next revision:

- receives revisionNumber + 1;
- supersedes the rejected version;
- may use a different MeasurementVersion;
- may use different StyleReferences;
- may use different design or commercial terms.

---

## Approval

When an AgreementVersion receives APPROVED:

- the version remains permanently preserved;
- the resolution remains permanently preserved;
- it becomes the initial agreed baseline for the Garment.

V0.5 must not allow another ordinary AgreementVersion to be created
after approval.

Any requested modification after approval belongs to V0.6 change
control.

---

# 5. Core Invariants

## Tenant integrity

Every agreement-related record belongs to exactly one Business.

Cross-tenant references must be rejected at both application and
database boundaries where possible.

A foreign or inaccessible resource must continue to appear as
NOT_FOUND.

---

## Garment chain integrity

Agreement creation begins with:

- requested Business;
- requested Garment.

The system derives:

Garment → Order → Client

The browser must not choose or override:

- clientId;
- orderId;
- revisionNumber.

---

## Parent-chain database integrity

Application validation is required, but the database should also enforce
the exact relationship chain wherever PostgreSQL foreign keys can
express it.

AgreementVersion intentionally stores businessId, clientId, orderId,
and garmentId so composite foreign keys can prove that they describe
the same chain.

Conceptually the database must enforce:

AgreementVersion
  (clientId, businessId)
      → Client
        (id, businessId)

AgreementVersion
  (orderId, businessId, clientId)
      → Order
        (id, businessId, clientId)

AgreementVersion
  (garmentId, businessId, orderId)
      → Garment
        (id, businessId, orderId)

When measurementVersionId is present:

AgreementVersion
  (measurementVersionId, businessId, clientId)
      → MeasurementVersion
        (id, businessId, clientId)

For AgreementStyleReference:

AgreementStyleReference
  (agreementVersionId, businessId, garmentId)
      → AgreementVersion
        (id, businessId, garmentId)

AgreementStyleReference
  (styleReferenceId, businessId, garmentId)
      → StyleReference
        (id, businessId, garmentId)

For supersession:

AgreementVersion
  (supersedesAgreementVersionId, businessId, garmentId)
      → AgreementVersion
        (id, businessId, garmentId)

Supporting composite unique indexes may be added to existing V0.3 and
V0.4 tables where PostgreSQL requires them as referenced keys.

These constraints prevent both cross-tenant references and same-tenant
wrong-parent references.

---

## Measurement integrity

When measurementVersionId is present, the referenced
MeasurementVersion must belong to:

- the same Business;
- the same Client derived from the Garment's Order.

A measurement belonging to another Client in the same Business must be
rejected.

---

## Style-reference integrity

Every StyleReference included in an AgreementVersion must belong to:

- the same Business;
- the same Garment.

A StyleReference belonging to another Garment in the same Business must
be rejected.

---

## Revision integrity

For one Business and Garment:

- revision numbers start at 1;
- revision numbers increase sequentially;
- revision numbers cannot be reused;
- a later revision must supersede the immediately previous REJECTED or
  WITHDRAWN version;
- a new revision cannot be created while the latest version is pending;
- a new ordinary revision cannot be created after approval.

Revision allocation and terminal resolution must be concurrency-safe.

Agreement lifecycle transitions for the same Garment must be serialized
inside the persistence transaction.

This protects against races such as:

- two requests attempting to create the same next revision;
- one request approving the latest revision while another attempts to
  create a replacement revision;
- two requests attempting different terminal resolutions.

The database unique constraint on Business + Garment + revisionNumber
remains the final protection against duplicate revision numbers.

The one-resolution-per-version constraint remains the final protection
against duplicate terminal resolutions.

A concurrent lifecycle conflict must fail safely rather than silently
overwriting, reusing, or contradicting historical state.

---

## Resolution integrity

One AgreementVersion may have at most one AgreementResolution.

A resolution may only be recorded for the latest unresolved
AgreementVersion for that Garment.

APPROVED and REJECTED represent client decisions.

WITHDRAWN represents a Business action.

These meanings must not be substituted for one another.

A terminal resolution cannot later be replaced with another terminal
resolution.

---

## Immutability

After creation, application workflows do not update or delete:

- AgreementVersion;
- AgreementStyleReference;
- AgreementResolution.

History is append-oriented.

---

# 6. Database Integrity Requirements

The Prisma/PostgreSQL design should enforce as much of the domain as
practical.

Expected constraints include:

- AgreementVersion belongs to Business;
- AgreementVersion belongs to the exact Garment/Order/Client chain;
- unique revisionNumber per Business + Garment;
- optional MeasurementVersion belongs to the same Business + Client;
- superseded AgreementVersion belongs to the same Business + Garment;
- AgreementStyleReference belongs to the same Business + Garment;
- unique StyleReference association within one AgreementVersion;
- one AgreementResolution per AgreementVersion;
- AgreementResolution belongs to the same Business as AgreementVersion;
- recordedByMembershipId belongs to the same Business;
- APPROVED and REJECTED require clientNameSnapshot;
- APPROVED and REJECTED require clientDecisionChannel;
- WITHDRAWN has no clientNameSnapshot or clientDecisionChannel;
- every resolution requires a non-empty evidenceNote;
- quantity > 0;
- priceAmount uses DECIMAL(19,4);
- priceAmount > 0;
- excess monetary precision is rejected rather than rounded;
- currency matches the three-letter uppercase persisted form;
- deliveryDate uses calendar-date semantics.

Application-level validation remains required even when a database
constraint also exists.

---

# 7. Server Boundary Rules

Server Actions may:

- validate identifiers and form input;
- bind the requested Business and Garment identifiers;
- resolve the authenticated tenant;
- call application operations;
- translate errors into safe responses.

Server Actions must not:

- accept trusted clientId from the browser;
- accept trusted orderId from the browser;
- accept revisionNumber from the browser;
- accept trusted clientNameSnapshot from the browser;
- accept trusted recordedByMembershipId from the browser;
- contain agreement lifecycle rules;
- directly access Prisma;
- expose whether a foreign resource exists.

---

# 8. V0.5 Initial UI Workflow

The authenticated Business workflow may:

1. open an existing Garment record;
2. review MeasurementVersion history;
3. review StyleReference history;
4. create the initial AgreementVersion;
5. inspect the exact agreement version;
6. record APPROVED, REJECTED, or WITHDRAWN;
7. if rejected or withdrawn, create the next proposal revision;
8. view preserved agreement and resolution history.

The UI must clearly distinguish:

- recorded facts;
- proposed agreement;
- approved agreement;
- rejected agreement;
- withdrawn agreement.

---

# 9. Explicitly Out of Scope for V0.5

V0.5 does not implement:

- direct client portal access;
- secure client action links;
- post-approval change requests;
- change pricing calculations;
- change delivery-date calculations;
- automatic acceptance;
- fitting workflow;
- adjustment workflow;
- payment collection;
- deposits;
- balances;
- invoices;
- financial ledger;
- tax or VAT;
- delivery confirmation;
- production task scheduling;
- AI-generated approval decisions.

These belong to later roadmap milestones.

---

# 10. V0.5 Completion Criteria

V0.5 is complete when StitchTrack can prove:

1. an AgreementVersion records one exact immutable proposal;
2. Business, Order, Client, and Garment relationships are tenant-safe;
3. the agreement references the exact MeasurementVersion used;
4. the agreement preserves the exact StyleReference set used;
5. revision history cannot overwrite previous proposals;
6. one immutable APPROVED, REJECTED, or WITHDRAWN resolution can be
   recorded;
7. withdrawn proposals do not masquerade as client rejections;
8. rejected or withdrawn proposals can be superseded by a new revision;
9. approved proposals become the initial baseline;
10. client decisions preserve the client snapshot, communication channel,
    event time, evidence note, and authenticated recorder;
11. cross-tenant and same-tenant wrong-parent references are rejected;
12. concurrent lifecycle operations cannot create contradictory
    agreement history;
13. the complete initial agreement history can be retrieved safely.
