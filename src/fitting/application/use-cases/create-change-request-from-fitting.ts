import {
  createBusinessRecordedChangeRequestInLifecycle,
} from "../../../change-control/application/use-cases/create-business-recorded-change-request-in-lifecycle";
import type {
  ChangeRequest,
} from "../../../change-control/domain/change-request";
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
import type {
  FittingChangeRequestLifecycleRepository,
} from "../ports/fitting-change-request-lifecycle-repository";

export type CreateChangeRequestFromFittingRequest =
  Readonly<{
    garmentId: string;
    fittingSessionId: string;
    requestedBy: string;
    requestChannel?:
      string | null;
    description: string;
    requestedAt: Date;
  }>;

export async function createChangeRequestFromFittingForTenant(
  clientRepository:
    ClientRepository,
  orderRepository:
    OrderRepository,
  garmentRepository:
    GarmentRepository,
  lifecycleRepository:
    FittingChangeRequestLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    CreateChangeRequestFromFittingRequest,
): Promise<ChangeRequest> {
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

  return lifecycleRepository
    .withGarmentLifecycle(
      {
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      },
      async (session) => {
        const fitting =
          await session
            .findFittingSessionById(
              request.fittingSessionId,
            );

        if (
          !fitting ||
          fitting.businessId !==
            tenantContext.businessId ||
          fitting.clientId !==
            client.id ||
          fitting.orderId !==
            order.id ||
          fitting.garmentId !==
            garment.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Fitting was not found for this garment.",
          );
        }

        const outcome =
          await session
            .findOutcomeForSession(
              fitting.id,
            );

        if (
          !outcome ||
          outcome.businessId !==
            tenantContext.businessId ||
          outcome.fittingSessionId !==
            fitting.id ||
          outcome.outcome !==
            "COMPLETED" ||
          !outcome
            .baselineAgreementVersionId
        ) {
          throw new ApplicationError(
            "CONFLICT",
            "A completed fitting is required before creating a fitting-origin change request.",
          );
        }

        const changeRequest =
          await createBusinessRecordedChangeRequestInLifecycle(
            session,
            {
              businessId:
                tenantContext.businessId,
              clientId:
                client.id,
              orderId:
                order.id,
              garmentId:
                garment.id,
              recordedByMembershipId:
                tenantContext.membershipId,
              requestedBy:
                request.requestedBy,
              requestChannel:
                request.requestChannel,
              description:
                request.description,
              requestedAt:
                request.requestedAt,
            },
          );

        await session
          .createFittingChangeRequestLink({
            businessId:
              tenantContext.businessId,
            fittingSessionId:
              fitting.id,
            changeRequestId:
              changeRequest.id,
            createdByMembershipId:
              tenantContext.membershipId,
          });

        return changeRequest;
      },
    );
}
