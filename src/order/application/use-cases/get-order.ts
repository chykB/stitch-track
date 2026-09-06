import { ApplicationError } from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  Order,
} from "../../domain/order";
import type {
  OrderRepository,
} from "../ports/order-repository";

export type GetOrderRequest = Readonly<{
  orderId: string;
}>;

export async function getOrderForTenant(
  orderRepository: OrderRepository,
  tenantContext: TenantContext,
  request: GetOrderRequest,
): Promise<Order> {
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

  return order;
}
