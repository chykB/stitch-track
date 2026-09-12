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
  normalizeFittingOutcomeDetails,
  type FittingOutcome,
} from "../../domain/fitting";
import type {
  FittingLifecycleRepository,
} from "../ports/fitting-lifecycle-repository";

export type CancelScheduledFittingRequest =
  Readonly<{
    garmentId: string;
    fittingSessionId: string;
    occurredAt: Date;
    cancellationReason: string;
  }>;

export async function cancelScheduledFittingForTenant(
  garmentRepository:
    GarmentRepository,
  orderRepository:
    OrderRepository,
  fittingLifecycleRepository:
    FittingLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    CancelScheduledFittingRequest,
): Promise<FittingOutcome> {
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

  return fittingLifecycleRepository
    .withGarmentLifecycle(
      {
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      },
      async (session) => {
        const fitting =
          await session
            .findFittingSessionById(
              request.fittingSessionId,
            );

        if (
          !fitting ||
          fitting.businessId !==
            tenantContext.businessId ||
          fitting.clientId !==
            order.clientId ||
          fitting.orderId !==
            order.id ||
          fitting.garmentId !==
            garment.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Fitting was not found for this garment.",
          );
        }

        if (!fitting.scheduledFor) {
          throw new ApplicationError(
            "CONFLICT",
            "Only a scheduled fitting can be cancelled.",
          );
        }

        const existingOutcome =
          await session
            .findOutcomeForSession(
              fitting.id,
            );

        if (existingOutcome) {
          throw new ApplicationError(
            "CONFLICT",
            "Fitting has already been completed or cancelled.",
          );
        }

        let details;

        try {
          details =
            normalizeFittingOutcomeDetails({
              outcome:
                "CANCELLED",
              occurredAt:
                request.occurredAt,
              cancellationReason:
                request
                  .cancellationReason,
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
          .createOutcome({
            businessId:
              tenantContext.businessId,
            fittingSessionId:
              fitting.id,
            recordedByMembershipId:
              tenantContext.membershipId,
            ...details,
          });
      },
    );
}
