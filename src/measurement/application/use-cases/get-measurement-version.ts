import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  MeasurementVersion,
} from "../../domain/measurement";
import type {
  MeasurementVersionRepository,
} from "../ports/measurement-version-repository";

export type GetMeasurementVersionRequest =
  Readonly<{
    measurementVersionId: string;
  }>;

export async function getMeasurementVersionForTenant(
  repository:
    MeasurementVersionRepository,
  tenantContext: TenantContext,
  request: GetMeasurementVersionRequest,
): Promise<MeasurementVersion> {
  const measurementVersion =
    await repository.findById({
      businessId:
        tenantContext.businessId,
      measurementVersionId:
        request.measurementVersionId,
    });

  if (!measurementVersion) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Measurement version was not found in the current business.",
    );
  }

  return measurementVersion;
}
