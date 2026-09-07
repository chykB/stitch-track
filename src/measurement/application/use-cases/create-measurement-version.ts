import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  ClientRepository,
} from "../../../client/application/ports/client-repository";
import {
  normalizeMeasurementVersionDetails,
  type MeasurementVersion,
  type NormalizeMeasurementEntryInput,
} from "../../domain/measurement";
import type {
  MeasurementVersionRepository,
} from "../ports/measurement-version-repository";

export type CreateMeasurementVersionRequest =
  Readonly<{
    clientId: string;
    measuredAt: Date;
    unit: string;
    note?: string | null;
    entries:
      readonly NormalizeMeasurementEntryInput[];
  }>;

export async function createMeasurementVersionForTenant(
  clientRepository: ClientRepository,
  measurementVersionRepository:
    MeasurementVersionRepository,
  tenantContext: TenantContext,
  request: CreateMeasurementVersionRequest,
): Promise<MeasurementVersion> {
  const details =
    normalizeMeasurementVersionDetails(
      request,
    );

  const client =
    await clientRepository.findById({
      businessId:
        tenantContext.businessId,
      clientId: request.clientId,
    });

  if (!client) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Client was not found in the current business.",
    );
  }

  return measurementVersionRepository.create({
    businessId:
      tenantContext.businessId,
    clientId: client.id,
    ...details,
  });
}
