import {
  afterEach,
  beforeEach,
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
  cancelScheduledFittingForTenant,
} from "../../src/fitting/application/use-cases/cancel-scheduled-fitting";
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

const NOW =
  new Date(
    "2026-09-12T12:00:00.000Z",
  );

const OCCURRED_AT =
  new Date(
    "2026-09-12T10:00:00.000Z",
  );

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
        "2026-09-13T10:00:00.000Z",
      ),
    note: null,
    createdByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-10T10:00:00.000Z",
      ),
  };

function dependencies(
  fitting:
    FittingSession | null =
      FITTING,
  outcome:
    FittingOutcome | null =
      null,
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

      findAdjustmentById:
        vi.fn(),

      findAdjustmentResolution:
        vi.fn(),

      createAdjustmentResolution:
        vi.fn(),

      createAdjustment:
        vi.fn(),

      createOutcome:
        vi.fn(
          async (data) => ({
            id:
              "outcome-1",
            createdAt:
              NOW,
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
  "cancelScheduledFittingForTenant",
  () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(
        NOW,
      );
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it(
      "records a terminal cancellation for the trusted fitting",
      async () => {
        const deps =
          dependencies();

        await cancelScheduledFittingForTenant(
          deps.garmentRepository,
          deps.orderRepository,
          deps.fittingLifecycleRepository,
          TENANT,
          {
            garmentId:
              "garment-1",
            fittingSessionId:
              "fitting-1",
            occurredAt:
              OCCURRED_AT,
            cancellationReason:
              "  Client   unavailable ",
          },
        );

        expect(
          deps.session.createOutcome,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          fittingSessionId:
            "fitting-1",
          recordedByMembershipId:
            "membership-1",
          outcome:
            "CANCELLED",
          occurredAt:
            OCCURRED_AT,
          baselineAgreementVersionId:
            null,
          resultingMeasurementVersionId:
            null,
          observationSummary:
            null,
          cancellationReason:
            "Client unavailable",
        });
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
          cancelScheduledFittingForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-other",
              occurredAt:
                OCCURRED_AT,
              cancellationReason:
                "Client unavailable.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session.createOutcome,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a fitting that already has a terminal outcome",
      async () => {
        const deps =
          dependencies(
            FITTING,
            {
              id:
                "outcome-existing",
              businessId:
                "business-1",
              fittingSessionId:
                "fitting-1",
              outcome:
                "COMPLETED",
              occurredAt:
                OCCURRED_AT,
              baselineAgreementVersionId:
                "agreement-1",
              resultingMeasurementVersionId:
                null,
              observationSummary:
                "Fit checked.",
              cancellationReason:
                null,
              recordedByMembershipId:
                "membership-1",
              createdAt:
                NOW,
            },
          );

        await expect(
          cancelScheduledFittingForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              occurredAt:
                OCCURRED_AT,
              cancellationReason:
                "Client unavailable.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session.createOutcome,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects cancellation of an unscheduled historical session",
      async () => {
        const deps =
          dependencies({
            ...FITTING,
            scheduledFor:
              null,
          });

        await expect(
          cancelScheduledFittingForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              occurredAt:
                OCCURRED_AT,
              cancellationReason:
                "Client unavailable.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session.createOutcome,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
