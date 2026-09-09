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
  normalizeChangeRequestDetails,
  type ChangeRequest,
} from "../../domain/change-request";
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";

export type CreateChangeRequestRequest =
  Readonly<{
    garmentId: string;
    requestedBy: string;
    requestChannel?:
      string | null;
    description: string;
    requestedAt: Date;
  }>;

export async function createChangeRequestForTenant(
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
    CreateChangeRequestRequest,
): Promise<ChangeRequest> {
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
            "An approved agreement is required before recording a post-approval change.",
          );
        }

        if (
          latestAgreement.businessId !==
            tenantContext.businessId ||
          latestAgreement.garmentId !==
            garment.id ||
          latestAgreement.orderId !==
            order.id ||
          latestAgreement.clientId !==
            client.id
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
            "The current agreement must be approved before starting change control.",
          );
        }

        const activeRequest =
          await session
            .findActiveChangeRequest();

        if (activeRequest) {
          throw new ApplicationError(
            "CONFLICT",
            "This garment already has an active change request.",
          );
        }

        let details;

        try {
          details =
            normalizeChangeRequestDetails({
              requestedBy:
                request.requestedBy,
              origin:
                "BUSINESS_RECORDED",
              requestChannel:
                request.requestChannel,
              description:
                request.description,
              requestedAt:
                request.requestedAt,
              baselineResolutionOccurredAt:
                baselineResolution
                  .occurredAt,
              now:
                new Date(),
            });
        } catch (error) {
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

        return session
          .createChangeRequest({
            businessId:
              tenantContext.businessId,
            clientId:
              client.id,
            orderId:
              order.id,
            garmentId:
              garment.id,
            baselineAgreementVersionId:
              latestAgreement.id,
            recordedByMembershipId:
              tenantContext.membershipId,
            ...details,
          });
      },
    );
}
