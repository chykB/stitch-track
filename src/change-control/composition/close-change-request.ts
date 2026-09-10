import {
  closeChangeRequestForTenant,
  type CloseChangeRequestRequest,
} from "../application/use-cases/close-change-request";
import type {
  ChangeRequestClosure,
} from "../domain/change-request-lifecycle";
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

export async function closeChangeRequestForCurrentTenant(
  requestedBusinessId: string,
  request:
    CloseChangeRequestRequest,
): Promise<ChangeRequestClosure> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return closeChangeRequestForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaChangeControlLifecycleRepository,
    tenantContext,
    request,
  );
}
