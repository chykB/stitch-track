import type {
  ChangeProposalDecision as PrismaChangeProposalDecision,
  ChangeProposalVersion as PrismaChangeProposalVersion,
  ChangeRequest as PrismaChangeRequest,
  ChangeRequestClosure as PrismaChangeRequestClosure,
} from "../../generated/prisma/client";
import type {
  ChangeProposalDecision,
} from "../domain/change-proposal-decision";
import {
  normalizeChangeProposalVersionDetails,
  type ChangeProposalVersion,
} from "../domain/change-proposal-version";
import type {
  ChangeRequest,
} from "../domain/change-request";
import type {
  ChangeRequestClosure,
} from "../domain/change-request-lifecycle";

type PersistedChangeProposalVersion =
  PrismaChangeProposalVersion &
    Readonly<{
      styleReferences:
        readonly Readonly<{
          styleReferenceId: string;
        }>[];
      baselineAgreementVersion:
        Readonly<{
          currency: string;
        }>;
    }>;

function toCalendarDate(
  value: Date,
): string {
  return value
    .toISOString()
    .slice(0, 10);
}

export const changeProposalVersionInclude = {
  styleReferences: {
    select: {
      styleReferenceId: true,
    },
    orderBy: {
      styleReferenceId:
        "asc" as const,
    },
  },
  baselineAgreementVersion: {
    select: {
      currency: true,
    },
  },
};

export function toChangeRequest(
  record:
    PrismaChangeRequest,
): ChangeRequest {
  return {
    id:
      record.id,
    businessId:
      record.businessId,
    clientId:
      record.clientId,
    orderId:
      record.orderId,
    garmentId:
      record.garmentId,
    baselineAgreementVersionId:
      record
        .baselineAgreementVersionId,
    requestedBy:
      record.requestedBy,
    origin:
      record.origin,
    requestChannel:
      record.requestChannel,
    description:
      record.description,
    requestedAt:
      record.requestedAt,
    recordedByMembershipId:
      record
        .recordedByMembershipId,
    createdAt:
      record.createdAt,
  };
}

export function toChangeProposalVersion(
  record:
    PersistedChangeProposalVersion,
): ChangeProposalVersion {
  const details =
    normalizeChangeProposalVersionDetails({
      measurementVersionId:
        record.measurementVersionId,
      designSummary:
        record.designSummary,
      fabricDescription:
        record.fabricDescription,
      quantity:
        record.quantity,
      priceAmount:
        record.priceAmount.toString(),
      currency:
        record.currency,
      baselineCurrency:
        record
          .baselineAgreementVersion
          .currency,
      deliveryDate:
        toCalendarDate(
          record.deliveryDate,
        ),
      note:
        record.note,
      styleReferenceIds:
        record.styleReferences.map(
          (reference) =>
            reference.styleReferenceId,
        ),
      rationale:
        record.rationale,
    });

  return {
    id:
      record.id,
    businessId:
      record.businessId,
    changeRequestId:
      record.changeRequestId,
    clientId:
      record.clientId,
    orderId:
      record.orderId,
    garmentId:
      record.garmentId,
    baselineAgreementVersionId:
      record
        .baselineAgreementVersionId,
    revisionNumber:
      record.revisionNumber,
    supersedesChangeProposalVersionId:
      record
        .supersedesChangeProposalVersionId,
    createdByMembershipId:
      record
        .createdByMembershipId,
    createdAt:
      record.createdAt,
    ...details,
  };
}

export function toChangeProposalDecision(
  record:
    PrismaChangeProposalDecision,
): ChangeProposalDecision {
  return {
    id:
      record.id,
    businessId:
      record.businessId,
    changeProposalVersionId:
      record
        .changeProposalVersionId,
    outcome:
      record.outcome,
    occurredAt:
      record.occurredAt,
    clientNameSnapshot:
      record.clientNameSnapshot,
    decisionSource:
      record.decisionSource,
    clientDecisionChannel:
      record.clientDecisionChannel,
    evidenceNote:
      record.evidenceNote,
    recordedByMembershipId:
      record
        .recordedByMembershipId,
    portalGrantId:
      record.portalGrantId,
    createdAt:
      record.createdAt,
  };
}

export function toChangeRequestClosure(
  record:
    PrismaChangeRequestClosure,
): ChangeRequestClosure {
  return {
    id:
      record.id,
    businessId:
      record.businessId,
    changeRequestId:
      record.changeRequestId,
    outcome:
      record.outcome,
    reason:
      record.reason,
    occurredAt:
      record.occurredAt,
    recordedByMembershipId:
      record
        .recordedByMembershipId,
    createdAt:
      record.createdAt,
  };
}
