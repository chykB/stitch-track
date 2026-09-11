import {
  issueChangeProposalDecisionPortalGrantForTenant,
  type IssuedChangeProposalDecisionPortalGrant,
  type IssueChangeProposalDecisionPortalGrantRequest,
} from "../application/use-cases/issue-change-proposal-decision-portal-grant";
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

export async function issueChangeProposalDecisionPortalGrantForCurrentTenant(
  requestedBusinessId: string,
  request:
    IssueChangeProposalDecisionPortalGrantRequest,
): Promise<IssuedChangeProposalDecisionPortalGrant> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return issueChangeProposalDecisionPortalGrantForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaChangeControlLifecycleRepository,
    nodeClientPortalTokenService,
    tenantContext,
    request,
  );
}
