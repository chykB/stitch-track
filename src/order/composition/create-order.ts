import {
  createOrderForTenant,
  type CreateOrderRequest,
} from "../application/use-cases/create-order";
import type {
  Order,
} from "../domain/order";
import {
  prismaOrderRepository,
} from "../infrastructure/prisma-order-repository";
import {
  prismaClientRepository,
} from "../../client/infrastructure/prisma-client-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function createOrderForCurrentTenant(
  requestedBusinessId: string,
  request: CreateOrderRequest,
): Promise<Order> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return createOrderForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    tenantContext,
    request,
  );
}
