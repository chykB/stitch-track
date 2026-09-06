import { ApplicationError } from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  ClientRepository,
} from "../../../client/application/ports/client-repository";
import type {
  Order,
} from "../../domain/order";
import type {
  OrderRepository,
} from "../ports/order-repository";

export type CreateOrderRequest = Readonly<{
  clientId: string;
}>;

export async function createOrderForTenant(
  clientRepository: ClientRepository,
  orderRepository: OrderRepository,
  tenantContext: TenantContext,
  request: CreateOrderRequest,
): Promise<Order> {
  const client =
    await clientRepository.findById({
      businessId: tenantContext.businessId,
      clientId: request.clientId,
    });

  if (!client) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Client was not found in the current business.",
    );
  }

  return orderRepository.create({
    businessId: tenantContext.businessId,
    clientId: client.id,
  });
}
