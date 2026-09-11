import {
  createChangeRequestForTenant,
  type CreateChangeRequestRequest,
} from "../application/use-cases/create-change-request";
import type {
  ChangeRequest,
} from "../domain/change-request";
import {
  prismaChangeControlLifecycleRepository,
} from "../infrastructure/prisma-change-control-lifecycle-repository";
import {
  prismaClientRepository,
} from "../../client/infrastructure/prisma-client-repository";
import {
  prismaGarmentRepository,
} from "../../garment/infrastructure/prisma-garment-repository";
import {
  prismaOrderRepository,
} from "../../order/infrastructure/prisma-order-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function createChangeRequestForCurrentTenant(
  requestedBusinessId: string,
  request:
    CreateChangeRequestRequest,
): Promise<ChangeRequest> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return createChangeRequestForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaChangeControlLifecycleRepository,
    tenantContext,
    request,
  );
}
