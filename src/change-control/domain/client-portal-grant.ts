export type ClientPortalGrantPurpose =
  | "REQUEST_CHANGE"
  | "DECIDE_CHANGE_PROPOSAL";

export type ClientPortalGrantDetails =
  Readonly<{
    purpose:
      ClientPortalGrantPurpose;
    changeProposalVersionId:
      string | null;
    tokenHash: string;
    expiresAt: Date;
    consumedAt: Date | null;
    revokedAt: Date | null;
  }>;

export type ClientPortalGrant =
  ClientPortalGrantDetails &
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

export type NormalizeClientPortalGrantDetailsInput =
  Readonly<{
    purpose: string;
    changeProposalVersionId?:
      string | null;
    tokenHash: string;
    expiresAt: Date;
    consumedAt?: Date | null;
    revokedAt?: Date | null;
    createdAt: Date;
  }>;

function assertValidDate(
  value: Date,
  fieldName: string,
): void {
  if (
    !(value instanceof Date) ||
    Number.isNaN(
      value.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} must be a valid date.`,
    );
  }
}

function normalizePurpose(
  value: string,
): ClientPortalGrantPurpose {
  if (
    value !== "REQUEST_CHANGE" &&
    value !==
      "DECIDE_CHANGE_PROPOSAL"
  ) {
    throw new Error(
      "client portal grant purpose is invalid.",
    );
  }

  return value;
}

function normalizeProposalId(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeTokenHash(
  value: string,
): string {
  const normalized =
    value.trim();

  if (normalized.length === 0) {
    throw new Error(
      "client portal grant token hash is required.",
    );
  }

  return normalized;
}

export function normalizeClientPortalGrantDetails(
  input:
    NormalizeClientPortalGrantDetailsInput,
): ClientPortalGrantDetails {
  const purpose =
    normalizePurpose(
      input.purpose,
    );

  const changeProposalVersionId =
    normalizeProposalId(
      input.changeProposalVersionId,
    );

  const tokenHash =
    normalizeTokenHash(
      input.tokenHash,
    );

  const consumedAt =
    input.consumedAt ?? null;

  const revokedAt =
    input.revokedAt ?? null;

  assertValidDate(
    input.createdAt,
    "client portal grant createdAt",
  );

  assertValidDate(
    input.expiresAt,
    "client portal grant expiresAt",
  );

  if (
    purpose ===
      "REQUEST_CHANGE" &&
    changeProposalVersionId !==
      null
  ) {
    throw new Error(
      "REQUEST_CHANGE grant cannot target a change proposal.",
    );
  }

  if (
    purpose ===
      "DECIDE_CHANGE_PROPOSAL" &&
    changeProposalVersionId ===
      null
  ) {
    throw new Error(
      "DECIDE_CHANGE_PROPOSAL grant must target a change proposal.",
    );
  }

  if (
    input.expiresAt.getTime() <=
    input.createdAt.getTime()
  ) {
    throw new Error(
      "client portal grant must expire after creation.",
    );
  }

  if (consumedAt) {
    assertValidDate(
      consumedAt,
      "client portal grant consumedAt",
    );

    if (
      consumedAt.getTime() <
        input.createdAt.getTime() ||
      consumedAt.getTime() >
        input.expiresAt.getTime()
    ) {
      throw new Error(
        "client portal grant consumption time is outside its validity window.",
      );
    }
  }

  if (revokedAt) {
    assertValidDate(
      revokedAt,
      "client portal grant revokedAt",
    );

    if (
      revokedAt.getTime() <
      input.createdAt.getTime()
    ) {
      throw new Error(
        "client portal grant cannot be revoked before creation.",
      );
    }
  }

  if (
    consumedAt !== null &&
    revokedAt !== null
  ) {
    throw new Error(
      "client portal grant cannot be both consumed and revoked.",
    );
  }

  return {
    purpose,
    changeProposalVersionId,
    tokenHash,
    expiresAt:
      input.expiresAt,
    consumedAt,
    revokedAt,
  };
}

export function assertClientPortalGrantUsable(
  grant: ClientPortalGrant,
  expectedPurpose:
    ClientPortalGrantPurpose,
  now: Date,
): void {
  assertValidDate(
    now,
    "client portal grant validation time",
  );

  if (
    grant.purpose !==
    expectedPurpose
  ) {
    throw new Error(
      "client portal grant has the wrong purpose.",
    );
  }

  if (
    grant.revokedAt !== null
  ) {
    throw new Error(
      "client portal grant has been revoked.",
    );
  }

  if (
    grant.consumedAt !== null
  ) {
    throw new Error(
      "client portal grant has already been consumed.",
    );
  }

  if (
    now.getTime() >=
    grant.expiresAt.getTime()
  ) {
    throw new Error(
      "client portal grant has expired.",
    );
  }
}
