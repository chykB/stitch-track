import type {
  GarmentRepository,
} from "../../../garment/application/ports/garment-repository";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  AgreementResolution,
} from "../../domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../domain/agreement-version";
import type {
  AgreementResolutionRepository,
} from "../ports/agreement-resolution-repository";
import type {
  AgreementVersionRepository,
} from "../ports/agreement-version-repository";

export type AgreementHistoryEntry =
  Readonly<{
    version:
      AgreementVersion;
    resolution:
      AgreementResolution | null;
  }>;

export type ListAgreementHistoryRequest =
  Readonly<{
    garmentId: string;
  }>;

export async function listAgreementHistoryForTenant(
  garmentRepository:
    GarmentRepository,
  agreementVersionRepository:
    AgreementVersionRepository,
  agreementResolutionRepository:
    AgreementResolutionRepository,
  tenantContext:
    TenantContext,
  request:
    ListAgreementHistoryRequest,
): Promise<
  readonly AgreementHistoryEntry[]
> {
  const garment =
    await garmentRepository.findById({
      businessId:
        tenantContext.businessId,
      garmentId:
        request.garmentId,
    });

  if (!garment) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Garment was not found in the current business.",
    );
  }

  const versions =
    await agreementVersionRepository
      .listForGarment({
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      });

  const orderedVersions =
    [...versions].sort(
      (left, right) =>
        left.revisionNumber -
        right.revisionNumber,
    );

  return Promise.all(
    orderedVersions.map(
      async (version) => ({
        version,
        resolution:
          await agreementResolutionRepository
            .findForVersion({
              businessId:
                tenantContext.businessId,
              agreementVersionId:
                version.id,
            }),
      }),
    ),
  );
}
