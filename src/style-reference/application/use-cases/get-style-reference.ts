import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  StyleReference,
} from "../../domain/style-reference";
import type {
  StyleReferenceRepository,
} from "../ports/style-reference-repository";

export type GetStyleReferenceRequest =
  Readonly<{
    styleReferenceId: string;
  }>;

export async function getStyleReferenceForTenant(
  repository:
    StyleReferenceRepository,
  tenantContext: TenantContext,
  request: GetStyleReferenceRequest,
): Promise<StyleReference> {
  const styleReference =
    await repository.findById({
      businessId:
        tenantContext.businessId,
      styleReferenceId:
        request.styleReferenceId,
    });

  if (!styleReference) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Style reference was not found in the current business.",
    );
  }

  return styleReference;
}
