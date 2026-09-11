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
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";

export type RevokeClientPortalGrantRequest =
  Readonly<{
    garmentId: string;
    clientPortalGrantId: string;
  }>;

export type RevokedClientPortalGrant =
  Readonly<{
    clientPortalGrantId: string;
    purpose:
      ClientPortalGrantPurpose;
    changeProposalVersionId:
      string | null;
    revokedAt: Date;
  }>;

function toConflict(
  error: unknown,
): never {
  if (
    error instanceof Error
  ) {
    throw new ApplicationError(
      "CONFLICT",
      error.message,
    );
  }

  throw error;
}

export async function revokeClientPortalGrantForTenant(
  garmentRepository:
    GarmentRepository,
  changeControlLifecycleRepository:
    ChangeControlLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    RevokeClientPortalGrantRequest,
): Promise<RevokedClientPortalGrant> {
  const garment =
    await garmentRepository.findById({
      businessId:
        tenantContext.businessId,
      garmentId:
        request.garmentId,
    });

  if (!garment) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Garment was not found in the current business.",
    );
  }

  return changeControlLifecycleRepository
    .withGarmentLifecycle(
      {
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      },
      async (session) => {
        const grant =
          await session
            .findClientPortalGrantById(
              request.clientPortalGrantId,
            );

        if (!grant) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Client portal grant was not found for this garment.",
          );
        }

        if (
          grant.businessId !==
            tenantContext.businessId ||
          grant.garmentId !==
            garment.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Client portal grant was not found for this garment.",
          );
        }

        if (grant.consumedAt) {
          throw new ApplicationError(
            "CONFLICT",
            "Consumed client portal grants cannot be revoked.",
          );
        }

        if (grant.revokedAt) {
          throw new ApplicationError(
            "CONFLICT",
            "Client portal grant has already been revoked.",
          );
        }

        try {
          const revoked =
            await session
              .revokeClientPortalGrant(
                grant.id,
                new Date(),
              );

          if (!revoked.revokedAt) {
            throw new Error(
              "Client portal grant revocation timestamp was not persisted.",
            );
          }

          return {
            clientPortalGrantId:
              revoked.id,
            purpose:
              revoked.purpose,
            changeProposalVersionId:
              revoked
                .changeProposalVersionId,
            revokedAt:
              revoked.revokedAt,
          };
        } catch (error) {
          return toConflict(
            error,
          );
        }
      },
    );
}
