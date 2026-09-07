export type StyleReferenceDetails =
  Readonly<{
    sourceUrl: string;
    label: string | null;
    note: string | null;
  }>;

export type StyleReference =
  StyleReferenceDetails &
    Readonly<{
      id: string;
      businessId: string;
      garmentId: string;
      createdAt: Date;
    }>;

export type NormalizeStyleReferenceDetailsInput =
  Readonly<{
    sourceUrl: string;
    label?: string | null;
    note?: string | null;
  }>;

function normalizeOptionalText(
  input?: string | null,
): string | null {
  return input?.trim() || null;
}

function normalizeSourceUrl(
  input: string,
): string {
  const sourceUrl = input.trim();

  if (!sourceUrl) {
    throw new Error(
      "Style reference URL is required.",
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error(
      "Style reference URL is invalid.",
    );
  }

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      "Style reference URL must use HTTP or HTTPS.",
    );
  }

  return sourceUrl;
}

export function normalizeStyleReferenceDetails(
  input: NormalizeStyleReferenceDetailsInput,
): StyleReferenceDetails {
  return {
    sourceUrl:
      normalizeSourceUrl(
        input.sourceUrl,
      ),
    label:
      normalizeOptionalText(
        input.label,
      ),
    note:
      normalizeOptionalText(
        input.note,
      ),
  };
}
