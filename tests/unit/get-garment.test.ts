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
  getGarmentForTenant,
  type GetGarmentRequest,
} from "../../src/garment/application/use-cases/get-garment";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const TENANT_CONTEXT: TenantContext = {
  userId: "user-a",
  businessId: "business-a",
  membershipId: "membership-a",
  role: "OWNER",
};

describe("getGarmentForTenant", () => {
  it("looks up the Garment inside TenantContext.businessId", async () => {
    const garment = {
      id: "garment-a",
      businessId: "business-a",
      orderId: "order-a",
      name: "Wedding gown",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const findById =
      vi.fn().mockResolvedValue(garment);

    const repository: GarmentRepository = {
      create: vi.fn(),
      findById,
    };

    const result =
      await getGarmentForTenant(
        repository,
        TENANT_CONTEXT,
        {
          garmentId: "garment-a",
        },
      );

    expect(findById).toHaveBeenCalledWith({
      businessId: "business-a",
      garmentId: "garment-a",
    });

    expect(result).toBe(garment);
  });

  it("returns NOT_FOUND when the Garment is absent from the tenant", async () => {
    const repository: GarmentRepository = {
      create: vi.fn(),
      findById:
        vi.fn().mockResolvedValue(null),
    };

    await expect(
      getGarmentForTenant(
        repository,
        TENANT_CONTEXT,
        {
          garmentId:
            "foreign-or-missing-garment",
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("ignores a forged Business identifier on request-like input", async () => {
    const findById =
      vi.fn().mockResolvedValue(null);

    const repository: GarmentRepository = {
      create: vi.fn(),
      findById,
    };

    const forgedRequest:
      GetGarmentRequest & {
        businessId: string;
      } = {
        businessId: "business-b",
        garmentId: "garment-b",
      };

    await expect(
      getGarmentForTenant(
        repository,
        TENANT_CONTEXT,
        forgedRequest,
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(findById).toHaveBeenCalledWith({
      businessId: "business-a",
      garmentId: "garment-b",
    });
  });
});
