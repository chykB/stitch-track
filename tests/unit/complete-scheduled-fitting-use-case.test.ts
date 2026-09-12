import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AgreementResolution,
} from "../../src/agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../src/agreement/domain/agreement-version";
import type {
  FittingLifecycleRepository,
  FittingLifecycleSession,
} from "../../src/fitting/application/ports/fitting-lifecycle-repository";
import {
  completeScheduledFittingForTenant,
} from "../../src/fitting/application/use-cases/complete-scheduled-fitting";
import type {
  FittingOutcome,
  FittingSession,
} from "../../src/fitting/domain/fitting";
import type {
  GarmentRepository,
} from "../../src/garment/application/ports/garment-repository";
import type {
  MeasurementVersionRepository,
} from "../../src/measurement/application/ports/measurement-version-repository";
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
        "2026-09-12T10:00:00.000Z",
      ),
    note: null,
    createdByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-10T10:00:00.000Z",
      ),
  };

const AGREEMENT:
  AgreementVersion = {
    id:
      "agreement-1",
    businessId:
      "business-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    revisionNumber:
      1,
    measurementVersionId:
      null,
    designSummary:
      "Fitted gown",
    fabricDescription:
      null,
    quantity:
      1,
    priceAmount:
      "80000",
    currency:
      "NGN",
    deliveryDate:
      "2026-10-15",
    note: null,
    styleReferenceIds: [],
    supersedesAgreementVersionId:
      null,
    createdAt:
      new Date(
        "2026-09-08T09:00:00.000Z",
      ),
  };

const RESOLUTION:
  AgreementResolution = {
    id:
      "resolution-1",
    businessId:
      "business-1",
    agreementVersionId:
      "agreement-1",
    outcome:
      "APPROVED",
    occurredAt:
      new Date(
        "2026-09-08T10:00:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote:
      "Approved.",
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-08T10:01:00.000Z",
      ),
  };

function dependencies(
  outcome:
    FittingOutcome | null =
      null,
  history = [
    {
      version: AGREEMENT,
      resolution:
        RESOLUTION,
    },
  ],
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

  const measurementVersionRepository = {
    findById:
      vi.fn()
        .mockResolvedValue({
          id:
            "measurement-2",
          businessId:
            "business-1",
          clientId:
            "client-1",
          measuredAt:
            OCCURRED_AT,
          unit:
            "CENTIMETER",
          note: null,
          entries: [],
          createdAt: NOW,
        }),
  } as unknown as
    MeasurementVersionRepository;

  const session:
    FittingLifecycleSession = {
      createSession:
        vi.fn(),

      findFittingSessionById:
        vi.fn()
          .mockResolvedValue(
            FITTING,
          ),

      findOutcomeForSession:
        vi.fn()
          .mockResolvedValue(
            outcome,
          ),

      listAgreementHistory:
        vi.fn()
          .mockResolvedValue(
            history,
          ),

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
    measurementVersionRepository,
    fittingLifecycleRepository,
    session,
  };
}

describe(
  "completeScheduledFittingForTenant",
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
      "records completion against the historical approved baseline",
      async () => {
        const deps =
          dependencies();

        await completeScheduledFittingForTenant(
          deps.garmentRepository,
          deps.orderRepository,
          deps.measurementVersionRepository,
          deps.fittingLifecycleRepository,
          TENANT,
          {
            garmentId:
              "garment-1",
            fittingSessionId:
              "fitting-1",
            occurredAt:
              OCCURRED_AT,
            observationSummary:
              "  Fit   checked ",
            resultingMeasurementVersionId:
              "measurement-2",
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
            "COMPLETED",
          occurredAt:
            OCCURRED_AT,
          baselineAgreementVersionId:
            "agreement-1",
          resultingMeasurementVersionId:
            "measurement-2",
          observationSummary:
            "Fit checked",
          cancellationReason:
            null,
        });
      },
    );

    it(
      "rejects a fitting outside the trusted garment chain",
      async () => {
        const deps =
          dependencies();

        vi.mocked(
          deps.session
            .findFittingSessionById,
        ).mockResolvedValue({
          ...FITTING,
          garmentId:
            "garment-other",
        });

        await expect(
          completeScheduledFittingForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.measurementVersionRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-other",
              occurredAt:
                OCCURRED_AT,
              observationSummary:
                "Fit checked.",
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
      "rejects completion of an unscheduled historical session",
      async () => {
        const deps =
          dependencies();

        vi.mocked(
          deps.session
            .findFittingSessionById,
        ).mockResolvedValue({
          ...FITTING,
          scheduledFor:
            null,
        });

        await expect(
          completeScheduledFittingForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.measurementVersionRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              occurredAt:
                OCCURRED_AT,
              observationSummary:
                "Fit checked.",
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
      "rejects a fitting that already has a terminal outcome",
      async () => {
        const deps =
          dependencies({
            id:
              "outcome-existing",
            businessId:
              "business-1",
            fittingSessionId:
              "fitting-1",
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
              "Cancelled.",
            recordedByMembershipId:
              "membership-1",
            createdAt:
              NOW,
          });

        await expect(
          completeScheduledFittingForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.measurementVersionRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              occurredAt:
                OCCURRED_AT,
              observationSummary:
                "Fit checked.",
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
      "rejects completion when no historical approved baseline existed",
      async () => {
        const deps =
          dependencies(
            null,
            [],
          );

        await expect(
          completeScheduledFittingForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.measurementVersionRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              occurredAt:
                OCCURRED_AT,
              observationSummary:
                "Fit checked.",
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
      "rejects a resulting measurement belonging to another client",
      async () => {
        const deps =
          dependencies();

        vi.mocked(
          deps
            .measurementVersionRepository
            .findById,
        ).mockResolvedValue({
          id:
            "measurement-2",
          businessId:
            "business-1",
          clientId:
            "client-other",
          measuredAt:
            OCCURRED_AT,
          unit:
            "CENTIMETER",
          note: null,
          entries: [],
          createdAt: NOW,
        });

        await expect(
          completeScheduledFittingForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.measurementVersionRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              occurredAt:
                OCCURRED_AT,
              observationSummary:
                "Fit checked.",
              resultingMeasurementVersionId:
                "measurement-2",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps
            .fittingLifecycleRepository
            .withGarmentLifecycle,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
