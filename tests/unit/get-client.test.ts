import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ClientRepository,
} from "../../src/client/application/ports/client-repository";
import {
  getClientForTenant,
  type GetClientRequest,
} from "../../src/client/application/use-cases/get-client";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const TENANT_CONTEXT: TenantContext = {
  userId: "user-a",
  businessId: "business-a",
  membershipId: "membership-a",
  role: "OWNER",
};

describe("getClientForTenant", () => {
  it("looks up the Client inside TenantContext.businessId", async () => {
    const client = {
      id: "client-a",
      businessId: "business-a",
      name: "Ada Okafor",
      phone: "08012345678",
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const findById =
      vi.fn().mockResolvedValue(client);

    const repository: ClientRepository = {
      create: vi.fn(),
      findById,
    };

    const result =
      await getClientForTenant(
        repository,
        TENANT_CONTEXT,
        {
          clientId: "client-a",
        },
      );

    expect(findById).toHaveBeenCalledWith({
      businessId: "business-a",
      clientId: "client-a",
    });

    expect(result).toBe(client);
  });

  it("returns NOT_FOUND when the Client is absent from the tenant", async () => {
    const repository: ClientRepository = {
      create: vi.fn(),
      findById:
        vi.fn().mockResolvedValue(null),
    };

    await expect(
      getClientForTenant(
        repository,
        TENANT_CONTEXT,
        {
          clientId: "foreign-or-missing-client",
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("ignores a forged Business identifier on request-like input", async () => {
    const findById =
      vi.fn().mockResolvedValue(null);

    const repository: ClientRepository = {
      create: vi.fn(),
      findById,
    };

    const forgedRequest:
      GetClientRequest & {
        businessId: string;
      } = {
        businessId: "business-b",
        clientId: "client-b",
      };

    await expect(
      getClientForTenant(
        repository,
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
