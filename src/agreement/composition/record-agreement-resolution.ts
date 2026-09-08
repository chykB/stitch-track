import {
  recordAgreementResolutionForTenant,
  type RecordAgreementResolutionRequest,
} from "../application/use-cases/record-agreement-resolution";
import type {
  AgreementResolution,
} from "../domain/agreement-resolution";
import {
  prismaAgreementLifecycleRepository,
} from "../infrastructure/prisma-agreement-lifecycle-repository";
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

export async function recordAgreementResolutionForCurrentTenant(
  requestedBusinessId: string,
  request:
    RecordAgreementResolutionRequest,
): Promise<AgreementResolution> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return recordAgreementResolutionForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaAgreementLifecycleRepository,
    tenantContext,
    request,
  );
}
