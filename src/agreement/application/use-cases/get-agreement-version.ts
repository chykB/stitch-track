import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  AgreementVersion,
} from "../../domain/agreement-version";
import type {
  AgreementVersionRepository,
} from "../ports/agreement-version-repository";

export type GetAgreementVersionRequest =
  Readonly<{
    agreementVersionId: string;
  }>;

export async function getAgreementVersionForTenant(
  agreementVersionRepository:
    AgreementVersionRepository,
  tenantContext:
    TenantContext,
  request:
    GetAgreementVersionRequest,
): Promise<AgreementVersion> {
  const agreementVersion =
    await agreementVersionRepository
      .findById({
        businessId:
          tenantContext.businessId,
        agreementVersionId:
          request.agreementVersionId,
      });

  if (!agreementVersion) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Agreement version was not found in the current business.",
    );
  }

  return agreementVersion;
}
