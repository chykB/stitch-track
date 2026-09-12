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
  resolveFittingAdjustmentForTenant,
} from "../../src/fitting/application/use-cases/resolve-fitting-adjustment";
import type {
  FittingAdjustment,
  FittingAdjustmentResolution,
} from "../../src/fitting/domain/fitting-adjustment";
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
    "2026-09-12T11:00:00.000Z",
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

const ADJUSTMENT:
  FittingAdjustment = {
    id:
      "adjustment-1",
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
    createdAt:
      new Date(
        "2026-09-11T12:00:00.000Z",
      ),
  };

function dependencies(
  adjustment:
    FittingAdjustment | null =
      ADJUSTMENT,
  resolution:
    FittingAdjustmentResolution | null =
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
        vi.fn(),

      findOutcomeForSession:
        vi.fn(),

      listAgreementHistory:
        vi.fn(),

      createOutcome:
        vi.fn(),

      createAdjustment:
        vi.fn(),

      findAdjustmentById:
        vi.fn()
          .mockResolvedValue(
            adjustment,
          ),

      findAdjustmentResolution:
        vi.fn()
          .mockResolvedValue(
            resolution,
          ),

      createAdjustmentResolution:
        vi.fn(
          async (data) => ({
            id:
              "adjustment-resolution-1",
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
  "resolveFittingAdjustmentForTenant",
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
      "records a completed adjustment resolution",
      async () => {
        const deps =
          dependencies();

        await resolveFittingAdjustmentForTenant(
          deps.garmentRepository,
          deps.orderRepository,
          deps.fittingLifecycleRepository,
          TENANT,
          {
            garmentId:
              "garment-1",
            fittingAdjustmentId:
              "adjustment-1",
            outcome:
              "COMPLETED",
            occurredAt:
              OCCURRED_AT,
            note:
              "  Adjustment   finished ",
          },
        );

        expect(
          deps.session
            .createAdjustmentResolution,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          fittingAdjustmentId:
            "adjustment-1",
          recordedByMembershipId:
            "membership-1",
          outcome:
            "COMPLETED",
          occurredAt:
            OCCURRED_AT,
          note:
            "Adjustment finished",
          reason:
            null,
        });
      },
    );

    it(
      "records a voided adjustment with a reason",
      async () => {
        const deps =
          dependencies();

        await resolveFittingAdjustmentForTenant(
          deps.garmentRepository,
          deps.orderRepository,
          deps.fittingLifecycleRepository,
          TENANT,
          {
            garmentId:
              "garment-1",
            fittingAdjustmentId:
              "adjustment-1",
            outcome:
              "VOIDED",
            occurredAt:
              OCCURRED_AT,
            reason:
              "  No longer   required ",
          },
        );

        expect(
          deps.session
            .createAdjustmentResolution,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          fittingAdjustmentId:
            "adjustment-1",
          recordedByMembershipId:
            "membership-1",
          outcome:
            "VOIDED",
          occurredAt:
            OCCURRED_AT,
          note:
            null,
          reason:
            "No longer required",
        });
      },
    );

    it(
      "rejects an adjustment outside the trusted garment chain",
      async () => {
        const deps =
          dependencies({
            ...ADJUSTMENT,
            garmentId:
              "garment-other",
          });

        await expect(
          resolveFittingAdjustmentForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingAdjustmentId:
                "adjustment-other",
              outcome:
                "COMPLETED",
              occurredAt:
                OCCURRED_AT,
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createAdjustmentResolution,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a second terminal resolution",
      async () => {
        const deps =
          dependencies(
            ADJUSTMENT,
            {
              id:
                "resolution-existing",
              businessId:
                "business-1",
              fittingAdjustmentId:
                "adjustment-1",
              outcome:
                "COMPLETED",
              occurredAt:
                OCCURRED_AT,
              note:
                null,
              reason:
                null,
              recordedByMembershipId:
                "membership-1",
              createdAt:
                NOW,
            },
          );

        await expect(
          resolveFittingAdjustmentForTenant(
            deps.garmentRepository,
            deps.orderRepository,
            deps.fittingLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingAdjustmentId:
                "adjustment-1",
              outcome:
                "VOIDED",
              occurredAt:
                OCCURRED_AT,
              reason:
                "Not required.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .createAdjustmentResolution,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
