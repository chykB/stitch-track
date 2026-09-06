import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  GarmentRepository,
} from "../../src/garment/application/ports/garment-repository";
import {
  createGarmentForTenant,
  type CreateGarmentRequest,
} from "../../src/garment/application/use-cases/create-garment";
import type {
  OrderRepository,
} from "../../src/order/application/ports/order-repository";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const TENANT_CONTEXT: TenantContext = {
  userId: "user-a",
  businessId: "business-a",
  membershipId: "membership-a",
  role: "OWNER",
};

describe("createGarmentForTenant", () => {
  it("verifies the Order inside the current tenant before creation", async () => {
    const findById = vi.fn().mockResolvedValue({
      id: "order-a",
      businessId: "business-a",
      clientId: "client-a",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const orderRepository: OrderRepository = {
      create: vi.fn(),
      findById,
    };

    const create = vi.fn().mockResolvedValue({
      id: "garment-a",
      businessId: "business-a",
      orderId: "order-a",
      name: "Wedding gown",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const garmentRepository:
      GarmentRepository = {
        create,
        findById: vi.fn(),
      };

    await createGarmentForTenant(
      orderRepository,
      garmentRepository,
      TENANT_CONTEXT,
      {
        orderId: "order-a",
        name: "  Wedding gown  ",
      },
    );

    expect(findById).toHaveBeenCalledWith({
      businessId: "business-a",
      orderId: "order-a",
    });

    expect(create).toHaveBeenCalledWith({
      businessId: "business-a",
      orderId: "order-a",
      name: "Wedding gown",
    });
  });

  it("does not create a Garment when the Order is absent from the tenant", async () => {
    const orderRepository: OrderRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
    };

    const create = vi.fn();

    const garmentRepository:
      GarmentRepository = {
        create,
        findById: vi.fn(),
      };

    await expect(
      createGarmentForTenant(
        orderRepository,
        garmentRepository,
        TENANT_CONTEXT,
        {
          orderId:
            "order-from-another-business",
          name: "Wedding gown",
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(create).not.toHaveBeenCalled();
  });

  it("ignores a forged Business identifier on request-like input", async () => {
    const findById =
      vi.fn().mockResolvedValue(null);

    const orderRepository: OrderRepository = {
      create: vi.fn(),
      findById,
    };

    const garmentRepository:
      GarmentRepository = {
        create: vi.fn(),
        findById: vi.fn(),
      };

    const forgedRequest:
      CreateGarmentRequest & {
        businessId: string;
      } = {
        businessId: "business-b",
        orderId: "order-b",
        name: "Blouse",
      };

    await expect(
      createGarmentForTenant(
        orderRepository,
        garmentRepository,
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
