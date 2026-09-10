import {
  createChangeProposalVersionForTenant,
  type CreateChangeProposalVersionRequest,
} from "../application/use-cases/create-change-proposal-version";
import type {
  ChangeProposalVersion,
} from "../domain/change-proposal-version";
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
  prismaMeasurementVersionRepository,
} from "../../measurement/infrastructure/prisma-measurement-version-repository";
import {
  prismaOrderRepository,
} from "../../order/infrastructure/prisma-order-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";
import {
  prismaStyleReferenceRepository,
} from "../../style-reference/infrastructure/prisma-style-reference-repository";

export async function createChangeProposalVersionForCurrentTenant(
  requestedBusinessId: string,
  request:
    CreateChangeProposalVersionRequest,
): Promise<ChangeProposalVersion> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return createChangeProposalVersionForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaMeasurementVersionRepository,
    prismaStyleReferenceRepository,
    prismaChangeControlLifecycleRepository,
    tenantContext,
    request,
  );
}
