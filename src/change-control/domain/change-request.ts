import type {
  ClientDecisionChannel,
} from "../../agreement/domain/agreement-resolution";

export type ChangeRequestedBy =
  | "CLIENT"
  | "BUSINESS";

export type ChangeRequestOrigin =
  | "BUSINESS_RECORDED"
  | "CLIENT_PORTAL";

export type ChangeRequestChannel =
  | ClientDecisionChannel
  | "PORTAL";

export type ChangeRequestDetails =
  Readonly<{
    requestedBy:
      ChangeRequestedBy;
    origin:
      ChangeRequestOrigin;
    requestChannel:
      ChangeRequestChannel | null;
    description: string;
    requestedAt: Date;
  }>;

export type ChangeRequest =
  ChangeRequestDetails &
    Readonly<{
      id: string;
      businessId: string;
      clientId: string;
      orderId: string;
      garmentId: string;
      baselineAgreementVersionId:
        string;
      recordedByMembershipId:
        string | null;
      createdAt: Date;
    }>;

export type NormalizeChangeRequestDetailsInput =
  Readonly<{
    requestedBy: string;
    origin: string;
    requestChannel?:
      string | null;
    description: string;
    requestedAt: Date;
    baselineResolutionOccurredAt:
      Date;
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

function normalizeRequestedBy(
  value: string,
): ChangeRequestedBy {
  if (
    value !== "CLIENT" &&
    value !== "BUSINESS"
  ) {
    throw new Error(
      "Requested by must be CLIENT or BUSINESS.",
    );
  }

  return value;
}

function normalizeOrigin(
  value: string,
): ChangeRequestOrigin {
  if (
    value !== "BUSINESS_RECORDED" &&
    value !== "CLIENT_PORTAL"
  ) {
    throw new Error(
      "Change request origin is invalid.",
    );
  }

  return value;
}

function normalizeRequestChannel(
  value:
    string | null | undefined,
): ChangeRequestChannel | null {
  if (
    value === null ||
    value === undefined ||
    value.trim() === ""
  ) {
    return null;
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
    "Change request channel is invalid.",
  );
}

export function normalizeChangeRequestDetails(
  input:
    NormalizeChangeRequestDetailsInput,
): ChangeRequestDetails {
  const requestedBy =
    normalizeRequestedBy(
      input.requestedBy,
    );

  const origin =
    normalizeOrigin(
      input.origin,
    );

  const requestChannel =
    normalizeRequestChannel(
      input.requestChannel,
    );

  const description =
    normalizeRequiredText(
      input.description,
      "Change request description",
    );

  requireValidDate(
    input.requestedAt,
    "Requested at",
  );

  requireValidDate(
    input.baselineResolutionOccurredAt,
    "Baseline resolution time",
  );

  requireValidDate(
    input.now,
    "Current time",
  );

  if (
    input.requestedAt.getTime() >
    input.now.getTime()
  ) {
    throw new Error(
      "Change request time cannot be in the future.",
    );
  }

  if (
    input.requestedAt.getTime() <
    input
      .baselineResolutionOccurredAt
      .getTime()
  ) {
    throw new Error(
      "Change request time cannot be before the approved baseline.",
    );
  }

  if (
    origin === "CLIENT_PORTAL"
  ) {
    if (requestedBy !== "CLIENT") {
      throw new Error(
        "A portal change request must be requested by the client.",
      );
    }

    if (requestChannel !== "PORTAL") {
      throw new Error(
        "A portal change request must use the PORTAL channel.",
      );
    }
  } else if (
    requestedBy === "BUSINESS"
  ) {
    if (requestChannel !== null) {
      throw new Error(
        "A Business-requested change does not use a client communication channel.",
      );
    }
  } else {
    if (
      requestChannel === null ||
      requestChannel === "PORTAL"
    ) {
      throw new Error(
        "A Business-recorded client request requires a client communication channel.",
      );
    }
  }

  return {
    requestedBy,
    origin,
    requestChannel,
    description,
    requestedAt:
      new Date(
        input.requestedAt,
      ),
  };
}
