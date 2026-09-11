import {
  getChangeControlHistoryForTenant,
  type ChangeControlHistory,
  type GetChangeControlHistoryRequest,
} from "../application/use-cases/get-change-control-history";
import {
  prismaChangeControlHistoryRepository,
} from "../infrastructure/prisma-change-control-history-repository";
import {
  prismaAgreementResolutionRepository,
} from "../../agreement/infrastructure/prisma-agreement-resolution-repository";
import {
  prismaAgreementVersionRepository,
} from "../../agreement/infrastructure/prisma-agreement-version-repository";
import {
  prismaGarmentRepository,
} from "../../garment/infrastructure/prisma-garment-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function getChangeControlHistoryForCurrentTenant(
  requestedBusinessId: string,
  request:
    GetChangeControlHistoryRequest,
): Promise<ChangeControlHistory> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return getChangeControlHistoryForTenant(
    prismaGarmentRepository,
    prismaAgreementVersionRepository,
    prismaAgreementResolutionRepository,
    prismaChangeControlHistoryRepository,
    tenantContext,
    request,
  );
}
