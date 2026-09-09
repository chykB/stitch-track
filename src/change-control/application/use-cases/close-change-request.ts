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
  assertChangeRequestActive,
  deriveChangeRequestState,
  normalizeChangeRequestClosureDetails,
  type ChangeRequestClosure,
} from "../../domain/change-request-lifecycle";
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";

export type CloseChangeRequestRequest =
  Readonly<{
    garmentId: string;
    changeRequestId: string;
    outcome: string;
    reason: string;
    occurredAt: Date;
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

export async function closeChangeRequestForTenant(
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
    CloseChangeRequestRequest,
): Promise<ChangeRequestClosure> {
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
      async (session) => {
        const activeRequest =
          await session
            .findActiveChangeRequest();

        if (
          !activeRequest ||
          activeRequest.id !==
            request.changeRequestId
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Active change request was not found for this garment.",
          );
        }

        if (
          activeRequest.businessId !==
            tenantContext.businessId ||
          activeRequest.clientId !==
            client.id ||
          activeRequest.orderId !==
            order.id ||
          activeRequest.garmentId !==
            garment.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Change request was not found for this garment.",
          );
        }

        const existingClosure =
          await session
            .findClosureForRequest(
              activeRequest.id,
            );

        if (existingClosure) {
          throw new ApplicationError(
            "CONFLICT",
            "Change request has already been closed.",
          );
        }

        const latestProposal =
          await session
            .findLatestProposalForRequest(
              activeRequest.id,
            );

        const latestDecision =
          latestProposal
            ? await session
                .findDecisionForProposal(
                  latestProposal.id,
                )
            : null;

        if (
          latestDecision?.outcome ===
          "APPROVED"
        ) {
          throw new ApplicationError(
            "CONFLICT",
            "An approved change request cannot be closed.",
          );
        }

        try {
          const state =
            deriveChangeRequestState(
              latestProposal,
              latestDecision,
              null,
            );

          assertChangeRequestActive(
            state,
          );

          const details =
            normalizeChangeRequestClosureDetails({
              outcome:
                request.outcome,
              reason:
                request.reason,
              occurredAt:
                request.occurredAt,
              requestCreatedAt:
                activeRequest.createdAt,
              now:
                new Date(),
            });

          const closure =
            await session
              .createChangeRequestClosure({
                businessId:
                  tenantContext.businessId,
                changeRequestId:
                  activeRequest.id,
                recordedByMembershipId:
                  tenantContext.membershipId,
                ...details,
              });

          await session
            .releaseActiveChangeRequest(
              activeRequest.id,
            );

          return closure;
        } catch (error) {
          return toConflict(
            error,
          );
        }
      },
    );
}
