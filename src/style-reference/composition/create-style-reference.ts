import {
  createStyleReferenceForTenant,
  type CreateStyleReferenceRequest,
} from "../application/use-cases/create-style-reference";
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

export async function createStyleReferenceForCurrentTenant(
  requestedBusinessId: string,
  request: CreateStyleReferenceRequest,
): Promise<StyleReference> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return createStyleReferenceForTenant(
    prismaGarmentRepository,
    prismaStyleReferenceRepository,
    tenantContext,
    request,
  );
}
