import { ApplicationError } from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  Garment,
} from "../../domain/garment";
import type {
  GarmentRepository,
} from "../ports/garment-repository";

export type GetGarmentRequest = Readonly<{
  garmentId: string;
}>;

export async function getGarmentForTenant(
  garmentRepository: GarmentRepository,
  tenantContext: TenantContext,
  request: GetGarmentRequest,
): Promise<Garment> {
  const garment =
    await garmentRepository.findById({
      businessId: tenantContext.businessId,
      garmentId: request.garmentId,
    });

  if (!garment) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Garment was not found in the current business.",
    );
  }

  return garment;
}
