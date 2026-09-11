import type {
  ClientRepository,
} from "../../../client/application/ports/client-repository";
import type {
  GarmentRepository,
} from "../../../garment/application/ports/garment-repository";
import type {
  OrderRepository,
} from "../../../order/application/ports/order-repository";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import {
  normalizeAgreementResolutionDetails,
  type AgreementResolution,
} from "../../domain/agreement-resolution";
import type {
  AgreementLifecycleRepository,
} from "../ports/agreement-lifecycle-repository";

export type RecordAgreementResolutionRequest =
  Readonly<{
    garmentId: string;
    agreementVersionId: string;
    outcome: string;
    occurredAt: Date;
    clientDecisionChannel?:
      string | null;
    evidenceNote: string;
  }>;

export async function recordAgreementResolutionForTenant(
  clientRepository:
    ClientRepository,
  orderRepository:
    OrderRepository,
  garmentRepository:
    GarmentRepository,
  agreementLifecycleRepository:
    AgreementLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    RecordAgreementResolutionRequest,
): Promise<AgreementResolution> {
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

        if (
          !latestVersion ||
          latestVersion.id !==
            request.agreementVersionId
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Agreement version was not found as the current agreement for this garment.",
          );
        }

        if (
          latestVersion.businessId !==
            tenantContext.businessId ||
          latestVersion.garmentId !==
            garment.id ||
          latestVersion.orderId !==
            order.id ||
          latestVersion.clientId !==
            client.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Agreement version was not found for this garment.",
          );
        }

        const existingResolution =
          await session
            .findResolutionForVersion(
              latestVersion.id,
            );

        if (existingResolution) {
          throw new ApplicationError(
            "CONFLICT",
            "Agreement version has already been resolved.",
          );
        }

        const isWithdrawal =
          request.outcome ===
          "WITHDRAWN";

        const requestedChannel =
          request.clientDecisionChannel
            ?.trim()
            .toUpperCase() ??
          null;

        if (
          !isWithdrawal &&
          requestedChannel ===
            "PORTAL"
        ) {
          throw new ApplicationError(
            "CONFLICT",
            "PORTAL is reserved for the controlled client portal workflow.",
          );
        }

        const details =
          normalizeAgreementResolutionDetails({
            outcome:
              request.outcome,
            occurredAt:
              request.occurredAt,
            clientNameSnapshot:
              isWithdrawal
                ? null
                : client.name,
            clientDecisionChannel:
              isWithdrawal
                ? null
                : request
                    .clientDecisionChannel,
            evidenceNote:
              request.evidenceNote,
            agreementCreatedAt:
              latestVersion.createdAt,
            now:
              new Date(),
          });

        return session.createResolution({
          businessId:
            tenantContext.businessId,
          agreementVersionId:
            latestVersion.id,
          recordedByMembershipId:
            tenantContext.membershipId,
          ...details,
        });
      },
    );
}
