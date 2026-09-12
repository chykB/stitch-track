import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  FittingLifecycleRepository,
  FittingLifecycleSession,
} from "../../src/fitting/application/ports/fitting-lifecycle-repository";
import {
  recordFittingAdjustmentForTenant,
} from "../../src/fitting/application/use-cases/record-fitting-adjustment";
import type {
  FittingOutcome,
  FittingSession,
} from "../../src/fitting/domain/fitting";
import type {
  GarmentRepository,
} from "../../src/garment/application/ports/garment-repository";
import type {
  OrderRepository,
} from "../../src/order/application/ports/order-repository";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const TENANT: TenantContext = {
  userId:
    "user-1",
  businessId:
    "business-1",
  membershipId:
    "membership-1",
  role:
    "OWNER",
};

const GARMENT = {
  id:
    "garment-1",
  businessId:
    "business-1",
  orderId:
    "order-1",
  name:
    "Emerald Gown",
  createdAt:
    new Date(
      "2026-09-01T10:00:00.000Z",
    ),
};

const ORDER = {
  id:
    "order-1",
  businessId:
    "business-1",
  clientId:
    "client-1",
  createdAt:
    new Date(
      "2026-09-01T09:00:00.000Z",
    ),
};

const FITTING:
  FittingSession = {
    id:
      "fitting-1",
    businessId:
      "business-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    scheduledFor:
      new Date(
        "2026-09-11T10:00:00.000Z",
      ),
    note: null,
    createdByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-10T10:00:00.000Z",
      ),
  };

const COMPLETED_OUTCOME:
  FittingOutcome = {
    id:
      "outcome-1",
    businessId:
      "business-1",
    fittingSessionId:
      "fitting-1",
    outcome:
      "COMPLETED",
    occurredAt:
      new Date(
        "2026-09-11T10:00:00.000Z",
      ),
    baselineAgreementVersionId:
      "agreement-1",
    resultingMeasurementVersionId:
      null,
    observationSummary:
      "Waist checked.",
    cancellationReason:
      null,
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-11T10:30:00.000Z",
      ),
  };

function dependencies(
  fitting:
    FittingSession | null =
      FITTING,
  outcome:
    FittingOutcome | null =
      COMPLETED_OUTCOME,
) {
  const garmentRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          GARMENT,
        ),
  } as unknown as
    GarmentRepository;

  const orderRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          ORDER,
        ),
  } as unknown as
    OrderRepository;

  const session:
    FittingLifecycleSession = {
      createSession:
        vi.fn(),

      findFittingSessionById:
        vi.fn()
          .mockResolvedValue(
            fitting,
          ),

      findOutcomeForSession:
        vi.fn()
          .mockResolvedValue(
            outcome,
          ),

      listAgreementHistory:
        vi.fn(),

      createOutcome:
        vi.fn(),

      findAdjustmentById:
        vi.fn(),

      findAdjustmentResolution:
        vi.fn(),

      createAdjustmentResolution:
        vi.fn(),

      createAdjustment:
        vi.fn(
          async (data) => ({
            id:
              "adjustment-1",
            createdAt:
              new Date(
                "2026-09-12T12:00:00.000Z",
              ),
            ...data,
          }),
        ),
    };

  const fittingLifecycleRepository = {
    withGarmentLifecycle:
      vi.fn(
        async (
          _scope,
          operation,
        ) =>
          operation(session),
      ),
  } as unknown as
    FittingLifecycleRepository;

  return {
    garmentRepository,
    orderRepository,
    fittingLifecycleRepository,
    session,
  };
}

describe(
  "recordFittingAdjustmentForTenant",
  () => {
    it(
      "records a garment-specific correction from a completed fitting",
      async () => {
        const deps =
          dependencies();

        await recordFittingAdjustmentForTenant(
          deps.garmentRepository,
          deps.orderRepository,
          deps.fittingLifecycleRepository,
          TENANT,
          {
            garmentId:
              "garment-1",
            fittingSessionId:
              "fitting-1",
            description:
              "  Take   in waist ",
          },
        );

        expect(
          deps.session
            .createAdjustment,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          clientId:
            "client-1",
          orderId:
            "order-1",
          garmentId:
            "garment-1",
          fittingSessionId:
            "fitting-1",
          description:
            "Take in waist",
          recordedByMembershipId:
            "membership-1",
        });
      },
    );

    it(
      "rejects completed fitting evidence without its historical baseline",
      async () => {
        const deps =
          dependencies(
            FITTING,
            {
              ...COMPLETED_OUTCOME,
              baselineAgreementVersionId:
                null,
            },
          );

        await expect(
          recordFittingAdjustmentForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              description:
                "Take in waist.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .createAdjustment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an adjustment from a cancelled fitting",
      async () => {
        const deps =
          dependencies(
            FITTING,
            {
              ...COMPLETED_OUTCOME,
              outcome:
                "CANCELLED",
              baselineAgreementVersionId:
                null,
              observationSummary:
                null,
              cancellationReason:
                "Client unavailable.",
            },
          );

        await expect(
          recordFittingAdjustmentForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              description:
                "Take in waist.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .createAdjustment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a fitting outside the trusted garment chain",
      async () => {
        const deps =
          dependencies({
            ...FITTING,
            garmentId:
              "garment-other",
          });

        await expect(
          recordFittingAdjustmentForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-other",
              description:
                "Take in waist.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createAdjustment,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
