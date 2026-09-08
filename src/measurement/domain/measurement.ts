export type MeasurementUnit =
  | "CENTIMETER"
  | "INCH";

export type MeasurementEntryDetails =
  Readonly<{
    label: string;
    normalizedKey: string;
    value: string;
  }>;

export type MeasurementVersionDetails =
  Readonly<{
    measuredAt: Date;
    unit: MeasurementUnit;
    note: string | null;
    entries:
      readonly MeasurementEntryDetails[];
  }>;

export type MeasurementEntry =
  MeasurementEntryDetails &
    Readonly<{
      id: string;
      businessId: string;
      measurementVersionId: string;
      createdAt: Date;
    }>;

export type MeasurementVersion =
  Readonly<{
    id: string;
    businessId: string;
    clientId: string;
    measuredAt: Date;
    unit: MeasurementUnit;
    note: string | null;
    entries: readonly MeasurementEntry[];
    createdAt: Date;
  }>;

export type NormalizeMeasurementEntryInput =
  Readonly<{
    label: string;
    value: string;
  }>;

export type NormalizeMeasurementVersionDetailsInput =
  Readonly<{
    measuredAt: Date;
    unit: string;
    note?: string | null;
    entries:
      readonly NormalizeMeasurementEntryInput[];
  }>;

function normalizeMeasurementLabel(
  input: string,
): string {
  const label =
    input.trim().replace(/\s+/g, " ");

  if (!label) {
    throw new Error(
      "Measurement label is required.",
    );
  }

  return label;
}

function createNormalizedKey(
  label: string,
): string {
  return label.toLowerCase();
}

export function normalizeMeasurementValue(
  input: string,
): string {
  const value = input.trim();

  if (
    !/^\d+(?:\.\d+)?$/.test(value)
  ) {
    throw new Error(
      "Measurement value must be a positive decimal.",
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
    normalizedWhole.length > 35 ||
    (normalizedFraction?.length ?? 0) > 30
  ) {
    throw new Error(
      "Measurement value exceeds supported precision.",
    );
  }

  const normalizedValue =
    normalizedFraction
      ? `${normalizedWhole}.${normalizedFraction}`
      : normalizedWhole;

  if (normalizedValue === "0") {
    throw new Error(
      "Measurement value must be greater than zero.",
    );
  }

  return normalizedValue;
}

export function normalizeMeasurementEntry(
  input: NormalizeMeasurementEntryInput,
): MeasurementEntryDetails {
  const label =
    normalizeMeasurementLabel(
      input.label,
    );

  return {
    label,
    normalizedKey:
      createNormalizedKey(label),
    value:
      normalizeMeasurementValue(
        input.value,
      ),
  };
}

function normalizeMeasurementUnit(
  input: string,
): MeasurementUnit {
  if (
    input !== "CENTIMETER" &&
    input !== "INCH"
  ) {
    throw new Error(
      "Measurement unit is invalid.",
    );
  }

  return input;
}

export function normalizeMeasurementVersionDetails(
  input: NormalizeMeasurementVersionDetailsInput,
): MeasurementVersionDetails {
  if (
    Number.isNaN(
      input.measuredAt.getTime(),
    )
  ) {
    throw new Error(
      "Measurement date is invalid.",
    );
  }

  if (input.entries.length === 0) {
    throw new Error(
      "At least one measurement is required.",
    );
  }

  const entries =
    input.entries.map(
      normalizeMeasurementEntry,
    );

  const normalizedKeys =
    new Set<string>();

  for (const entry of entries) {
    if (
      normalizedKeys.has(
        entry.normalizedKey,
      )
    ) {
      throw new Error(
        "Measurement labels must be unique within a version.",
      );
    }

    normalizedKeys.add(
      entry.normalizedKey,
    );
  }

  return {
    measuredAt:
      new Date(
        input.measuredAt.getTime(),
      ),
    unit:
      normalizeMeasurementUnit(
        input.unit,
      ),
    note:
      input.note?.trim() || null,
    entries,
  };
}
