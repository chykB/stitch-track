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
  ChangeRequest,
} from "../../domain/change-request";
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";
import {
  createBusinessRecordedChangeRequestInLifecycle,
} from "./create-business-recorded-change-request-in-lifecycle";

export type CreateChangeRequestRequest =
  Readonly<{
    garmentId: string;
    requestedBy: string;
    requestChannel?:
      string | null;
    description: string;
    requestedAt: Date;
  }>;

export async function createChangeRequestForTenant(
  clientRepository:
    ClientRepository,
  orderRepository:
    OrderRepository,
  garmentRepository:
    GarmentRepository,
  changeControlLifecycleRepository:
    ChangeControlLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    CreateChangeRequestRequest,
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

  return changeControlLifecycleRepository
    .withGarmentLifecycle(
      {
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      },
      (session) =>
        createBusinessRecordedChangeRequestInLifecycle(
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
        ),
    );
}
