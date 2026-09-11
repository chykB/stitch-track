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
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";
import type {
  ClientPortalTokenService,
} from "../ports/client-portal-token-service";

export type IssueRequestChangePortalGrantRequest =
  Readonly<{
    garmentId: string;
    expiresAt: Date;
  }>;

export type IssuedRequestChangePortalGrant =
  Readonly<{
    clientPortalGrantId: string;
    rawToken: string;
    purpose:
      "REQUEST_CHANGE";
    changeProposalVersionId:
      null;
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

export async function issueRequestChangePortalGrantForTenant(
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
    IssueRequestChangePortalGrantRequest,
): Promise<IssuedRequestChangePortalGrant> {
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
        const latestAgreement =
          await session
            .findLatestAgreementVersion();

        if (!latestAgreement) {
          throw new ApplicationError(
            "CONFLICT",
            "An approved agreement is required before issuing a change-request portal link.",
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
            "The current agreement must be approved before issuing a change-request portal link.",
          );
        }

        const activeRequest =
          await session
            .findActiveChangeRequest();

        if (activeRequest) {
          throw new ApplicationError(
            "CONFLICT",
            "A change request is already active for this garment.",
          );
        }

        const issuedAt =
          new Date();

        const tokenMaterial =
          clientPortalTokenService
            .issueToken();

        let details;

        try {
          details =
            normalizeClientPortalGrantDetails({
              purpose:
                "REQUEST_CHANGE",
              changeProposalVersionId:
                null,
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
        } catch (error) {
          return toConflict(
            error,
          );
        }

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
                details
                  .changeProposalVersionId,
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
            "REQUEST_CHANGE",
          changeProposalVersionId:
            null,
          expiresAt:
            grant.expiresAt,
          createdAt:
            grant.createdAt,
        };
      },
    );
}
