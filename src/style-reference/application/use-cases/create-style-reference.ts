import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  GarmentRepository,
} from "../../../garment/application/ports/garment-repository";
import {
  normalizeStyleReferenceDetails,
  type NormalizeStyleReferenceDetailsInput,
  type StyleReference,
} from "../../domain/style-reference";
import type {
  StyleReferenceRepository,
} from "../ports/style-reference-repository";

export type CreateStyleReferenceRequest =
  NormalizeStyleReferenceDetailsInput &
    Readonly<{
      garmentId: string;
    }>;

export async function createStyleReferenceForTenant(
  garmentRepository: GarmentRepository,
  styleReferenceRepository:
    StyleReferenceRepository,
  tenantContext: TenantContext,
  request: CreateStyleReferenceRequest,
): Promise<StyleReference> {
  const details =
    normalizeStyleReferenceDetails(
      request,
    );

  const garment =
    await garmentRepository.findById({
      businessId:
        tenantContext.businessId,
      garmentId: request.garmentId,
    });

  if (!garment) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Garment was not found in the current business.",
    );
  }

  return styleReferenceRepository.create({
    businessId:
      tenantContext.businessId,
    garmentId: garment.id,
    ...details,
  });
}
