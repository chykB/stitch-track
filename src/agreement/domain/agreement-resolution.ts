export type AgreementResolutionOutcome =
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

export type ClientDecisionChannel =
  | "WHATSAPP"
  | "EMAIL"
  | "PHONE"
  | "IN_PERSON"
  | "OTHER"
  | "PORTAL";

export type AgreementResolutionDetails =
  Readonly<{
    outcome:
      AgreementResolutionOutcome;
    occurredAt: Date;
    clientNameSnapshot:
      string | null;
    clientDecisionChannel:
      ClientDecisionChannel | null;
    evidenceNote: string;
  }>;

export type AgreementResolution =
  AgreementResolutionDetails &
    Readonly<{
      id: string;
      businessId: string;
      agreementVersionId: string;
      recordedByMembershipId: string;
      createdAt: Date;
    }>;

export type NormalizeAgreementResolutionDetailsInput =
  Readonly<{
    outcome: string;
    occurredAt: Date;
    clientNameSnapshot?:
      string | null;
    clientDecisionChannel?:
      string | null;
    evidenceNote: string;
    agreementCreatedAt: Date;
    now: Date;
  }>;

function normalizeOutcome(
  input: string,
): AgreementResolutionOutcome {
  if (
    input !== "APPROVED" &&
    input !== "REJECTED" &&
    input !== "WITHDRAWN"
  ) {
    throw new Error(
      "Agreement resolution outcome is invalid.",
    );
  }

  return input;
}

function normalizeClientDecisionChannel(
  input?: string | null,
): ClientDecisionChannel | null {
  if (
    input === undefined ||
    input === null ||
    input.trim() === ""
  ) {
    return null;
  }

  const channel =
    input.trim();

  if (
    channel !== "WHATSAPP" &&
    channel !== "EMAIL" &&
    channel !== "PHONE" &&
    channel !== "IN_PERSON" &&
    channel !== "OTHER"
  ) {
    throw new Error(
      "Client decision channel is invalid.",
    );
  }

  return channel;
}

function normalizeClientNameSnapshot(
  input?: string | null,
): string | null {
  return (
    input
      ?.trim()
      .replace(/\s+/g, " ") ||
    null
  );
}

function normalizeEvidenceNote(
  input: string,
): string {
  const note =
    input.trim();

  if (!note) {
    throw new Error(
      "Agreement resolution evidence note is required.",
    );
  }

  return note;
}

export function normalizeAgreementResolutionDetails(
  input:
    NormalizeAgreementResolutionDetailsInput,
): AgreementResolutionDetails {
  const outcome =
    normalizeOutcome(
      input.outcome,
    );

  if (
    Number.isNaN(
      input.occurredAt.getTime(),
    )
  ) {
    throw new Error(
      "Agreement resolution time is invalid.",
    );
  }

  if (
    Number.isNaN(
      input.agreementCreatedAt.getTime(),
    ) ||
    Number.isNaN(
      input.now.getTime(),
    )
  ) {
    throw new Error(
      "Agreement resolution time boundary is invalid.",
    );
  }

  if (
    input.occurredAt <
    input.agreementCreatedAt
  ) {
    throw new Error(
      "Agreement resolution cannot occur before the agreement version was created.",
    );
  }

  if (
    input.occurredAt >
    input.now
  ) {
    throw new Error(
      "Agreement resolution cannot occur in the future.",
    );
  }

  const clientNameSnapshot =
    normalizeClientNameSnapshot(
      input.clientNameSnapshot,
    );

  const clientDecisionChannel =
    normalizeClientDecisionChannel(
      input.clientDecisionChannel,
    );

  if (
    outcome === "WITHDRAWN"
  ) {
    if (
      clientNameSnapshot ||
      clientDecisionChannel
    ) {
      throw new Error(
        "A withdrawn agreement cannot contain client decision evidence.",
      );
    }
  } else {
    if (!clientNameSnapshot) {
      throw new Error(
        "Client name snapshot is required for a client decision.",
      );
    }

    if (
      !clientDecisionChannel
    ) {
      throw new Error(
        "Client decision channel is required for a client decision.",
      );
    }
  }

  return {
    outcome,
    occurredAt:
      new Date(
        input.occurredAt.getTime(),
      ),
    clientNameSnapshot,
    clientDecisionChannel,
    evidenceNote:
      normalizeEvidenceNote(
        input.evidenceNote,
      ),
  };
}
