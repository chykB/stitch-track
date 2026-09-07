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
  createClientForTenant,
  type CreateClientRequest,
} from "../../src/client/application/use-cases/create-client";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const TENANT_CONTEXT: TenantContext = {
  userId: "user-a",
  businessId: "business-a",
  membershipId: "membership-a",
  role: "OWNER",
};

describe("createClientForTenant", () => {
  it("creates the Client inside TenantContext.businessId", async () => {
    const createdAt =
      new Date("2026-09-06T12:00:00.000Z");

    const create = vi.fn().mockResolvedValue({
      id: "client-a",
      businessId: "business-a",
      name: "Ada Okafor",
      phone: "08012345678",
      email: null,
      createdAt,
      updatedAt: createdAt,
    });

    const repository: ClientRepository = {
      create,
      findById: vi.fn(),
    };

    await createClientForTenant(
      repository,
      TENANT_CONTEXT,
      {
        name: "  Ada Okafor  ",
        phone: "  08012345678  ",
      },
    );

    expect(create).toHaveBeenCalledWith({
      businessId: "business-a",
      name: "Ada Okafor",
      phone: "08012345678",
      email: null,
    });
  });

  it("ignores a forged Business identifier on request-like input", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "client-a",
      businessId: "business-a",
      name: "Ada Okafor",
      phone: "08012345678",
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const repository: ClientRepository = {
      create,
      findById: vi.fn(),
    };

    const forgedRequest:
      CreateClientRequest & {
        businessId: string;
      } = {
        businessId: "business-b",
        name: "Ada Okafor",
        phone: "08012345678",
      };

    await createClientForTenant(
      repository,
      TENANT_CONTEXT,
      forgedRequest,
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "business-a",
      }),
    );

    expect(create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: "business-b",
      }),
    );
  });
});
