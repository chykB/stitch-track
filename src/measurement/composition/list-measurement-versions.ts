import {
  listMeasurementVersionsForTenant,
  type ListMeasurementVersionsRequest,
} from "../application/use-cases/list-measurement-versions";
import type {
  MeasurementVersion,
} from "../domain/measurement";
import {
  prismaMeasurementVersionRepository,
} from "../infrastructure/prisma-measurement-version-repository";
import {
  prismaClientRepository,
} from "../../client/infrastructure/prisma-client-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function listMeasurementVersionsForCurrentTenant(
  requestedBusinessId: string,
  request: ListMeasurementVersionsRequest,
): Promise<readonly MeasurementVersion[]> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return listMeasurementVersionsForTenant(
    prismaClientRepository,
    prismaMeasurementVersionRepository,
    tenantContext,
    request,
  );
}
