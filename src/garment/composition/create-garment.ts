import {
  createGarmentForTenant,
  type CreateGarmentRequest,
} from "../application/use-cases/create-garment";
import type {
  Garment,
} from "../domain/garment";
import {
  prismaGarmentRepository,
} from "../infrastructure/prisma-garment-repository";
import {
  prismaOrderRepository,
} from "../../order/infrastructure/prisma-order-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function createGarmentForCurrentTenant(
  requestedBusinessId: string,
  request: CreateGarmentRequest,
): Promise<Garment> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return createGarmentForTenant(
    prismaOrderRepository,
    prismaGarmentRepository,
    tenantContext,
    request,
  );
}
