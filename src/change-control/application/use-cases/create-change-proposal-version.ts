import {
  normalizeAgreementVersionDetails,
} from "../../../agreement/domain/agreement-version";
import type {
  ClientRepository,
} from "../../../client/application/ports/client-repository";
import type {
  GarmentRepository,
} from "../../../garment/application/ports/garment-repository";
import type {
  MeasurementVersionRepository,
} from "../../../measurement/application/ports/measurement-version-repository";
import type {
  OrderRepository,
} from "../../../order/application/ports/order-repository";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  StyleReferenceRepository,
} from "../../../style-reference/application/ports/style-reference-repository";
import {
  calculateNextChangeProposalRevision,
  normalizeChangeProposalVersionDetails,
  type ChangeProposalVersion,
} from "../../domain/change-proposal-version";
import {
  assertChangeRequestActive,
  deriveChangeRequestState,
} from "../../domain/change-request-lifecycle";
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";

export type CreateChangeProposalVersionRequest =
  Readonly<{
    garmentId: string;
    changeRequestId: string;
    measurementVersionId?:
      string | null;
    designSummary: string;
    fabricDescription?:
      string | null;
    quantity: number;
    priceAmount: string;
    currency: string;
    deliveryDate: string;
    note?:
      string | null;
    styleReferenceIds:
      readonly string[];
    rationale: string;
  }>;

function toConflict(
  error: unknown,
): never {
  if (
    error instanceof Error
  ) {
    throw new ApplicationError(
      "CONFLICT",
      error.message,
    );
  }

  throw error;
}

export async function createChangeProposalVersionForTenant(
  clientRepository:
    ClientRepository,
  orderRepository:
    OrderRepository,
  garmentRepository:
    GarmentRepository,
  measurementVersionRepository:
    MeasurementVersionRepository,
  styleReferenceRepository:
    StyleReferenceRepository,
  changeControlLifecycleRepository:
    ChangeControlLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    CreateChangeProposalVersionRequest,
): Promise<ChangeProposalVersion> {
  let candidateTerms;

  try {
    candidateTerms =
      normalizeAgreementVersionDetails({
        measurementVersionId:
          request.measurementVersionId,
        designSummary:
          request.designSummary,
        fabricDescription:
          request.fabricDescription,
        quantity:
          request.quantity,
        priceAmount:
          request.priceAmount,
        currency:
          request.currency,
        deliveryDate:
          request.deliveryDate,
        note:
          request.note,
        styleReferenceIds:
          request.styleReferenceIds,
      });
  } catch (error) {
    return toConflict(
      error,
    );
  }

  const garment =
    await garmentRepository.findById({
      businessId:
        tenantContext.businessId,
      garmentId:
        request.garmentId,
    });

  if (!garment) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Garment was not found in the current business.",
    );
  }

  const order =
    await orderRepository.findById({
      businessId:
        tenantContext.businessId,
      orderId:
        garment.orderId,
    });

  if (!order) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Order was not found in the current business.",
    );
  }

  const client =
    await clientRepository.findById({
      businessId:
        tenantContext.businessId,
      clientId:
        order.clientId,
    });

  if (!client) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Client was not found in the current business.",
    );
  }

  if (
    candidateTerms.measurementVersionId
  ) {
    const measurementVersion =
      await measurementVersionRepository
        .findById({
          businessId:
            tenantContext.businessId,
          measurementVersionId:
            candidateTerms
              .measurementVersionId,
        });

    if (
      !measurementVersion ||
      measurementVersion.clientId !==
        client.id
    ) {
      throw new ApplicationError(
        "NOT_FOUND",
        "Measurement version was not found for this client.",
      );
    }
  }

  for (
    const styleReferenceId
    of candidateTerms.styleReferenceIds
  ) {
    const styleReference =
      await styleReferenceRepository
        .findById({
          businessId:
            tenantContext.businessId,
          styleReferenceId,
        });

    if (
      !styleReference ||
      styleReference.garmentId !==
        garment.id
    ) {
      throw new ApplicationError(
        "NOT_FOUND",
        "Style reference was not found for this garment.",
      );
    }
  }

  return changeControlLifecycleRepository
    .withGarmentLifecycle(
      {
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      },
      async (session) => {
        const activeRequest =
          await session
            .findActiveChangeRequest();

        if (
          !activeRequest ||
          activeRequest.id !==
            request.changeRequestId
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Active change request was not found for this garment.",
          );
        }

        if (
          activeRequest.businessId !==
            tenantContext.businessId ||
          activeRequest.clientId !==
            client.id ||
          activeRequest.orderId !==
            order.id ||
          activeRequest.garmentId !==
            garment.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Change request was not found for this garment.",
          );
        }

        const latestAgreement =
          await session
            .findLatestAgreementVersion();

        if (
          !latestAgreement ||
          latestAgreement.id !==
            activeRequest
              .baselineAgreementVersionId
        ) {
          throw new ApplicationError(
            "CONFLICT",
            "The approved baseline for this change request is no longer current.",
          );
        }

        if (
          latestAgreement.businessId !==
            tenantContext.businessId ||
          latestAgreement.clientId !==
            client.id ||
          latestAgreement.orderId !==
            order.id ||
          latestAgreement.garmentId !==
            garment.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Current agreement was not found for this garment.",
          );
        }

        const baselineResolution =
          await session
            .findAgreementResolutionForVersion(
              latestAgreement.id,
            );

        if (
          !baselineResolution ||
          baselineResolution.outcome !==
            "APPROVED"
        ) {
          throw new ApplicationError(
            "CONFLICT",
            "The change request baseline is no longer an approved agreement.",
          );
        }

        const latestProposal =
          await session
            .findLatestProposalForRequest(
              activeRequest.id,
            );

        const latestDecision =
          latestProposal
            ? await session
                .findDecisionForProposal(
                  latestProposal.id,
                )
            : null;

        const closure =
          await session
            .findClosureForRequest(
              activeRequest.id,
            );

        try {
          const state =
            deriveChangeRequestState(
              latestProposal,
              latestDecision,
              closure,
            );

          assertChangeRequestActive(
            state,
          );

          const revision =
            calculateNextChangeProposalRevision(
              latestProposal,
              latestDecision
                ?.outcome ??
                null,
            );

          const details =
            normalizeChangeProposalVersionDetails({
              ...candidateTerms,
              baselineCurrency:
                latestAgreement.currency,
              rationale:
                request.rationale,
            });

          return session
            .createChangeProposalVersion({
              businessId:
                tenantContext.businessId,
              changeRequestId:
                activeRequest.id,
              clientId:
                client.id,
              orderId:
                order.id,
              garmentId:
                garment.id,
              baselineAgreementVersionId:
                latestAgreement.id,
              revisionNumber:
                revision.revisionNumber,
              supersedesChangeProposalVersionId:
                revision
                  .supersedesChangeProposalVersionId,
              createdByMembershipId:
                tenantContext.membershipId,
              ...details,
            });
        } catch (error) {
          return toConflict(
            error,
          );
        }
      },
    );
}
