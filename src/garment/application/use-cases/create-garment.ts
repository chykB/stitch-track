import { ApplicationError } from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  OrderRepository,
} from "../../../order/application/ports/order-repository";
import {
  normalizeGarmentDetails,
  type Garment,
} from "../../domain/garment";
import type {
  GarmentRepository,
} from "../ports/garment-repository";

export type CreateGarmentRequest = Readonly<{
  orderId: string;
  name: string;
}>;

export async function createGarmentForTenant(
  orderRepository: OrderRepository,
  garmentRepository: GarmentRepository,
  tenantContext: TenantContext,
  request: CreateGarmentRequest,
): Promise<Garment> {
  const details =
    normalizeGarmentDetails(request);

  const order =
    await orderRepository.findById({
      businessId: tenantContext.businessId,
      orderId: request.orderId,
    });

  if (!order) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Order was not found in the current business.",
    );
  }

  return garmentRepository.create({
    businessId: tenantContext.businessId,
    orderId: order.id,
    ...details,
  });
}
