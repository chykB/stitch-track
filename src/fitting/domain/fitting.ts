export type FittingOutcomeType =
  | "COMPLETED"
  | "CANCELLED";

export type FittingSessionDetails =
  Readonly<{
    scheduledFor: Date | null;
    note: string | null;
  }>;

export type FittingSession =
  FittingSessionDetails &
    Readonly<{
      id: string;
      businessId: string;
      clientId: string;
      orderId: string;
      garmentId: string;
      createdByMembershipId:
        string;
      createdAt: Date;
    }>;

export type FittingOutcomeDetails =
  Readonly<{
    outcome: FittingOutcomeType;
    occurredAt: Date;
    baselineAgreementVersionId:
      string | null;
    resultingMeasurementVersionId:
      string | null;
    observationSummary:
      string | null;
    cancellationReason:
      string | null;
  }>;

export type FittingOutcome =
  FittingOutcomeDetails &
    Readonly<{
      id: string;
      businessId: string;
      fittingSessionId: string;
      recordedByMembershipId:
        string;
      createdAt: Date;
    }>;

export type NormalizeScheduledFittingSessionDetailsInput =
  Readonly<{
    scheduledFor: Date;
    note?: string | null;
    now: Date;
  }>;

export type NormalizeDirectCompletedFittingSessionDetailsInput =
  Readonly<{
    note?: string | null;
  }>;

export type NormalizeFittingOutcomeDetailsInput =
  Readonly<{
    outcome: string;
    occurredAt: Date;
    baselineAgreementVersionId?:
      string | null;
    resultingMeasurementVersionId?:
      string | null;
    observationSummary?:
      string | null;
    cancellationReason?:
      string | null;
    now: Date;
  }>;

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

function normalizeOptionalText(
  value?: string | null,
): string | null {
  return (
    value
      ?.trim()
      .replace(/\s+/g, " ") ||
    null
  );
}

function normalizeOptionalId(
  value?: string | null,
): string | null {
  return value?.trim() || null;
}

function normalizeOutcome(
  value: string,
): FittingOutcomeType {
  if (
    value !== "COMPLETED" &&
    value !== "CANCELLED"
  ) {
    throw new Error(
      "Fitting outcome is invalid.",
    );
  }

  return value;
}

export function normalizeScheduledFittingSessionDetails(
  input:
    NormalizeScheduledFittingSessionDetailsInput,
): FittingSessionDetails {
  requireValidDate(
    input.scheduledFor,
    "Fitting schedule",
  );

  requireValidDate(
    input.now,
    "Current time",
  );

  if (
    input.scheduledFor.getTime() <=
    input.now.getTime()
  ) {
    throw new Error(
      "A scheduled fitting must be in the future.",
    );
  }

  return {
    scheduledFor:
      new Date(
        input.scheduledFor.getTime(),
      ),
    note:
      normalizeOptionalText(
        input.note,
      ),
  };
}

export function normalizeDirectCompletedFittingSessionDetails(
  input:
    NormalizeDirectCompletedFittingSessionDetailsInput,
): FittingSessionDetails {
  return {
    scheduledFor: null,
    note:
      normalizeOptionalText(
        input.note,
      ),
  };
}

export function normalizeFittingOutcomeDetails(
  input:
    NormalizeFittingOutcomeDetailsInput,
): FittingOutcomeDetails {
  const outcome =
    normalizeOutcome(
      input.outcome,
    );

  requireValidDate(
    input.occurredAt,
    "Fitting occurrence time",
  );

  requireValidDate(
    input.now,
    "Current time",
  );

  if (
    input.occurredAt.getTime() >
    input.now.getTime()
  ) {
    throw new Error(
      "Fitting occurrence time cannot be in the future.",
    );
  }

  const baselineAgreementVersionId =
    normalizeOptionalId(
      input.baselineAgreementVersionId,
    );

  const resultingMeasurementVersionId =
    normalizeOptionalId(
      input.resultingMeasurementVersionId,
    );

  const observationSummary =
    normalizeOptionalText(
      input.observationSummary,
    );

  const cancellationReason =
    normalizeOptionalText(
      input.cancellationReason,
    );

  if (outcome === "COMPLETED") {
    if (!baselineAgreementVersionId) {
      throw new Error(
        "Completed fitting requires an approved agreement baseline.",
      );
    }

    if (!observationSummary) {
      throw new Error(
        "Completed fitting observation summary is required.",
      );
    }

    if (cancellationReason) {
      throw new Error(
        "Completed fitting cannot contain a cancellation reason.",
      );
    }
  } else {
    if (
      baselineAgreementVersionId ||
      resultingMeasurementVersionId ||
      observationSummary
    ) {
      throw new Error(
        "Cancelled fitting cannot contain completion evidence.",
      );
    }

    if (!cancellationReason) {
      throw new Error(
        "Cancelled fitting reason is required.",
      );
    }
  }

  return {
    outcome,
    occurredAt:
      new Date(
        input.occurredAt.getTime(),
      ),
    baselineAgreementVersionId,
    resultingMeasurementVersionId,
    observationSummary,
    cancellationReason,
  };
}
