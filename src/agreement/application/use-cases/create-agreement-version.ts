import type {
  ClientRepository,
} from "../../../client/application/ports/client-repository";
import type {
  GarmentRepository,
} from "../../../garment/application/ports/garment-repository";
import type {
  MeasurementVersionRepository,
} from "../../../measurement/application/ports/measurement-version-repository";
import type {
  OrderRepository,
} from "../../../order/application/ports/order-repository";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  StyleReferenceRepository,
} from "../../../style-reference/application/ports/style-reference-repository";
import {
  calculateNextAgreementRevision,
  normalizeAgreementVersionDetails,
  type AgreementVersion,
  type NormalizeAgreementVersionDetailsInput,
} from "../../domain/agreement-version";
import type {
  AgreementLifecycleRepository,
} from "../ports/agreement-lifecycle-repository";

export type CreateAgreementVersionRequest =
  NormalizeAgreementVersionDetailsInput &
    Readonly<{
      garmentId: string;
    }>;

export async function createAgreementVersionForTenant(
  clientRepository:
    ClientRepository,
  orderRepository:
    OrderRepository,
  garmentRepository:
    GarmentRepository,
  measurementVersionRepository:
    MeasurementVersionRepository,
  styleReferenceRepository:
    StyleReferenceRepository,
  agreementLifecycleRepository:
    AgreementLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    CreateAgreementVersionRequest,
): Promise<AgreementVersion> {
  const details =
    normalizeAgreementVersionDetails(
      request,
    );

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

  const order =
    await orderRepository.findById({
      businessId:
        tenantContext.businessId,
      orderId:
        garment.orderId,
    });

  if (!order) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Order was not found in the current business.",
    );
  }

  const client =
    await clientRepository.findById({
      businessId:
        tenantContext.businessId,
      clientId:
        order.clientId,
    });

  if (!client) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Client was not found in the current business.",
    );
  }

  if (
    details.measurementVersionId
  ) {
    const measurementVersion =
      await measurementVersionRepository
        .findById({
          businessId:
            tenantContext.businessId,
          measurementVersionId:
            details.measurementVersionId,
        });

    if (
      !measurementVersion ||
      measurementVersion.clientId !==
        client.id
    ) {
      throw new ApplicationError(
        "NOT_FOUND",
        "Measurement version was not found for this client.",
      );
    }
  }

  for (
    const styleReferenceId
    of details.styleReferenceIds
  ) {
    const styleReference =
      await styleReferenceRepository
        .findById({
          businessId:
            tenantContext.businessId,
          styleReferenceId,
        });

    if (
      !styleReference ||
      styleReference.garmentId !==
        garment.id
    ) {
      throw new ApplicationError(
        "NOT_FOUND",
        "Style reference was not found for this garment.",
      );
    }
  }

  return agreementLifecycleRepository
    .withGarmentLifecycle(
      {
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      },
      async (session) => {
        const latestVersion =
          await session
            .findLatestVersion();

        const latestResolution =
          latestVersion
            ? await session
                .findResolutionForVersion(
                  latestVersion.id,
                )
            : null;

        let revision;

        try {
          revision =
            calculateNextAgreementRevision(
              latestVersion,
              latestResolution
                ?.outcome ??
                null,
            );
        } catch (error) {
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

        return session.createVersion({
          businessId:
            tenantContext.businessId,
          clientId:
            client.id,
          orderId:
            order.id,
          garmentId:
            garment.id,
          revisionNumber:
            revision.revisionNumber,
          supersedesAgreementVersionId:
            revision
              .supersedesAgreementVersionId,
          ...details,
        });
      },
    );
}
