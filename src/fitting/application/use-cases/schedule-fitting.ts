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
  normalizeScheduledFittingSessionDetails,
  type FittingSession,
} from "../../domain/fitting";
import type {
  FittingSessionRepository,
} from "../ports/fitting-session-repository";

export type ScheduleFittingRequest =
  Readonly<{
    garmentId: string;
    scheduledFor: Date;
    note?: string | null;
  }>;

export async function scheduleFittingForTenant(
  garmentRepository:
    GarmentRepository,
  orderRepository:
    OrderRepository,
  fittingSessionRepository:
    FittingSessionRepository,
  tenantContext:
    TenantContext,
  request:
    ScheduleFittingRequest,
): Promise<FittingSession> {
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

  const details =
    normalizeScheduledFittingSessionDetails({
      scheduledFor:
        request.scheduledFor,
      note:
        request.note,
      now:
        new Date(),
    });

  return fittingSessionRepository
    .create({
      businessId:
        tenantContext.businessId,
      clientId:
        order.clientId,
      orderId:
        order.id,
      garmentId:
        garment.id,
      createdByMembershipId:
        tenantContext.membershipId,
      ...details,
    });
}
