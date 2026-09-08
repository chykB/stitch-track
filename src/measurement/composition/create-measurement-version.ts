import {
  createMeasurementVersionForTenant,
  type CreateMeasurementVersionRequest,
} from "../application/use-cases/create-measurement-version";
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

export async function createMeasurementVersionForCurrentTenant(
  requestedBusinessId: string,
  request: CreateMeasurementVersionRequest,
): Promise<MeasurementVersion> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return createMeasurementVersionForTenant(
    prismaClientRepository,
    prismaMeasurementVersionRepository,
    tenantContext,
    request,
  );
}
