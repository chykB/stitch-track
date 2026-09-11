import {
  listOutstandingClientPortalGrantsForTenant,
  type ListOutstandingClientPortalGrantsRequest,
  type OutstandingClientPortalGrant,
} from "../application/use-cases/list-outstanding-client-portal-grants";
import {
  prismaClientPortalGrantReadRepository,
} from "../infrastructure/prisma-client-portal-grant-read-repository";
import {
  prismaGarmentRepository,
} from "../../garment/infrastructure/prisma-garment-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function listOutstandingClientPortalGrantsForCurrentTenant(
  requestedBusinessId: string,
  request:
    ListOutstandingClientPortalGrantsRequest,
): Promise<
  readonly OutstandingClientPortalGrant[]
> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return listOutstandingClientPortalGrantsForTenant(
    prismaGarmentRepository,
    prismaClientPortalGrantReadRepository,
    tenantContext,
    request,
  );
}
