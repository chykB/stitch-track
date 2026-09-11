import type {
  GarmentRepository,
} from "../../../garment/application/ports/garment-repository";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  ClientPortalGrantPurpose,
} from "../../domain/client-portal-grant";
import type {
  ClientPortalGrantReadRepository,
} from "../ports/client-portal-grant-read-repository";

export type OutstandingClientPortalGrant =
  Readonly<{
    id: string;
    purpose:
      ClientPortalGrantPurpose;
    changeProposalVersionId:
      string | null;
    expiresAt: Date;
    createdAt: Date;
  }>;

export type ListOutstandingClientPortalGrantsRequest =
  Readonly<{
    garmentId: string;
  }>;

function inaccessibleGrantMetadata():
  never {
  throw new ApplicationError(
    "NOT_FOUND",
    "Client portal grant metadata was not found for this garment.",
  );
}

export async function listOutstandingClientPortalGrantsForTenant(
  garmentRepository:
    GarmentRepository,
  clientPortalGrantReadRepository:
    ClientPortalGrantReadRepository,
  tenantContext:
    TenantContext,
  request:
    ListOutstandingClientPortalGrantsRequest,
): Promise<
  readonly OutstandingClientPortalGrant[]
> {
  const garment =
    await garmentRepository.findById({
      businessId:
        tenantContext.businessId,
      garmentId:
        request.garmentId,
    });

  if (
    !garment ||
    garment.id !==
      request.garmentId ||
    garment.businessId !==
      tenantContext.businessId
  ) {
    inaccessibleGrantMetadata();
  }

  const grants =
    await clientPortalGrantReadRepository
      .listOutstandingForGarment({
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      });

  return grants.map(
    (grant) => {
      if (
        grant.businessId !==
          tenantContext.businessId ||
        grant.garmentId !==
          garment.id
      ) {
        inaccessibleGrantMetadata();
      }

      return {
        id:
          grant.id,
        purpose:
          grant.purpose,
        changeProposalVersionId:
          grant
            .changeProposalVersionId,
        expiresAt:
          grant.expiresAt,
        createdAt:
          grant.createdAt,
      };
    },
  );
}
