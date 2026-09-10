import {
  recordChangeProposalApprovalForTenant,
  type AppliedChangeApproval,
  type RecordChangeProposalApprovalRequest,
} from "../application/use-cases/record-change-proposal-approval";
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

export async function recordChangeProposalApprovalForCurrentTenant(
  requestedBusinessId: string,
  request:
    RecordChangeProposalApprovalRequest,
): Promise<AppliedChangeApproval> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return recordChangeProposalApprovalForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaChangeControlLifecycleRepository,
    tenantContext,
    request,
  );
}
