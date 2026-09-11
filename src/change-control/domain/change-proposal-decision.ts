import type {
  ClientDecisionChannel,
} from "../../agreement/domain/agreement-resolution";

export type ChangeProposalDecisionOutcome =
  | "APPROVED"
  | "REJECTED";

export type ChangeProposalDecisionSource =
  | "BUSINESS_RECORDED"
  | "CLIENT_PORTAL";

export type ChangeProposalDecisionChannel =
  | ClientDecisionChannel
  | "PORTAL";

export type ChangeProposalDecisionDetails =
  Readonly<{
    outcome:
      ChangeProposalDecisionOutcome;
    occurredAt: Date;
    clientNameSnapshot: string;
    decisionSource:
      ChangeProposalDecisionSource;
    clientDecisionChannel:
      ChangeProposalDecisionChannel;
    evidenceNote: string;
  }>;

export type ChangeProposalDecision =
  ChangeProposalDecisionDetails &
    Readonly<{
      id: string;
      businessId: string;
      changeProposalVersionId:
        string;
      recordedByMembershipId:
        string | null;
      portalGrantId:
        string | null;
      createdAt: Date;
    }>;

export type NormalizeChangeProposalDecisionDetailsInput =
  Readonly<{
    outcome: string;
    occurredAt: Date;
    clientNameSnapshot: string;
    decisionSource: string;
    clientDecisionChannel:
      string | null | undefined;
    evidenceNote: string;
    proposalCreatedAt: Date;
    now: Date;
  }>;

const BUSINESS_CHANNELS =
  new Set<ClientDecisionChannel>([
    "WHATSAPP",
    "EMAIL",
    "PHONE",
    "IN_PERSON",
    "OTHER",
  ]);

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

function normalizeOutcome(
  value: string,
): ChangeProposalDecisionOutcome {
  if (
    value !== "APPROVED" &&
    value !== "REJECTED"
  ) {
    throw new Error(
      "Change proposal decision outcome is invalid.",
    );
  }

  return value;
}

function normalizeDecisionSource(
  value: string,
): ChangeProposalDecisionSource {
  if (
    value !== "BUSINESS_RECORDED" &&
    value !== "CLIENT_PORTAL"
  ) {
    throw new Error(
      "Change proposal decision source is invalid.",
    );
  }

  return value;
}

function normalizeDecisionChannel(
  value:
    string | null | undefined,
): ChangeProposalDecisionChannel {
  if (
    value === null ||
    value === undefined ||
    value.trim() === ""
  ) {
    throw new Error(
      "Client decision channel is required.",
    );
  }

  const normalized =
    value
      .trim()
      .toUpperCase();

  if (normalized === "PORTAL") {
    return "PORTAL";
  }

  if (
    BUSINESS_CHANNELS.has(
      normalized as ClientDecisionChannel,
    )
  ) {
    return normalized as
      ClientDecisionChannel;
  }

  throw new Error(
    "Client decision channel is invalid.",
  );
}

export function normalizeChangeProposalDecisionDetails(
  input:
    NormalizeChangeProposalDecisionDetailsInput,
): ChangeProposalDecisionDetails {
  const outcome =
    normalizeOutcome(
      input.outcome,
    );

  const decisionSource =
    normalizeDecisionSource(
      input.decisionSource,
    );

  const clientDecisionChannel =
    normalizeDecisionChannel(
      input.clientDecisionChannel,
    );

  const clientNameSnapshot =
    normalizeRequiredText(
      input.clientNameSnapshot,
      "Client name snapshot",
    );

  const evidenceNote =
    normalizeRequiredText(
      input.evidenceNote,
      "Decision evidence note",
    );

  requireValidDate(
    input.occurredAt,
    "Decision time",
  );

  requireValidDate(
    input.proposalCreatedAt,
    "Proposal creation time",
  );

  requireValidDate(
    input.now,
    "Current time",
  );

  if (
    input.occurredAt.getTime() <
    input.proposalCreatedAt.getTime()
  ) {
    throw new Error(
      "Decision time cannot be before the proposal was created.",
    );
  }

  if (
    input.occurredAt.getTime() >
    input.now.getTime()
  ) {
    throw new Error(
      "Decision time cannot be in the future.",
    );
  }

  if (
    decisionSource ===
    "CLIENT_PORTAL"
  ) {
    if (
      clientDecisionChannel !==
      "PORTAL"
    ) {
      throw new Error(
        "A client portal decision must use the PORTAL channel.",
      );
    }
  } else if (
    clientDecisionChannel ===
    "PORTAL"
  ) {
    throw new Error(
      "A Business-recorded decision cannot use the PORTAL channel.",
    );
  }

  return {
    outcome,
    occurredAt:
      new Date(
        input.occurredAt,
      ),
    clientNameSnapshot,
    decisionSource,
    clientDecisionChannel,
    evidenceNote,
  };
}
