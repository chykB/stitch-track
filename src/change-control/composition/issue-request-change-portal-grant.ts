import {
  issueRequestChangePortalGrantForTenant,
  type IssuedRequestChangePortalGrant,
  type IssueRequestChangePortalGrantRequest,
} from "../application/use-cases/issue-request-change-portal-grant";
import {
  nodeClientPortalTokenService,
} from "../infrastructure/node-client-portal-token-service";
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

export async function issueRequestChangePortalGrantForCurrentTenant(
  requestedBusinessId: string,
  request:
    IssueRequestChangePortalGrantRequest,
): Promise<IssuedRequestChangePortalGrant> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return issueRequestChangePortalGrantForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaChangeControlLifecycleRepository,
    nodeClientPortalTokenService,
    tenantContext,
    request,
  );
}
