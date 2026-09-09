import type {
  AgreementVersion,
} from "../../agreement/domain/agreement-version";
import type {
  ChangeProposalDecision,
} from "./change-proposal-decision";
import type {
  ChangeProposalVersion,
} from "./change-proposal-version";

export type ChangeRequestClosureOutcome =
  | "WITHDRAWN"
  | "IMPOSSIBLE";

export type ChangeRequestClosureDetails =
  Readonly<{
    outcome:
      ChangeRequestClosureOutcome;
    reason: string;
    occurredAt: Date;
  }>;

export type ChangeRequestClosure =
  ChangeRequestClosureDetails &
    Readonly<{
      id: string;
      businessId: string;
      changeRequestId: string;
      recordedByMembershipId:
        string;
      createdAt: Date;
    }>;

export type ChangeRequestState =
  | "OPEN"
  | "AWAITING_CLIENT"
  | "APPLIED"
  | "WITHDRAWN"
  | "IMPOSSIBLE";

export type NormalizeChangeRequestClosureDetailsInput =
  Readonly<{
    outcome: string;
    reason: string;
    occurredAt: Date;
    requestCreatedAt: Date;
    now: Date;
  }>;

function normalizeRequiredText(
  value: string,
  fieldName: string,
): string {
  const normalized =
    value
      .trim()
      .replace(/\s+/g, " ");

  if (!normalized) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return normalized;
}

function requireValidDate(
  value: Date,
  fieldName: string,
): void {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    throw new Error(
      `${fieldName} must be a valid date.`,
    );
  }
}

function normalizeClosureOutcome(
  value: string,
): ChangeRequestClosureOutcome {
  if (
    value !== "WITHDRAWN" &&
    value !== "IMPOSSIBLE"
  ) {
    throw new Error(
      "Change request closure outcome is invalid.",
    );
  }

  return value;
}

export function normalizeChangeRequestClosureDetails(
  input:
    NormalizeChangeRequestClosureDetailsInput,
): ChangeRequestClosureDetails {
  const outcome =
    normalizeClosureOutcome(
      input.outcome,
    );

  const reason =
    normalizeRequiredText(
      input.reason,
      "Change request closure reason",
    );

  requireValidDate(
    input.occurredAt,
    "Closure time",
  );

  requireValidDate(
    input.requestCreatedAt,
    "Change request creation time",
  );

  requireValidDate(
    input.now,
    "Current time",
  );

  if (
    input.occurredAt.getTime() <
    input.requestCreatedAt.getTime()
  ) {
    throw new Error(
      "Closure time cannot be before the change request was created.",
    );
  }

  if (
    input.occurredAt.getTime() >
    input.now.getTime()
  ) {
    throw new Error(
      "Closure time cannot be in the future.",
    );
  }

  return {
    outcome,
    reason,
    occurredAt:
      new Date(
        input.occurredAt,
      ),
  };
}

function sameStringSet(
  left:
    readonly string[],
  right:
    readonly string[],
): boolean {
  if (
    left.length !==
    right.length
  ) {
    return false;
  }

  const orderedLeft =
    [...left].sort();

  const orderedRight =
    [...right].sort();

  return orderedLeft.every(
    (value, index) =>
      value ===
      orderedRight[index],
  );
}

export function isAppliedAgreementForProposal(
  latestProposal:
    ChangeProposalVersion,
  appliedAgreement:
    AgreementVersion,
): boolean {
  const ownershipMatches =
    appliedAgreement.businessId ===
      latestProposal.businessId &&
    appliedAgreement.clientId ===
      latestProposal.clientId &&
    appliedAgreement.orderId ===
      latestProposal.orderId &&
    appliedAgreement.garmentId ===
      latestProposal.garmentId &&
    appliedAgreement
      .supersedesAgreementVersionId ===
      latestProposal
        .baselineAgreementVersionId;

  const termsMatch =
    appliedAgreement
      .measurementVersionId ===
      latestProposal
        .measurementVersionId &&
    appliedAgreement
      .designSummary ===
      latestProposal
        .designSummary &&
    appliedAgreement
      .fabricDescription ===
      latestProposal
        .fabricDescription &&
    appliedAgreement.quantity ===
      latestProposal.quantity &&
    appliedAgreement.priceAmount ===
      latestProposal.priceAmount &&
    appliedAgreement.currency ===
      latestProposal.currency &&
    appliedAgreement.deliveryDate ===
      latestProposal.deliveryDate &&
    appliedAgreement.note ===
      latestProposal.note &&
    sameStringSet(
      appliedAgreement
        .styleReferenceIds,
      latestProposal
        .styleReferenceIds,
    );

  return (
    ownershipMatches &&
    termsMatch
  );
}

function assertAppliedAgreementMatchesProposal(
  latestProposal:
    ChangeProposalVersion,
  appliedAgreement:
    AgreementVersion,
): void {
  if (
    !isAppliedAgreementForProposal(
      latestProposal,
      appliedAgreement,
    )
  ) {
    throw new Error(
      "Applied agreement version does not match the approved change proposal.",
    );
  }
}

export function deriveChangeRequestState(
  latestProposal:
    ChangeProposalVersion | null,
  latestDecision:
    ChangeProposalDecision | null,
  closure:
    ChangeRequestClosure | null,
  appliedAgreementVersion:
    AgreementVersion | null = null,
): ChangeRequestState {
  if (closure) {
    if (
      latestDecision?.outcome ===
        "APPROVED" ||
      appliedAgreementVersion
    ) {
      throw new Error(
        "An applied change request cannot also be closed.",
      );
    }

    return closure.outcome;
  }

  if (!latestProposal) {
    if (latestDecision) {
      throw new Error(
        "A change request decision requires a proposal.",
      );
    }

    if (appliedAgreementVersion) {
      throw new Error(
        "An applied agreement version requires an approved proposal.",
      );
    }

    return "OPEN";
  }

  if (!latestDecision) {
    if (appliedAgreementVersion) {
      throw new Error(
        "An applied agreement version requires an approved proposal decision.",
      );
    }

    return "AWAITING_CLIENT";
  }

  if (
    latestDecision
      .changeProposalVersionId !==
    latestProposal.id
  ) {
    throw new Error(
      "The latest decision does not belong to the latest proposal.",
    );
  }

  if (
    latestDecision.outcome ===
    "APPROVED"
  ) {
    if (!appliedAgreementVersion) {
      throw new Error(
        "An approved change proposal requires an applied agreement version.",
      );
    }

    assertAppliedAgreementMatchesProposal(
      latestProposal,
      appliedAgreementVersion,
    );

    return "APPLIED";
  }

  if (appliedAgreementVersion) {
    throw new Error(
      "A rejected change proposal cannot have an applied agreement version.",
    );
  }

  return "OPEN";
}

export function assertChangeRequestActive(
  state: ChangeRequestState,
): void {
  if (
    state === "APPLIED" ||
    state === "WITHDRAWN" ||
    state === "IMPOSSIBLE"
  ) {
    throw new Error(
      "The change request is already terminal.",
    );
  }
}
