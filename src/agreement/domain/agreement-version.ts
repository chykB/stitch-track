import type {
  AgreementResolutionOutcome,
} from "./agreement-resolution";

export type AgreementVersionDetails =
  Readonly<{
    designSummary: string;
    fabricDescription: string | null;
    quantity: number;
    priceAmount: string;
    currency: string;
    deliveryDate: string;
    note: string | null;
    measurementVersionId:
      string | null;
    styleReferenceIds:
      readonly string[];
  }>;

export type AgreementVersion =
  AgreementVersionDetails &
    Readonly<{
      id: string;
      businessId: string;
      clientId: string;
      orderId: string;
      garmentId: string;
      revisionNumber: number;
      supersedesAgreementVersionId:
        string | null;
      createdAt: Date;
    }>;

export type NormalizeAgreementVersionDetailsInput =
  Readonly<{
    designSummary: string;
    fabricDescription?: string | null;
    quantity: number;
    priceAmount: string;
    currency: string;
    deliveryDate: string;
    note?: string | null;
    measurementVersionId?:
      string | null;
    styleReferenceIds?:
      readonly string[];
  }>;

function normalizeRequiredText(
  input: string,
  fieldName: string,
): string {
  const value =
    input.trim().replace(/\s+/g, " ");

  if (!value) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return value;
}

function normalizeOptionalText(
  input?: string | null,
): string | null {
  return input?.trim() || null;
}

export function normalizeAgreementPriceAmount(
  input: string,
): string {
  const value =
    input.trim();

  if (
    !/^\d+(?:\.\d+)?$/.test(
      value,
    )
  ) {
    throw new Error(
      "Agreement price must be a positive decimal.",
    );
  }

  const [
    wholePart,
    fractionalPart,
  ] = value.split(".");

  const normalizedWhole =
    wholePart.replace(
      /^0+(?=\d)/,
      "",
    );

  const normalizedFraction =
    fractionalPart?.replace(
      /0+$/,
      "",
    );

  if (
    normalizedWhole.length > 15 ||
    (normalizedFraction?.length ?? 0) >
      4
  ) {
    throw new Error(
      "Agreement price exceeds supported precision.",
    );
  }

  const normalizedValue =
    normalizedFraction
      ? `${normalizedWhole}.${normalizedFraction}`
      : normalizedWhole;

  if (
    normalizedValue === "0"
  ) {
    throw new Error(
      "Agreement price must be greater than zero.",
    );
  }

  return normalizedValue;
}

function normalizeCurrency(
  input: string,
): string {
  const currency =
    input.trim().toUpperCase();

  if (
    !/^[A-Z]{3}$/.test(
      currency,
    )
  ) {
    throw new Error(
      "Agreement currency must use a three-letter uppercase code.",
    );
  }

  return currency;
}

export function normalizeAgreementDeliveryDate(
  input: string,
): string {
  const value =
    input.trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "Agreement delivery date is invalid.",
    );
  }

  const parsedDate =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  if (
    Number.isNaN(
      parsedDate.getTime(),
    ) ||
    parsedDate
      .toISOString()
      .slice(0, 10) !== value
  ) {
    throw new Error(
      "Agreement delivery date is invalid.",
    );
  }

  return value;
}

function normalizeStyleReferenceIds(
  input:
    readonly string[] = [],
): readonly string[] {
  const ids =
    input.map(
      (id) =>
        id.trim(),
    );

  if (
    ids.some(
      (id) => !id,
    )
  ) {
    throw new Error(
      "Style reference identifier is required.",
    );
  }

  const uniqueIds =
    new Set(ids);

  if (
    uniqueIds.size !==
    ids.length
  ) {
    throw new Error(
      "Style references must be unique within an agreement version.",
    );
  }

  return ids;
}

export function normalizeAgreementVersionDetails(
  input:
    NormalizeAgreementVersionDetailsInput,
): AgreementVersionDetails {
  if (
    !Number.isSafeInteger(
      input.quantity,
    ) ||
    input.quantity <= 0
  ) {
    throw new Error(
      "Agreement quantity must be a positive integer.",
    );
  }

  return {
    designSummary:
      normalizeRequiredText(
        input.designSummary,
        "Agreement design summary",
      ),
    fabricDescription:
      normalizeOptionalText(
        input.fabricDescription,
      ),
    quantity:
      input.quantity,
    priceAmount:
      normalizeAgreementPriceAmount(
        input.priceAmount,
      ),
    currency:
      normalizeCurrency(
        input.currency,
      ),
    deliveryDate:
      normalizeAgreementDeliveryDate(
        input.deliveryDate,
      ),
    note:
      normalizeOptionalText(
        input.note,
      ),
    measurementVersionId:
      input.measurementVersionId
        ?.trim() || null,
    styleReferenceIds:
      normalizeStyleReferenceIds(
        input.styleReferenceIds,
      ),
  };
}

export function calculateNextAgreementRevision(
  latestVersion:
    AgreementVersion | null,
  latestOutcome:
    AgreementResolutionOutcome | null,
): Readonly<{
  revisionNumber: number;
  supersedesAgreementVersionId:
    string | null;
}> {
  if (!latestVersion) {
    return {
      revisionNumber: 1,
      supersedesAgreementVersionId:
        null,
    };
  }

  if (!latestOutcome) {
    throw new Error(
      "A pending agreement version must be resolved before another revision can be created.",
    );
  }

  if (
    latestOutcome === "APPROVED"
  ) {
    throw new Error(
      "An approved agreement cannot be superseded by the initial agreement workflow.",
    );
  }

  if (
    latestOutcome !== "REJECTED" &&
    latestOutcome !== "WITHDRAWN"
  ) {
    throw new Error(
      "Agreement resolution outcome is invalid.",
    );
  }

  return {
    revisionNumber:
      latestVersion.revisionNumber +
      1,
    supersedesAgreementVersionId:
      latestVersion.id,
  };
}
