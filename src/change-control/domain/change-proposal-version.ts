import {
  normalizeAgreementVersionDetails,
  type AgreementVersionDetails,
} from "../../agreement/domain/agreement-version";

export type ChangeProposalVersionDetails =
  AgreementVersionDetails &
    Readonly<{
      rationale: string;
    }>;

export type ChangeProposalVersion =
  ChangeProposalVersionDetails &
    Readonly<{
      id: string;
      businessId: string;
      changeRequestId: string;
      clientId: string;
      orderId: string;
      garmentId: string;
      baselineAgreementVersionId:
        string;
      revisionNumber: number;
      supersedesChangeProposalVersionId:
        string | null;
      createdByMembershipId:
        string;
      createdAt: Date;
    }>;

export type NormalizeChangeProposalVersionDetailsInput =
  Readonly<{
    measurementVersionId?:
      string | null;
    designSummary: string;
    fabricDescription?:
      string | null;
    quantity: number;
    priceAmount: string;
    currency: string;
    baselineCurrency: string;
    deliveryDate: string;
    note?:
      string | null;
    styleReferenceIds:
      readonly string[];
    rationale: string;
  }>;

export type NextChangeProposalRevision =
  Readonly<{
    revisionNumber: number;
    supersedesChangeProposalVersionId:
      string | null;
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

function normalizeBaselineCurrency(
  value: string,
): string {
  const normalized =
    value
      .trim()
      .toUpperCase();

  if (
    !/^[A-Z]{3}$/.test(
      normalized,
    )
  ) {
    throw new Error(
      "Baseline currency is invalid.",
    );
  }

  return normalized;
}

export function normalizeChangeProposalVersionDetails(
  input:
    NormalizeChangeProposalVersionDetailsInput,
): ChangeProposalVersionDetails {
  const agreementDetails =
    normalizeAgreementVersionDetails({
      measurementVersionId:
        input.measurementVersionId,
      designSummary:
        input.designSummary,
      fabricDescription:
        input.fabricDescription,
      quantity:
        input.quantity,
      priceAmount:
        input.priceAmount,
      currency:
        input.currency,
      deliveryDate:
        input.deliveryDate,
      note:
        input.note,
      styleReferenceIds:
        input.styleReferenceIds,
    });

  const baselineCurrency =
    normalizeBaselineCurrency(
      input.baselineCurrency,
    );

  if (
    agreementDetails.currency !==
    baselineCurrency
  ) {
    throw new Error(
      "Change proposal currency must match the approved baseline.",
    );
  }

  return {
    ...agreementDetails,
    rationale:
      normalizeRequiredText(
        input.rationale,
        "Change proposal rationale",
      ),
  };
}

export function calculateNextChangeProposalRevision(
  latestProposal:
    ChangeProposalVersion | null,
  latestDecisionOutcome:
    "APPROVED" |
    "REJECTED" |
    null,
): NextChangeProposalRevision {
  if (!latestProposal) {
    return {
      revisionNumber: 1,
      supersedesChangeProposalVersionId:
        null,
    };
  }

  if (
    latestDecisionOutcome === null
  ) {
    throw new Error(
      "The latest change proposal is still awaiting a client decision.",
    );
  }

  if (
    latestDecisionOutcome ===
    "APPROVED"
  ) {
    throw new Error(
      "An approved change proposal cannot be superseded.",
    );
  }

  if (
    !Number.isSafeInteger(
      latestProposal.revisionNumber,
    ) ||
    latestProposal.revisionNumber < 1
  ) {
    throw new Error(
      "The latest change proposal revision is invalid.",
    );
  }

  return {
    revisionNumber:
      latestProposal.revisionNumber +
      1,
    supersedesChangeProposalVersionId:
      latestProposal.id,
  };
}
