import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  ClientRepository,
} from "../../../client/application/ports/client-repository";
import type {
  MeasurementVersion,
} from "../../domain/measurement";
import type {
  MeasurementVersionRepository,
} from "../ports/measurement-version-repository";

export type ListMeasurementVersionsRequest =
  Readonly<{
    clientId: string;
  }>;

export async function listMeasurementVersionsForTenant(
  clientRepository: ClientRepository,
  measurementVersionRepository:
    MeasurementVersionRepository,
  tenantContext: TenantContext,
  request: ListMeasurementVersionsRequest,
): Promise<readonly MeasurementVersion[]> {
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

  return measurementVersionRepository.listForClient({
    businessId:
      tenantContext.businessId,
    clientId: client.id,
  });
}
