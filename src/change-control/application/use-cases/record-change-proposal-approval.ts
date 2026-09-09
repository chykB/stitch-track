import {
  normalizeAgreementResolutionDetails,
  type AgreementResolution,
} from "../../../agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../../agreement/domain/agreement-version";
import type {
  ClientRepository,
} from "../../../client/application/ports/client-repository";
import type {
  GarmentRepository,
} from "../../../garment/application/ports/garment-repository";
import type {
  OrderRepository,
} from "../../../order/application/ports/order-repository";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import {
  calculateAppliedAgreementRevision,
} from "../../domain/applied-change";
import {
  normalizeChangeProposalDecisionDetails,
  type ChangeProposalDecision,
} from "../../domain/change-proposal-decision";
import {
  assertChangeRequestActive,
  deriveChangeRequestState,
} from "../../domain/change-request-lifecycle";
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";

export type RecordChangeProposalApprovalRequest =
  Readonly<{
    garmentId: string;
    changeRequestId: string;
    changeProposalVersionId:
      string;
    occurredAt: Date;
    clientDecisionChannel:
      string | null;
    evidenceNote: string;
  }>;

export type AppliedChangeApproval =
  Readonly<{
    decision:
      ChangeProposalDecision;
    agreementVersion:
      AgreementVersion;
    agreementResolution:
      AgreementResolution;
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

export async function recordChangeProposalApprovalForTenant(
  clientRepository:
    ClientRepository,
  orderRepository:
    OrderRepository,
  garmentRepository:
    GarmentRepository,
  changeControlLifecycleRepository:
    ChangeControlLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    RecordChangeProposalApprovalRequest,
): Promise<AppliedChangeApproval> {
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
            "The change request baseline is no longer approved.",
          );
        }

        const latestProposal =
          await session
            .findLatestProposalForRequest(
              activeRequest.id,
            );

        if (
          !latestProposal ||
          latestProposal.id !==
            request
              .changeProposalVersionId
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Current change proposal was not found for this request.",
          );
        }

        if (
          latestProposal.businessId !==
            tenantContext.businessId ||
          latestProposal.changeRequestId !==
            activeRequest.id ||
          latestProposal.clientId !==
            client.id ||
          latestProposal.orderId !==
            order.id ||
          latestProposal.garmentId !==
            garment.id ||
          latestProposal
            .baselineAgreementVersionId !==
            latestAgreement.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Change proposal was not found for this garment.",
          );
        }

        const existingDecision =
          await session
            .findDecisionForProposal(
              latestProposal.id,
            );

        if (existingDecision) {
          throw new ApplicationError(
            "CONFLICT",
            "Change proposal has already been decided.",
          );
        }

        const closure =
          await session
            .findClosureForRequest(
              activeRequest.id,
            );

        try {
          const state =
            deriveChangeRequestState(
              latestProposal,
              null,
              closure,
            );

          assertChangeRequestActive(
            state,
          );

          if (
            state !==
            "AWAITING_CLIENT"
          ) {
            throw new Error(
              "The change proposal is not awaiting a client decision.",
            );
          }

          const decisionDetails =
            normalizeChangeProposalDecisionDetails({
              outcome:
                "APPROVED",
              occurredAt:
                request.occurredAt,
              clientNameSnapshot:
                client.name,
              decisionSource:
                "BUSINESS_RECORDED",
              clientDecisionChannel:
                request
                  .clientDecisionChannel,
              evidenceNote:
                request.evidenceNote,
              proposalCreatedAt:
                latestProposal.createdAt,
              now:
                new Date(),
            });

          const revision =
            calculateAppliedAgreementRevision(
              latestAgreement,
              baselineResolution.outcome,
              latestProposal,
            );

          const decision =
            await session
              .createChangeProposalDecision({
                businessId:
                  tenantContext.businessId,
                changeProposalVersionId:
                  latestProposal.id,
                recordedByMembershipId:
                  tenantContext.membershipId,
                portalGrantId:
                  null,
                ...decisionDetails,
              });

          const agreementVersion =
            await session
              .createAppliedAgreementVersion({
                businessId:
                  tenantContext.businessId,
                clientId:
                  client.id,
                orderId:
                  order.id,
                garmentId:
                  garment.id,
                revisionNumber:
                  revision.revisionNumber,
                supersedesAgreementVersionId:
                  revision
                    .supersedesAgreementVersionId,
                measurementVersionId:
                  latestProposal
                    .measurementVersionId,
                designSummary:
                  latestProposal
                    .designSummary,
                fabricDescription:
                  latestProposal
                    .fabricDescription,
                quantity:
                  latestProposal.quantity,
                priceAmount:
                  latestProposal
                    .priceAmount,
                currency:
                  latestProposal.currency,
                deliveryDate:
                  latestProposal
                    .deliveryDate,
                note:
                  latestProposal.note,
                styleReferenceIds:
                  latestProposal
                    .styleReferenceIds,
              });

          const appliedAt =
            new Date();

          const agreementResolutionDetails =
            normalizeAgreementResolutionDetails({
              outcome:
                "APPROVED",
              occurredAt:
                appliedAt,
              clientNameSnapshot:
                client.name,
              clientDecisionChannel:
                decision
                  .clientDecisionChannel,
              evidenceNote:
                decision.evidenceNote,
              agreementCreatedAt:
                agreementVersion.createdAt,
              now:
                appliedAt,
            });

          const agreementResolution =
            await session
              .createAppliedAgreementResolution({
                businessId:
                  tenantContext.businessId,
                agreementVersionId:
                  agreementVersion.id,
                recordedByMembershipId:
                  tenantContext.membershipId,
                ...agreementResolutionDetails,
              });

          await session
            .releaseActiveChangeRequest(
              activeRequest.id,
            );

          deriveChangeRequestState(
            latestProposal,
            decision,
            null,
            agreementVersion,
          );

          return {
            decision,
            agreementVersion,
            agreementResolution,
          };
        } catch (error) {
          return toConflict(
            error,
          );
        }
      },
    );
}
