import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  OrderRepository,
} from "../../src/order/application/ports/order-repository";
import {
  getOrderForTenant,
  type GetOrderRequest,
} from "../../src/order/application/use-cases/get-order";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const TENANT_CONTEXT: TenantContext = {
  userId: "user-a",
  businessId: "business-a",
  membershipId: "membership-a",
  role: "OWNER",
};

describe("getOrderForTenant", () => {
  it("looks up the Order inside TenantContext.businessId", async () => {
    const order = {
      id: "order-a",
      businessId: "business-a",
      clientId: "client-a",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const findById =
      vi.fn().mockResolvedValue(order);

    const repository: OrderRepository = {
      create: vi.fn(),
      findById,
    };

    const result =
      await getOrderForTenant(
        repository,
        TENANT_CONTEXT,
        {
          orderId: "order-a",
        },
      );

    expect(findById).toHaveBeenCalledWith({
      businessId: "business-a",
      orderId: "order-a",
    });

    expect(result).toBe(order);
  });

  it("returns NOT_FOUND when the Order is absent from the tenant", async () => {
    const repository: OrderRepository = {
      create: vi.fn(),
      findById:
        vi.fn().mockResolvedValue(null),
    };

    await expect(
      getOrderForTenant(
        repository,
        TENANT_CONTEXT,
        {
          orderId: "foreign-or-missing-order",
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("ignores a forged Business identifier on request-like input", async () => {
    const findById =
      vi.fn().mockResolvedValue(null);

    const repository: OrderRepository = {
      create: vi.fn(),
      findById,
    };

    const forgedRequest:
      GetOrderRequest & {
        businessId: string;
      } = {
        businessId: "business-b",
        orderId: "order-b",
      };

    await expect(
      getOrderForTenant(
        repository,
        TENANT_CONTEXT,
        forgedRequest,
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(findById).toHaveBeenCalledWith({
      businessId: "business-a",
      orderId: "order-b",
    });
  });
});
