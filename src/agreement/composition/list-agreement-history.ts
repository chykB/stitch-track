import {
  listAgreementHistoryForTenant,
  type AgreementHistoryEntry,
  type ListAgreementHistoryRequest,
} from "../application/use-cases/list-agreement-history";
import {
  prismaAgreementResolutionRepository,
} from "../infrastructure/prisma-agreement-resolution-repository";
import {
  prismaAgreementVersionRepository,
} from "../infrastructure/prisma-agreement-version-repository";
import {
  prismaGarmentRepository,
} from "../../garment/infrastructure/prisma-garment-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function listAgreementHistoryForCurrentTenant(
  requestedBusinessId: string,
  request:
    ListAgreementHistoryRequest,
): Promise<
  readonly AgreementHistoryEntry[]
> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return listAgreementHistoryForTenant(
    prismaGarmentRepository,
    prismaAgreementVersionRepository,
    prismaAgreementResolutionRepository,
    tenantContext,
    request,
  );
}
