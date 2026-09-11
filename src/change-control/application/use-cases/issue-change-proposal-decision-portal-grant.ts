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
  normalizeClientPortalGrantDetails,
} from "../../domain/client-portal-grant";
import {
  assertChangeRequestActive,
  deriveChangeRequestState,
} from "../../domain/change-request-lifecycle";
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";
import type {
  ClientPortalTokenService,
} from "../ports/client-portal-token-service";

export type IssueChangeProposalDecisionPortalGrantRequest =
  Readonly<{
    garmentId: string;
    changeRequestId: string;
    changeProposalVersionId:
      string;
    expiresAt: Date;
  }>;

export type IssuedChangeProposalDecisionPortalGrant =
  Readonly<{
    clientPortalGrantId: string;
    rawToken: string;
    purpose:
      "DECIDE_CHANGE_PROPOSAL";
    changeProposalVersionId:
      string;
    expiresAt: Date;
    createdAt: Date;
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

export async function issueChangeProposalDecisionPortalGrantForTenant(
  clientRepository:
    ClientRepository,
  orderRepository:
    OrderRepository,
  garmentRepository:
    GarmentRepository,
  changeControlLifecycleRepository:
    ChangeControlLifecycleRepository,
  clientPortalTokenService:
    ClientPortalTokenService,
  tenantContext:
    TenantContext,
  request:
    IssueChangeProposalDecisionPortalGrantRequest,
): Promise<IssuedChangeProposalDecisionPortalGrant> {
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

          const issuedAt =
            new Date();

          const tokenMaterial =
            clientPortalTokenService
              .issueToken();

          const details =
            normalizeClientPortalGrantDetails({
              purpose:
                "DECIDE_CHANGE_PROPOSAL",
              changeProposalVersionId:
                latestProposal.id,
              tokenHash:
                tokenMaterial.tokenHash,
              expiresAt:
                request.expiresAt,
              consumedAt:
                null,
              revokedAt:
                null,
              createdAt:
                issuedAt,
            });

          const grant =
            await session
              .createClientPortalGrant({
                businessId:
                  tenantContext.businessId,
                clientId:
                  client.id,
                orderId:
                  order.id,
                garmentId:
                  garment.id,
                changeProposalVersionId:
                  latestProposal.id,
                purpose:
                  details.purpose,
                tokenHash:
                  details.tokenHash,
                expiresAt:
                  details.expiresAt,
                createdByMembershipId:
                  tenantContext.membershipId,
                createdAt:
                  issuedAt,
              });

          return {
            clientPortalGrantId:
              grant.id,
            rawToken:
              tokenMaterial.rawToken,
            purpose:
              "DECIDE_CHANGE_PROPOSAL",
            changeProposalVersionId:
              latestProposal.id,
            expiresAt:
              grant.expiresAt,
            createdAt:
              grant.createdAt,
          };
        } catch (error) {
          return toConflict(
            error,
          );
        }
      },
    );
}
