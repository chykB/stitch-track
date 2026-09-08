import {
  createAgreementVersionForTenant,
  type CreateAgreementVersionRequest,
} from "../application/use-cases/create-agreement-version";
import type {
  AgreementVersion,
} from "../domain/agreement-version";
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

export async function createAgreementVersionForCurrentTenant(
  requestedBusinessId: string,
  request:
    CreateAgreementVersionRequest,
): Promise<AgreementVersion> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return createAgreementVersionForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaMeasurementVersionRepository,
    prismaStyleReferenceRepository,
    prismaAgreementLifecycleRepository,
    tenantContext,
    request,
  );
}
