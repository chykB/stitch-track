import {
  getAgreementVersionForTenant,
  type GetAgreementVersionRequest,
} from "../application/use-cases/get-agreement-version";
import type {
  AgreementVersion,
} from "../domain/agreement-version";
import {
  prismaAgreementVersionRepository,
} from "../infrastructure/prisma-agreement-version-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function getAgreementVersionForCurrentTenant(
  requestedBusinessId: string,
  request:
    GetAgreementVersionRequest,
): Promise<AgreementVersion> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return getAgreementVersionForTenant(
    prismaAgreementVersionRepository,
    tenantContext,
    request,
  );
}
