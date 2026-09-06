import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ClientRepository,
} from "../../src/client/application/ports/client-repository";
import type {
  OrderRepository,
} from "../../src/order/application/ports/order-repository";
import {
  createOrderForTenant,
  type CreateOrderRequest,
} from "../../src/order/application/use-cases/create-order";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const TENANT_CONTEXT: TenantContext = {
  userId: "user-a",
  businessId: "business-a",
  membershipId: "membership-a",
  role: "OWNER",
};

describe("createOrderForTenant", () => {
  it("verifies the Client inside the current tenant before creation", async () => {
    const findById = vi.fn().mockResolvedValue({
      id: "client-a",
      businessId: "business-a",
      name: "Ada Okafor",
      phone: "08012345678",
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const clientRepository: ClientRepository = {
      create: vi.fn(),
      findById,
    };

    const create = vi.fn().mockResolvedValue({
      id: "order-a",
      businessId: "business-a",
      clientId: "client-a",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const orderRepository: OrderRepository = {
      create,
      findById: vi.fn(),
    };

    await createOrderForTenant(
      clientRepository,
      orderRepository,
      TENANT_CONTEXT,
      {
        clientId: "client-a",
      },
    );

    expect(findById).toHaveBeenCalledWith({
      businessId: "business-a",
      clientId: "client-a",
    });

    expect(create).toHaveBeenCalledWith({
      businessId: "business-a",
      clientId: "client-a",
    });
  });

  it("does not create an Order when the Client is absent from the tenant", async () => {
    const clientRepository: ClientRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
    };

    const create = vi.fn();

    const orderRepository: OrderRepository = {
      create,
      findById: vi.fn(),
    };

    await expect(
      createOrderForTenant(
        clientRepository,
        orderRepository,
        TENANT_CONTEXT,
        {
          clientId: "client-from-another-business",
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

    const clientRepository: ClientRepository = {
      create: vi.fn(),
      findById,
    };

    const orderRepository: OrderRepository = {
      create: vi.fn(),
      findById: vi.fn(),
    };

    const forgedRequest:
      CreateOrderRequest & {
        businessId: string;
      } = {
        businessId: "business-b",
        clientId: "client-b",
      };

    await expect(
      createOrderForTenant(
        clientRepository,
        orderRepository,
        TENANT_CONTEXT,
        forgedRequest,
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(findById).toHaveBeenCalledWith({
      businessId: "business-a",
      clientId: "client-b",
    });
  });
});
