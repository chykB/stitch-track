# V0.6 Change Control and Client Portal Domain Contract

## 1. Purpose

V0.6 introduces controlled post-approval changes and a limited secure client
portal.

The milestone starts from the immutable approved AgreementVersion introduced
in V0.5.

An approved AgreementVersion is never edited in place.

A requested change must instead pass through an explicit change-control
workflow:

Approved AgreementVersion
→ ChangeRequest
→ ChangeProposalVersion
→ client decision
→ approved amended AgreementVersion

The client portal provides secure, narrowly-scoped actions without requiring
a full client account.

V0.6 does not introduce general client accounts, payments, invoices,
production task management, fittings, or delivery workflows.

---

## 2. Core principles

### 2.1 Approved agreement remains immutable

An APPROVED AgreementVersion is a historical commercial baseline.

Its:

- design summary
- fabric description
- quantity
- price
- currency
- delivery date
- measurement version
- exact style-reference set

must never be edited.

Post-approval changes create new records.

### 2.2 Change history is append-oriented

A change request, proposal version, client decision, and resulting amended
AgreementVersion are preserved as historical evidence.

Commercially important facts must not disappear when a later proposal or
agreement revision is created.

### 2.3 One controlled change workflow

V0.6 supports at most one active ChangeRequest for a Garment at a time.

This prevents competing post-approval proposals from creating ambiguous
commercial baselines.

### 2.4 Client portal is capability-based

The client does not receive a general StitchTrack account in V0.6.

Access is through a secure bearer capability that grants one narrowly-scoped
action.

The token itself is secret.

Possession of a valid token authorizes only the action and resource encoded
by its persisted grant.

### 2.5 V0.6 client decision channel extension

V0.6 extends the existing V0.5 ClientDecisionChannel domain with one additional
value:

- PORTAL

The complete channel set becomes:

- WHATSAPP
- EMAIL
- PHONE
- IN_PERSON
- OTHER
- PORTAL

PORTAL is reserved for decisions or requests actually recorded through a valid
client portal capability.

Authenticated Business forms must not allow a Business member to manually
select PORTAL as though it were an externally observed communication channel.

Existing V0.5 agreement decisions remain valid and unchanged.

### 2.6 Browser input is never authoritative for ownership

The browser or client portal must never choose:

- Business ownership
- Client ownership
- Order ownership
- baseline AgreementVersion ownership
- proposal revision numbers
- supersession relationships
- recorder membership
- client-name snapshots
- resulting AgreementVersion revision numbers

These are derived by authenticated or token-scoped application logic.

---

## 3. V0.6 workflow

The normal post-approval workflow is:

1. A Garment has an APPROVED AgreementVersion.
2. A ChangeRequest is recorded.
3. The Business evaluates the request.
4. The Business creates an immutable ChangeProposalVersion.
5. The client reviews the proposal.
6. The client APPROVES or REJECTS the proposal.
7. If REJECTED, the Business may issue another proposal version.
8. If APPROVED, the proposal becomes a new approved AgreementVersion baseline.
9. The ChangeRequest becomes terminal and no further proposal may be added.

A Business may also close an active ChangeRequest without client approval when
the change is withdrawn or cannot be fulfilled.

---

## 4. Approved baseline

Every ChangeRequest must reference one exact APPROVED AgreementVersion.

The referenced AgreementVersion is called the baseline.

### Current approved baseline

For V0.6, the current approved baseline is defined precisely as the
AgreementVersion with the highest revisionNumber for the Garment, provided
that version has an APPROVED AgreementResolution.

After a successful change approval:

- the newly-created AgreementVersion has the next Garment revisionNumber
- that version receives an APPROVED AgreementResolution atomically
- that version becomes the new current approved baseline
- the former approved baseline remains immutable historical evidence
- the new version supersedes the former approved baseline

The application must derive the current approved baseline from persisted
AgreementVersion and AgreementResolution history.

The browser, portal token, ChangeRequest form, or caller must not nominate an
arbitrary historical approved AgreementVersion as the current baseline.

If the Garment's latest AgreementVersion is not APPROVED, a new post-approval
ChangeRequest must not be created through V0.6 change control.

At ChangeRequest creation:

- the baseline must belong to the same Business
- the baseline must belong to the same Garment
- the baseline must have an APPROVED AgreementResolution
- the baseline must be the current approved baseline for that Garment
- another active ChangeRequest must not already exist for that Garment

A rejected or withdrawn V0.5 AgreementVersion cannot be a change-control
baseline.

A pending AgreementVersion cannot be a change-control baseline.

---

## 5. ChangeRequest

ChangeRequest represents the requested business change.

It records the request itself, not the proposed commercial response.

### Fields

ChangeRequest contains:

- id
- businessId
- clientId
- orderId
- garmentId
- baselineAgreementVersionId
- requestedBy
- origin
- requestChannel
- description
- requestedAt
- recordedByMembershipId
- createdAt

### requestedBy

Allowed values:

- CLIENT
- BUSINESS

### origin

Allowed values:

- BUSINESS_RECORDED
- CLIENT_PORTAL

BUSINESS_RECORDED means an authenticated Business member recorded the request.

CLIENT_PORTAL means the request was submitted through a valid client portal
grant.

### requestChannel

For a Business-recorded CLIENT request, allowed channels are:

- WHATSAPP
- EMAIL
- PHONE
- IN_PERSON
- OTHER

For CLIENT_PORTAL origin, the channel is PORTAL.

For a BUSINESS requested change, requestChannel is null.

### description

description is required.

It records what is being requested.

It must not contain the proposed commercial outcome unless the Business later
creates that outcome as a ChangeProposalVersion.

### requestedAt

requestedAt represents when the request occurred.

It must:

- not be in the future when recorded
- be on or after the baseline AgreementResolution occurredAt

For BUSINESS_RECORDED origin, an authenticated Business member may supply the
observed request time and the application validates it.

For CLIENT_PORTAL origin, requestedAt is assigned by the application when the
portal action succeeds.

The portal browser does not supply the authoritative request timestamp.

### recorder

For BUSINESS_RECORDED origin:

- recordedByMembershipId is required
- the membership must belong to the same Business

For CLIENT_PORTAL origin:

- recordedByMembershipId is null
- the portal grant supplies the trusted scope

---

## 6. ChangeRequest lifecycle

ChangeRequest business state is derived from its related evidence.

Conceptual states:

### OPEN

The request exists but no proposal is currently awaiting a decision.

This includes:

- a newly-created request
- a request whose latest proposal was REJECTED

### AWAITING_CLIENT

The latest ChangeProposalVersion has no decision.

### APPLIED

The latest ChangeProposalVersion was APPROVED and an amended approved
AgreementVersion was created.

This is terminal.

### WITHDRAWN

The Business closed the request as withdrawn.

This is terminal.

### IMPOSSIBLE

The Business recorded that the requested change cannot be fulfilled.

This is terminal.

The persisted implementation may use a technical active-slot marker to enforce
one active request per Garment.

Such a marker is coordination state and is not historical business evidence.

---

## 7. ChangeProposalVersion

A ChangeProposalVersion is an immutable proposal describing the complete
resulting agreement if the client accepts the change.

It does not store only a price delta or date delta.

It stores the complete proposed effective agreement terms so that the client
can compare the proposal with the approved baseline.

### Fields

ChangeProposalVersion contains:

- id
- businessId
- changeRequestId
- clientId
- orderId
- garmentId
- baselineAgreementVersionId
- revisionNumber
- supersedesChangeProposalVersionId
- measurementVersionId
- designSummary
- fabricDescription
- quantity
- priceAmount
- currency
- deliveryDate
- note
- rationale
- createdByMembershipId
- createdAt

### revisionNumber

Proposal revisions are sequential within one ChangeRequest.

The first proposal is revision 1.

Later proposal revisions increment by one.

The browser never supplies revisionNumber.

### supersession

Revision 1 has:

supersedesChangeProposalVersionId = null

A later proposal must reference the immediately previous proposal version.

A new proposal may be created only when the previous proposal was REJECTED.

A proposal cannot supersede:

- a pending proposal
- an approved proposal
- a proposal belonging to another ChangeRequest
- a proposal belonging to another Garment
- a proposal belonging to another Business

---

## 8. Proposed effective terms

The proposal contains the complete terms that will become effective after
approval.

### designSummary

Required.

Represents the resulting design after the requested change.

### fabricDescription

Optional.

Represents the resulting fabric understanding.

### quantity

Must be a positive integer.

### priceAmount

Canonical positive decimal string.

Persistence uses DECIMAL(19,4).

Maximum supported precision:

- 15 integer digits
- 4 fractional digits

No JavaScript floating-point arithmetic is used for commercial money.

### currency

Three uppercase letters.

The proposal must use the same currency as the approved baseline in V0.6.

V0.6 does not perform currency conversion.

### deliveryDate

Canonical YYYY-MM-DD calendar date.

The date may move earlier or later than the baseline.

### measurementVersionId

Optional.

If supplied it must belong to:

- the same Business
- the same Client

The proposal references an immutable MeasurementVersion.

It does not copy or modify measurement values.

### style references

The proposal records the exact immutable StyleReference set that will form the
resulting agreement.

Every referenced StyleReference must belong to:

- the same Business
- the same Garment

---

## 9. Commercial impact

V0.6 does not require a separately persisted calculated price delta.

The UI may show:

baseline price
→ proposed price

and:

baseline delivery date
→ proposed delivery date

because both values are immutable evidence.

The same comparison may be shown for:

- quantity
- design summary
- fabric description
- measurement version
- style-reference set

This avoids introducing derived financial values that could disagree with the
authoritative proposal.

---

## 10. ChangeProposalDecision

Each ChangeProposalVersion may have at most one terminal client decision.

Allowed outcomes:

- APPROVED
- REJECTED

A decision is immutable.

### Fields

ChangeProposalDecision contains:

- id
- businessId
- changeProposalVersionId
- outcome
- occurredAt
- clientNameSnapshot
- decisionSource
- clientDecisionChannel
- evidenceNote
- recordedByMembershipId
- portalGrantId
- createdAt

### occurredAt

ChangeProposalDecision occurredAt represents when the client decision actually
occurred.

It must:

- be on or after the ChangeProposalVersion createdAt
- not be in the future when recorded

For BUSINESS_RECORDED decisions, an authenticated Business member may supply
the observed decision time and the application validates it.

For CLIENT_PORTAL decisions, occurredAt is assigned by the application when
the portal decision succeeds.

The portal browser does not supply the authoritative decision timestamp.

### clientNameSnapshot

Derived from the ChangeRequest Client.

The browser or portal never provides the authoritative snapshot.

### decisionSource

Allowed values:

- BUSINESS_RECORDED
- CLIENT_PORTAL

### BUSINESS_RECORDED decision

When an authenticated Business member records the client's decision:

- recordedByMembershipId is required
- portalGrantId is null
- clientDecisionChannel must be one of:
  - WHATSAPP
  - EMAIL
  - PHONE
  - IN_PERSON
  - OTHER
- evidenceNote is required

### CLIENT_PORTAL decision

When the client decides through the portal:

- recordedByMembershipId is null
- portalGrantId is required
- clientDecisionChannel is PORTAL
- clientNameSnapshot is derived from the Client record
- evidenceNote may be generated by the application from the portal action

The portal must not accept a clientNameSnapshot or recordedByMembershipId.

---

## 11. Rejected proposal

REJECTED terminates that ChangeProposalVersion.

It does not automatically terminate the ChangeRequest.

After rejection the Business may:

- create the next proposal revision
- withdraw the ChangeRequest
- mark the ChangeRequest impossible

The rejected proposal remains immutable.

---

## 12. Approved proposal

APPROVED is the only outcome that may alter the effective commercial baseline.

Approval must atomically produce:

1. ChangeProposalDecision with APPROVED outcome.
2. A new immutable AgreementVersion.
3. An APPROVED AgreementResolution for that new AgreementVersion.
4. Terminal APPLIED state for the ChangeRequest.

If any part fails, none of the four effects may commit.

---

## 13. Amended AgreementVersion

The new AgreementVersion is created from the complete approved
ChangeProposalVersion.

It receives the next AgreementVersion revision number for the Garment.

The browser and client portal never choose that revision number.

The new AgreementVersion:

- belongs to the same Business
- belongs to the same Client
- belongs to the same Order
- belongs to the same Garment
- contains the proposal's exact effective terms
- supersedes the previously approved baseline
- becomes APPROVED atomically with the change approval

### V0.5 supersession rule extension

The V0.5 initial-agreement workflow still cannot supersede an APPROVED
AgreementVersion.

V0.6 introduces one controlled exception:

An APPROVED AgreementVersion may be superseded only by the change-control
application flow after an APPROVED ChangeProposalDecision.

This exception must not be exposed as a generic repository operation available
to presentation code.

---

## 14. AgreementResolution generated from approved change

The new AgreementVersion receives one APPROVED AgreementResolution.

The ChangeProposalDecision and the generated AgreementResolution represent two
different historical facts.

ChangeProposalDecision occurredAt records when the client made the decision.

AgreementResolution occurredAt records when StitchTrack applied that approved
decision and established the new AgreementVersion as the approved baseline.

The generated AgreementResolution occurredAt:

- is assigned by the application during the approval transaction
- must be on or after the new AgreementVersion createdAt
- must not be in the future
- does not overwrite or replace the original client decision timestamp

This preserves the V0.5 AgreementResolution temporal invariant while retaining
the original decision time in ChangeProposalDecision.

For CLIENT_PORTAL approval:

- clientNameSnapshot comes from the Client
- clientDecisionChannel is PORTAL
- evidence identifies that approval came from the portal decision
- evidence may reference the ChangeProposalDecision occurredAt

For BUSINESS_RECORDED approval:

- clientNameSnapshot comes from the Client
- channel comes from the recorded client decision
- evidence comes from the recorded decision evidence
- evidence may reference the ChangeProposalDecision occurredAt

---

## 15. ChangeRequestClosure

An active ChangeRequest may be closed without an approved proposal.

ChangeRequestClosure is immutable.

Allowed outcomes:

- WITHDRAWN
- IMPOSSIBLE

### Fields

ChangeRequestClosure contains:

- id
- businessId
- changeRequestId
- outcome
- reason
- occurredAt
- recordedByMembershipId
- createdAt

reason is required.

ChangeRequestClosure occurredAt must:

- be on or after the ChangeRequest createdAt
- not be in the future when recorded

The application validates the closure timestamp.

recordedByMembershipId must belong to the same Business.

Only an authenticated Business member may create a closure.

A closed request cannot:

- receive another proposal
- receive another closure
- become APPLIED

---

## 16. ClientPortalGrant

ClientPortalGrant represents a narrow bearer capability.

It is not a client account and not a session with general Business access.

### Purposes

Allowed purposes:

- REQUEST_CHANGE
- DECIDE_CHANGE_PROPOSAL

### Fields

ClientPortalGrant contains:

- id
- businessId
- clientId
- garmentId
- changeProposalVersionId
- purpose
- tokenHash
- expiresAt
- consumedAt
- revokedAt
- createdByMembershipId
- createdAt

### Grant issuance and timestamp invariants

Only an authenticated Business member may create a ClientPortalGrant.

createdByMembershipId must belong to the same Business as the grant.

The raw token is generated by trusted server-side application code.

The browser must not supply:

- tokenHash
- createdByMembershipId
- consumedAt
- revokedAt

At issuance:

- expiresAt must be later than createdAt
- consumedAt is null
- revokedAt is null

A grant may later become consumed or revoked, but not both.

When set:

- consumedAt must be on or after createdAt
- revokedAt must be on or after createdAt

Expiry does not rewrite historical grant timestamps.

### REQUEST_CHANGE grant

For REQUEST_CHANGE:

- changeProposalVersionId is null
- grant scope is one Business + Client + Garment
- successful submission creates one ChangeRequest
- successful submission consumes the grant

### DECIDE_CHANGE_PROPOSAL grant

For DECIDE_CHANGE_PROPOSAL:

- changeProposalVersionId is required
- the proposal must belong to the same Business, Client and Garment
- successful APPROVE or REJECT consumes the grant

---

## 17. Portal token security

The raw portal token is a bearer secret.

Requirements:

- token must have high cryptographic entropy
- raw token is returned only when the grant is created
- raw token is never persisted
- only a cryptographic hash is persisted
- tokenHash must be unique
- token lookup resolves the persisted grant
- token must not encode trusted Business or resource identifiers
- expired grants are invalid
- revoked grants are invalid
- consumed grants are invalid
- unsuccessful validation does not consume a grant
- successful action consumes the grant in the same transaction as the action

Portal error responses must not reveal whether:

- a Business exists
- a Client exists
- a Garment exists
- a proposal exists
- a token previously existed

Invalid portal access receives a generic unavailable-link response.

### Portal grant validity does not imply workflow actionability

A cryptographically valid, unexpired, unconsumed and unrevoked grant is not by
itself sufficient to authorize a mutation.

The application must also re-check the current workflow state inside the same
transaction that would perform the portal action.

For a DECIDE_CHANGE_PROPOSAL grant, the proposal must still be:

- part of an active ChangeRequest
- the latest ChangeProposalVersion for that ChangeRequest
- without an existing ChangeProposalDecision
- eligible for the submitted APPROVED or REJECTED action

A portal decision must fail if, before submission:

- another portal grant already decided the proposal
- a Business member already recorded the decision
- the proposal is no longer the latest proposal
- the ChangeRequest was WITHDRAWN
- the ChangeRequest was marked IMPOSSIBLE
- the ChangeRequest was already APPLIED
- the approved baseline was replaced through another completed lifecycle

For a REQUEST_CHANGE grant, the application must still verify that:

- the scoped Garment has a current approved baseline
- no active ChangeRequest already exists for that Garment

A stale or no-longer-actionable portal grant must never create:

- another ChangeRequest
- another proposal decision
- another AgreementVersion
- another AgreementResolution

The portal receives the same generic unavailable-link or unavailable-action
response used for invalid portal access.

Workflow-state failure must not leak which internal condition made the link
unavailable.

### Outstanding grant invalidation

When a workflow mutation makes previously-issued portal grants permanently
unusable, those grants should be revoked atomically where practical.

At minimum:

- successful ChangeRequest creation revokes other outstanding
  REQUEST_CHANGE grants for the same Business, Client and Garment
- any terminal ChangeProposalDecision revokes other outstanding
  DECIDE_CHANGE_PROPOSAL grants for that proposal
- ChangeRequestClosure revokes outstanding decision grants for proposals
  belonging to that ChangeRequest
- APPLIED completion leaves no outstanding decision grant capable of mutating
  the completed ChangeRequest

The grant used successfully through the portal is consumed.

Other grants made obsolete by that successful lifecycle transition are revoked,
not consumed.

---

## 18. Portal URL boundary

The portal URL should contain only the opaque token needed to resolve the
capability.

Business, Client, Garment, Agreement, ChangeRequest and Proposal identifiers
must not be trusted from URL parameters.

Conceptual routes may resemble:

/portal/change-request/{token}

/portal/change-decision/{token}

The exact route structure is a presentation concern, not a domain rule.

---

## 19. Portal request-change experience

A valid REQUEST_CHANGE grant may display only the minimum context needed for
the client to understand which Garment they are acting on.

The client submits:

- change description

The system derives:

- Business
- Client
- Order
- Garment
- approved baseline
- requestedBy = CLIENT
- origin = CLIENT_PORTAL
- requestChannel = PORTAL
- requestedAt
- portal grant

The client cannot select another Garment or Business.

---

## 20. Portal decision experience

A valid DECIDE_CHANGE_PROPOSAL grant may show:

- current approved baseline summary
- requested change
- proposal revision
- proposed design
- proposed fabric
- proposed quantity
- baseline price
- proposed price
- baseline delivery date
- proposed delivery date
- selected measurement version
- selected style references

The client may submit only:

- APPROVED or REJECTED
- optional client note if supported by presentation

The application derives all authoritative ownership and evidence fields.

---

## 21. Tenant-safe persistence requirements

Every V0.6 relationship must be tenant-safe.

At minimum, persistence must protect these chains.

### ChangeRequest

Business + Client:

(changeRequest.clientId, businessId)
→ Client(id, businessId)

Business + Order + Client:

(changeRequest.orderId, businessId, clientId)
→ Order(id, businessId, clientId)

Business + Garment + Order:

(changeRequest.garmentId, businessId, orderId)
→ Garment(id, businessId, orderId)

Baseline:

(baselineAgreementVersionId, businessId, garmentId)
→ AgreementVersion(id, businessId, garmentId)

Recorder when present:

(recordedByMembershipId, businessId)
→ BusinessMember(id, businessId)

### ChangeProposalVersion

ChangeRequest:

(changeRequestId, businessId, garmentId)
→ ChangeRequest(id, businessId, garmentId)

Baseline:

(baselineAgreementVersionId, businessId, garmentId)
→ AgreementVersion(id, businessId, garmentId)

Measurement when present:

(measurementVersionId, businessId, clientId)
→ MeasurementVersion(id, businessId, clientId)

Recorder:

(createdByMembershipId, businessId)
→ BusinessMember(id, businessId)

### Proposal style references

Proposal:

(changeProposalVersionId, businessId, garmentId)
→ ChangeProposalVersion(id, businessId, garmentId)

Style:

(styleReferenceId, businessId, garmentId)
→ StyleReference(id, businessId, garmentId)

### ChangeProposalDecision

Proposal:

(changeProposalVersionId, businessId)
→ ChangeProposalVersion(id, businessId)

Recorder when present:

(recordedByMembershipId, businessId)
→ BusinessMember(id, businessId)

Portal grant when present:

(portalGrantId, businessId)
→ ClientPortalGrant(id, businessId)

### ChangeRequestClosure

Request:

(changeRequestId, businessId)
→ ChangeRequest(id, businessId)

Recorder:

(recordedByMembershipId, businessId)
→ BusinessMember(id, businessId)

### ClientPortalGrant

Client:

(clientId, businessId)
→ Client(id, businessId)

Garment:

(garmentId, businessId)
→ Garment(id, businessId)

Proposal when present must resolve through the same Business and Garment.

---

## 22. Concurrency requirements

Change control must serialize lifecycle mutations per Garment.

The same per-Garment persistence boundary introduced in V0.5 may be reused or
extended.

Concurrency cases that must be protected include:

- two simultaneous ChangeRequest creations
- two simultaneous proposal creations
- approval racing with rejection
- portal decision racing with Business-recorded decision
- proposal approval racing with request closure
- two simultaneous amended AgreementVersion creations
- reuse of one portal grant
- portal action racing with grant revocation

Database uniqueness constraints remain final integrity barriers where practical.

---

## 23. Atomic business operations

The following operations require transactions.

### Create ChangeRequest

Transaction must ensure:

- approved current baseline is still current
- no other active ChangeRequest exists
- request is created
- portal grant is consumed when applicable
- other outstanding REQUEST_CHANGE grants for the same Business, Client and
  Garment are revoked when the new request makes them obsolete

### Create ChangeProposalVersion

Transaction must ensure:

- request is still active
- latest proposal lifecycle allows another revision
- exact measurement/style references remain valid
- proposal and style associations commit together

### Record REJECTED decision

Transaction must ensure:

- request is still active
- proposal is still latest
- proposal is still pending
- exactly one decision is created
- portal grant is consumed when applicable
- other outstanding decision grants for that proposal are revoked

### Record APPROVED decision

Transaction must ensure:

- request is active
- proposal is latest
- proposal is pending
- approved baseline is still current
- decision is created
- amended AgreementVersion is created
- AgreementResolution APPROVED is created
- request becomes terminal
- portal grant is consumed when applicable
- other outstanding decision grants made obsolete by approval are revoked

### Close ChangeRequest

Transaction must ensure:

- request is active
- no approved decision already exists
- closure is created
- outstanding decision grants for proposals in the request are revoked
- active lifecycle slot is released

---

## 24. Read-model rules

Business users may read change-control records only through TenantContext.

Foreign or inaccessible resources appear as NOT_FOUND.

The authenticated Garment record may include:

- approved baseline
- ChangeRequest history
- proposal history
- client decisions
- closures
- resulting amended agreement revisions

Client portal reads are not TenantContext reads.

They are capability-scoped reads resolved from one valid ClientPortalGrant.

The portal must receive only the data necessary for the granted action.

---

## 25. What V0.6 does not include

V0.6 does not include:

- full client usernames/passwords
- reusable client portal accounts
- client access to unrelated Orders or Garments
- payment collection
- invoices
- financial ledger
- tax or VAT calculations
- currency conversion
- production scheduling
- staff task assignment
- fitting workflow
- delivery confirmation
- WhatsApp API automation
- email automation
- AI decision making
- AI pricing
- automated change acceptance
- arbitrary editing of approved AgreementVersions

Portal links may be copied and sent manually by the Business.

---

## 26. Application-layer responsibilities

Application use cases are responsible for:

- deriving Client and Order from Garment
- finding the current approved baseline
- enforcing one active request per Garment
- calculating proposal revision numbers
- enforcing proposal lifecycle
- deriving client-name snapshots
- deriving recorder membership
- validating portal capability scope
- validating portal expiry/revocation/consumption
- producing amended AgreementVersion data
- creating approved amended baseline atomically
- mapping lifecycle conflicts to ApplicationError(CONFLICT)

Business rules do not belong in Server Actions or React components.

---

## 27. Presentation-layer responsibilities

Authenticated Server Actions may:

- validate identifiers
- validate form input
- resolve the current authenticated tenant
- call one composition/application operation
- convert errors to safe responses
- refresh affected pages after success

Portal Server Actions may:

- validate the raw token shape
- validate submitted action input
- call one portal-scoped composition/application operation
- return generic unavailable-link errors
- refresh or redirect after success

Presentation must not calculate:

- current baseline
- proposal revision number
- proposal supersession
- AgreementVersion revision number
- AgreementVersion supersession
- client-name snapshot
- recorder membership
- portal resource ownership

---

## 28. V0.6 success boundary

V0.6 is complete when the system can demonstrate this end-to-end scenario:

1. Garment has APPROVED AgreementVersion revision 1.
2. Client requests a design change.
3. ChangeRequest is preserved.
4. Business creates proposal revision 1 showing new terms.
5. Client can securely review the proposal.
6. Client rejects proposal revision 1.
7. Business creates proposal revision 2.
8. Client approves proposal revision 2.
9. Approval creates AgreementVersion revision 2 atomically.
10. AgreementVersion revision 2 is APPROVED.
11. AgreementVersion revision 1 remains unchanged.
12. Both proposal revisions and both decisions remain visible in history.
13. The portal token cannot be reused.
14. Another Business cannot access any of the records.
15. No manual edit of the approved baseline is possible.

That is the minimum proof that controlled post-approval change management exists.
