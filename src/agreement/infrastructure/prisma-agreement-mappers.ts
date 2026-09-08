import type {
  AgreementResolution as PrismaAgreementResolution,
  AgreementVersion as PrismaAgreementVersion,
} from "../../generated/prisma/client";
import {
  normalizeAgreementVersionDetails,
  type AgreementVersion,
} from "../domain/agreement-version";
import type {
  AgreementResolution,
} from "../domain/agreement-resolution";

type PersistedAgreementVersion =
  PrismaAgreementVersion &
    Readonly<{
      styleReferences:
        readonly Readonly<{
          styleReferenceId: string;
        }>[];
    }>;

function toCalendarDate(
  value: Date,
): string {
  return value
    .toISOString()
    .slice(0, 10);
}

export const agreementVersionInclude = {
  styleReferences: {
    select: {
      styleReferenceId: true,
    },
    orderBy: {
      styleReferenceId:
        "asc" as const,
    },
  },
};

export function toAgreementVersion(
  record:
    PersistedAgreementVersion,
): AgreementVersion {
  const details =
    normalizeAgreementVersionDetails({
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
    });

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
    revisionNumber:
      record.revisionNumber,
    supersedesAgreementVersionId:
      record
        .supersedesAgreementVersionId,
    createdAt:
      record.createdAt,
    ...details,
  };
}

export function toAgreementResolution(
  record:
    PrismaAgreementResolution,
): AgreementResolution {
  return {
    id:
      record.id,
    businessId:
      record.businessId,
    agreementVersionId:
      record.agreementVersionId,
    outcome:
      record.outcome,
    occurredAt:
      record.occurredAt,
    clientNameSnapshot:
      record.clientNameSnapshot,
    clientDecisionChannel:
      record.clientDecisionChannel,
    evidenceNote:
      record.evidenceNote,
    recordedByMembershipId:
      record.recordedByMembershipId,
    createdAt:
      record.createdAt,
  };
}

export function toDatabaseDate(
  value: string,
): Date {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
}
