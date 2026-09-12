import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  FittingSessionRepository,
} from "../../src/fitting/application/ports/fitting-session-repository";
import {
  scheduleFittingForTenant,
} from "../../src/fitting/application/use-cases/schedule-fitting";
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
      "2026-09-10T10:00:00.000Z",
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
      "2026-09-10T09:00:00.000Z",
    ),
};

describe(
  "scheduleFittingForTenant",
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
      "creates a scheduled fitting from the trusted garment chain",
      async () => {
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

        const fittingSessionRepository = {
          create:
            vi.fn(
              async (data) => ({
                id:
                  "fitting-1",
                createdAt:
                  NOW,
                ...data,
              }),
            ),
        } as unknown as
          FittingSessionRepository;

        const scheduledFor =
          new Date(
            "2026-09-13T10:00:00.000Z",
          );

        const result =
          await scheduleFittingForTenant(
            garmentRepository,
            orderRepository,
            fittingSessionRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              scheduledFor,
              note:
                "  First   fitting ",
            },
          );

        expect(
          fittingSessionRepository
            .create,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          clientId:
            "client-1",
          orderId:
            "order-1",
          garmentId:
            "garment-1",
          createdByMembershipId:
            "membership-1",
          scheduledFor,
          note:
            "First fitting",
        });

        expect(result.id).toBe(
          "fitting-1",
        );
      },
    );

    it(
      "returns NOT_FOUND before creating anything for an inaccessible garment",
      async () => {
        const garmentRepository = {
          findById:
            vi.fn()
              .mockResolvedValue(
                null,
              ),
        } as unknown as
          GarmentRepository;

        const orderRepository = {
          findById:
            vi.fn(),
        } as unknown as
          OrderRepository;

        const fittingSessionRepository = {
          create:
            vi.fn(),
        } as unknown as
          FittingSessionRepository;

        await expect(
          scheduleFittingForTenant(
            garmentRepository,
            orderRepository,
            fittingSessionRepository,
            TENANT,
            {
              garmentId:
                "foreign-garment",
              scheduledFor:
                new Date(
                  "2026-09-13T10:00:00.000Z",
                ),
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          orderRepository.findById,
        ).not.toHaveBeenCalled();

        expect(
          fittingSessionRepository
            .create,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
