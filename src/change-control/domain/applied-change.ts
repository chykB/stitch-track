import type {
  AgreementResolutionOutcome,
} from "../../agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../agreement/domain/agreement-version";
import type {
  ChangeProposalVersion,
} from "./change-proposal-version";

export type AppliedAgreementRevision =
  Readonly<{
    revisionNumber: number;
    supersedesAgreementVersionId:
      string;
  }>;

export function calculateAppliedAgreementRevision(
  latestAgreement:
    AgreementVersion,
  latestResolutionOutcome:
    AgreementResolutionOutcome | null,
  approvedProposal:
    ChangeProposalVersion,
): AppliedAgreementRevision {
  if (
    latestResolutionOutcome !==
    "APPROVED"
  ) {
    throw new Error(
      "Only an approved agreement can be amended through change control.",
    );
  }

  if (
    approvedProposal
      .baselineAgreementVersionId !==
      latestAgreement.id
  ) {
    throw new Error(
      "The approved proposal does not belong to the current agreement baseline.",
    );
  }

  if (
    approvedProposal.businessId !==
      latestAgreement.businessId ||
    approvedProposal.clientId !==
      latestAgreement.clientId ||
    approvedProposal.orderId !==
      latestAgreement.orderId ||
    approvedProposal.garmentId !==
      latestAgreement.garmentId
  ) {
    throw new Error(
      "The approved proposal does not match the current agreement ownership chain.",
    );
  }

  if (
    !Number.isSafeInteger(
      latestAgreement.revisionNumber,
    ) ||
    latestAgreement.revisionNumber < 1
  ) {
    throw new Error(
      "The current agreement revision is invalid.",
    );
  }

  if (
    latestAgreement.revisionNumber ===
    Number.MAX_SAFE_INTEGER
  ) {
    throw new Error(
      "The next agreement revision cannot be represented safely.",
    );
  }

  return {
    revisionNumber:
      latestAgreement.revisionNumber +
      1,
    supersedesAgreementVersionId:
      latestAgreement.id,
  };
}
