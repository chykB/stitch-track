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
  normalizeFittingAdjustmentDescription,
  type FittingAdjustment,
} from "../../domain/fitting-adjustment";
import type {
  FittingLifecycleRepository,
} from "../ports/fitting-lifecycle-repository";

export type RecordFittingAdjustmentRequest =
  Readonly<{
    garmentId: string;
    fittingSessionId: string;
    description: string;
  }>;

export async function recordFittingAdjustmentForTenant(
  garmentRepository:
    GarmentRepository,
  orderRepository:
    OrderRepository,
  fittingLifecycleRepository:
    FittingLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    RecordFittingAdjustmentRequest,
): Promise<FittingAdjustment> {
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

        const outcome =
          await session
            .findOutcomeForSession(
              fitting.id,
            );

        if (
          !outcome ||
          outcome.businessId !==
            tenantContext.businessId ||
          outcome.fittingSessionId !==
            fitting.id ||
          outcome.outcome !==
            "COMPLETED" ||
          !outcome
            .baselineAgreementVersionId
        ) {
          throw new ApplicationError(
            "CONFLICT",
            "Adjustments can only be recorded from a completed fitting.",
          );
        }

        let description;

        try {
          description =
            normalizeFittingAdjustmentDescription(
              request.description,
            );
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
          .createAdjustment({
            businessId:
              tenantContext.businessId,
            clientId:
              order.clientId,
            orderId:
              order.id,
            garmentId:
              garment.id,
            fittingSessionId:
              fitting.id,
            description,
            recordedByMembershipId:
              tenantContext.membershipId,
          });
      },
    );
}
