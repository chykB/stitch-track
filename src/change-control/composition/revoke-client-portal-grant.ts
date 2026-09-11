import {
  revokeClientPortalGrantForTenant,
  type RevokedClientPortalGrant,
  type RevokeClientPortalGrantRequest,
} from "../application/use-cases/revoke-client-portal-grant";
import {
  prismaChangeControlLifecycleRepository,
} from "../infrastructure/prisma-change-control-lifecycle-repository";
import {
  prismaGarmentRepository,
} from "../../garment/infrastructure/prisma-garment-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function revokeClientPortalGrantForCurrentTenant(
  requestedBusinessId: string,
  request:
    RevokeClientPortalGrantRequest,
): Promise<RevokedClientPortalGrant> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return revokeClientPortalGrantForTenant(
    prismaGarmentRepository,
    prismaChangeControlLifecycleRepository,
    tenantContext,
    request,
  );
}
