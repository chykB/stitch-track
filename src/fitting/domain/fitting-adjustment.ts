export type FittingAdjustment =
  Readonly<{
    id: string;
    businessId: string;
    clientId: string;
    orderId: string;
    garmentId: string;
    fittingSessionId: string;
    description: string;
    recordedByMembershipId:
      string;
    createdAt: Date;
  }>;

export type FittingAdjustmentResolutionOutcome =
  | "COMPLETED"
  | "VOIDED";

export type FittingAdjustmentResolutionDetails =
  Readonly<{
    outcome:
      FittingAdjustmentResolutionOutcome;
    occurredAt: Date;
    note: string | null;
    reason: string | null;
  }>;

export type FittingAdjustmentResolution =
  FittingAdjustmentResolutionDetails &
    Readonly<{
      id: string;
      businessId: string;
      fittingAdjustmentId: string;
      recordedByMembershipId:
        string;
      createdAt: Date;
    }>;

export type NormalizeFittingAdjustmentResolutionDetailsInput =
  Readonly<{
    outcome: string;
    occurredAt: Date;
    note?: string | null;
    reason?: string | null;
    now: Date;
  }>;

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

export function normalizeFittingAdjustmentDescription(
  value: string,
): string {
  const normalized =
    normalizeOptionalText(value);

  if (!normalized) {
    throw new Error(
      "Fitting adjustment description is required.",
    );
  }

  return normalized;
}

function normalizeResolutionOutcome(
  value: string,
): FittingAdjustmentResolutionOutcome {
  if (
    value !== "COMPLETED" &&
    value !== "VOIDED"
  ) {
    throw new Error(
      "Fitting adjustment resolution outcome is invalid.",
    );
  }

  return value;
}

export function normalizeFittingAdjustmentResolutionDetails(
  input:
    NormalizeFittingAdjustmentResolutionDetailsInput,
): FittingAdjustmentResolutionDetails {
  const outcome =
    normalizeResolutionOutcome(
      input.outcome,
    );

  requireValidDate(
    input.occurredAt,
    "Adjustment resolution time",
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
      "Adjustment resolution time cannot be in the future.",
    );
  }

  const note =
    normalizeOptionalText(
      input.note,
    );

  const reason =
    normalizeOptionalText(
      input.reason,
    );

  if (outcome === "COMPLETED") {
    if (reason) {
      throw new Error(
        "Completed adjustment cannot contain a void reason.",
      );
    }

    return {
      outcome,
      occurredAt:
        new Date(
          input.occurredAt.getTime(),
        ),
      note,
      reason: null,
    };
  }

  if (!reason) {
    throw new Error(
      "Voided adjustment reason is required.",
    );
  }

  return {
    outcome,
    occurredAt:
      new Date(
        input.occurredAt.getTime(),
      ),
    note: null,
    reason,
  };
}
