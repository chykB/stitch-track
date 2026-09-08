import {
  listStyleReferencesForTenant,
  type ListStyleReferencesRequest,
} from "../application/use-cases/list-style-references";
import type {
  StyleReference,
} from "../domain/style-reference";
import {
  prismaStyleReferenceRepository,
} from "../infrastructure/prisma-style-reference-repository";
import {
  prismaGarmentRepository,
} from "../../garment/infrastructure/prisma-garment-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function listStyleReferencesForCurrentTenant(
  requestedBusinessId: string,
  request: ListStyleReferencesRequest,
): Promise<readonly StyleReference[]> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return listStyleReferencesForTenant(
    prismaGarmentRepository,
    prismaStyleReferenceRepository,
    tenantContext,
    request,
  );
}
