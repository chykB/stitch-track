import {
  recordChangeProposalRejectionForTenant,
  type RecordChangeProposalRejectionRequest,
} from "../application/use-cases/record-change-proposal-rejection";
import type {
  ChangeProposalDecision,
} from "../domain/change-proposal-decision";
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

export async function recordChangeProposalRejectionForCurrentTenant(
  requestedBusinessId: string,
  request:
    RecordChangeProposalRejectionRequest,
): Promise<ChangeProposalDecision> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return recordChangeProposalRejectionForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaChangeControlLifecycleRepository,
    tenantContext,
    request,
  );
}
