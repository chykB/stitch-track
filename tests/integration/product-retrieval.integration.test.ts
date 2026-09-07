import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { getClientForTenant } from "@/client/application/use-cases/get-client";
import { prismaClientRepository } from "@/client/infrastructure/prisma-client-repository";
import { getGarmentForTenant } from "@/garment/application/use-cases/get-garment";
import { prismaGarmentRepository } from "@/garment/infrastructure/prisma-garment-repository";
import { getOrderForTenant } from "@/order/application/use-cases/get-order";
import { prismaOrderRepository } from "@/order/infrastructure/prisma-order-repository";
import { prisma } from "@/shared/database/prisma";
import type {
  TenantContext,
} from "@/shared/application/tenancy/tenant-context";

let businessAId: string;
let businessBId: string;

let clientId: string;
let orderId: string;
let garmentId: string;

function tenantContextFor(
  businessId: string,
): TenantContext {
  return {
    userId: `user-${businessId}`,
    businessId,
    membershipId: `membership-${businessId}`,
    role: "OWNER",
  };
}

describe("product retrieval through Prisma repositories", () => {
  beforeAll(async () => {
    const businessA = await prisma.business.create({
      data: {
        name: "Retrieval Test Business A",
      },
    });

    const businessB = await prisma.business.create({
      data: {
        name: "Retrieval Test Business B",
      },
    });

    businessAId = businessA.id;
    businessBId = businessB.id;

    const client =
      await prismaClientRepository.create({
        businessId: businessAId,
        name: "Ada Okafor",
        phone: "08012345678",
        email: null,
      });

    clientId = client.id;

    const order =
      await prismaOrderRepository.create({
        businessId: businessAId,
        clientId,
      });

    orderId = order.id;

    const garment =
      await prismaGarmentRepository.create({
        businessId: businessAId,
        orderId,
        name: "Wedding gown",
      });

    garmentId = garment.id;
  });

  afterAll(async () => {
    await prisma.garment.deleteMany({
      where: {
        businessId: {
          in: [
            businessAId,
            businessBId,
          ],
        },
      },
    });

    await prisma.order.deleteMany({
      where: {
        businessId: {
          in: [
            businessAId,
            businessBId,
          ],
        },
      },
    });

    await prisma.client.deleteMany({
      where: {
        businessId: {
          in: [
            businessAId,
            businessBId,
          ],
        },
      },
    });

    await prisma.business.deleteMany({
      where: {
        id: {
          in: [
            businessAId,
            businessBId,
          ],
        },
      },
    });

    await prisma.$disconnect();
  });

  it("retrieves a Client for its owning Business", async () => {
    const client =
      await getClientForTenant(
        prismaClientRepository,
        tenantContextFor(businessAId),
        {
          clientId,
        },
      );

    expect(client).toMatchObject({
      id: clientId,
      businessId: businessAId,
      name: "Ada Okafor",
    });
  });

  it("returns NOT_FOUND for a cross-Business Client UUID", async () => {
    await expect(
      getClientForTenant(
        prismaClientRepository,
        tenantContextFor(businessBId),
        {
          clientId,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("retrieves an Order for its owning Business", async () => {
    const order =
      await getOrderForTenant(
        prismaOrderRepository,
        tenantContextFor(businessAId),
        {
          orderId,
        },
      );

    expect(order).toMatchObject({
      id: orderId,
      businessId: businessAId,
      clientId,
    });
  });

  it("returns NOT_FOUND for a cross-Business Order UUID", async () => {
    await expect(
      getOrderForTenant(
        prismaOrderRepository,
        tenantContextFor(businessBId),
        {
          orderId,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("retrieves a Garment for its owning Business", async () => {
    const garment =
      await getGarmentForTenant(
        prismaGarmentRepository,
        tenantContextFor(businessAId),
        {
          garmentId,
        },
      );

    expect(garment).toMatchObject({
      id: garmentId,
      businessId: businessAId,
      orderId,
      name: "Wedding gown",
    });
  });

  it("returns NOT_FOUND for a cross-Business Garment UUID", async () => {
    await expect(
      getGarmentForTenant(
        prismaGarmentRepository,
        tenantContextFor(businessBId),
        {
          garmentId,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
