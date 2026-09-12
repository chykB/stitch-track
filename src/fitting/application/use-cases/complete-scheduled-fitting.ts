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
import {
  findHistoricalApprovedFittingBaseline,
} from "../../domain/fitting-baseline";
import {
  normalizeFittingOutcomeDetails,
  type FittingOutcome,
} from "../../domain/fitting";
import type {
  FittingLifecycleRepository,
} from "../ports/fitting-lifecycle-repository";

export type CompleteScheduledFittingRequest =
  Readonly<{
    garmentId: string;
    fittingSessionId: string;
    occurredAt: Date;
    observationSummary: string;
    resultingMeasurementVersionId?:
      string | null;
  }>;

export async function completeScheduledFittingForTenant(
  garmentRepository:
    GarmentRepository,
  orderRepository:
    OrderRepository,
  measurementVersionRepository:
    MeasurementVersionRepository,
  fittingLifecycleRepository:
    FittingLifecycleRepository,
  tenantContext:
    TenantContext,
  request:
    CompleteScheduledFittingRequest,
): Promise<FittingOutcome> {
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

  const requestedMeasurementId =
    request
      .resultingMeasurementVersionId
      ?.trim() || null;

  if (requestedMeasurementId) {
    const measurement =
      await measurementVersionRepository
        .findById({
          businessId:
            tenantContext.businessId,
          measurementVersionId:
            requestedMeasurementId,
        });

    if (
      !measurement ||
      measurement.clientId !==
        order.clientId
    ) {
      throw new ApplicationError(
        "NOT_FOUND",
        "Resulting measurement was not found for this client.",
      );
    }
  }

  return fittingLifecycleRepository
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
            order.clientId ||
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

        if (!fitting.scheduledFor) {
          throw new ApplicationError(
            "CONFLICT",
            "Only a scheduled fitting can be completed.",
          );
        }

        const existingOutcome =
          await session
            .findOutcomeForSession(
              fitting.id,
            );

        if (existingOutcome) {
          throw new ApplicationError(
            "CONFLICT",
            "Fitting has already been completed or cancelled.",
          );
        }

        const history =
          await session
            .listAgreementHistory();

        const baseline =
          findHistoricalApprovedFittingBaseline(
            history,
            request.occurredAt,
          );

        if (!baseline) {
          throw new ApplicationError(
            "CONFLICT",
            "No approved agreement baseline existed when this fitting occurred.",
          );
        }

        if (
          baseline.businessId !==
            tenantContext.businessId ||
          baseline.clientId !==
            order.clientId ||
          baseline.orderId !==
            order.id ||
          baseline.garmentId !==
            garment.id
        ) {
          throw new ApplicationError(
            "NOT_FOUND",
            "Approved fitting baseline was not found for this garment.",
          );
        }

        let details;

        try {
          details =
            normalizeFittingOutcomeDetails({
              outcome:
                "COMPLETED",
              occurredAt:
                request.occurredAt,
              baselineAgreementVersionId:
                baseline.id,
              resultingMeasurementVersionId:
                requestedMeasurementId,
              observationSummary:
                request
                  .observationSummary,
              now:
                new Date(),
            });
        } catch (error) {
          if (error instanceof Error) {
            throw new ApplicationError(
              "CONFLICT",
              error.message,
            );
          }

          throw error;
        }

        return session
          .createOutcome({
            businessId:
              tenantContext.businessId,
            fittingSessionId:
              fitting.id,
            recordedByMembershipId:
              tenantContext.membershipId,
            ...details,
          });
      },
    );
}
