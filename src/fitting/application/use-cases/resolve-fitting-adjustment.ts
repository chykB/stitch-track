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
  normalizeFittingAdjustmentResolutionDetails,
  type FittingAdjustmentResolution,
} from "../../domain/fitting-adjustment";
import type {
  FittingLifecycleRepository,
} from "../ports/fitting-lifecycle-repository";

export type ResolveFittingAdjustmentRequest =
  Readonly<{
    garmentId: string;
    fittingAdjustmentId: string;
    outcome: string;
    occurredAt: Date;
    note?: string | null;
    reason?: string | null;
  }>;

export async function resolveFittingAdjustmentForTenant(
  garmentRepository:
    GarmentRepository,
  orderRepository:
    OrderRepository,
  fittingLifecycleRepository:
    FittingLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    ResolveFittingAdjustmentRequest,
): Promise<FittingAdjustmentResolution> {
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
        const adjustment =
          await session
            .findAdjustmentById(
              request
                .fittingAdjustmentId,
            );

        if (
          !adjustment ||
          adjustment.businessId !==
            tenantContext.businessId ||
          adjustment.clientId !==
            order.clientId ||
          adjustment.orderId !==
            order.id ||
          adjustment.garmentId !==
            garment.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Fitting adjustment was not found for this garment.",
          );
        }

        const existingResolution =
          await session
            .findAdjustmentResolution(
              adjustment.id,
            );

        if (existingResolution) {
          throw new ApplicationError(
            "CONFLICT",
            "Fitting adjustment has already been resolved.",
          );
        }

        let details;

        try {
          details =
            normalizeFittingAdjustmentResolutionDetails({
              outcome:
                request.outcome,
              occurredAt:
                request.occurredAt,
              note:
                request.note,
              reason:
                request.reason,
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
          .createAdjustmentResolution({
            businessId:
              tenantContext.businessId,
            fittingAdjustmentId:
              adjustment.id,
            recordedByMembershipId:
              tenantContext.membershipId,
            ...details,
          });
      },
    );
}
