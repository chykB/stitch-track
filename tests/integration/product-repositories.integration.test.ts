import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { prismaClientRepository } from "@/client/infrastructure/prisma-client-repository";
import { prismaGarmentRepository } from "@/garment/infrastructure/prisma-garment-repository";
import { prismaOrderRepository } from "@/order/infrastructure/prisma-order-repository";
import { prisma } from "@/shared/database/prisma";

let businessAId: string;
let businessBId: string;

let clientId: string;
let orderId: string;
let garmentId: string;

describe("product Prisma repositories", () => {
  beforeAll(async () => {
    const businessA = await prisma.business.create({
      data: {
        name: "Repository Test Business A",
      },
    });

    const businessB = await prisma.business.create({
      data: {
        name: "Repository Test Business B",
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

  it("creates and reads a Client inside its Business", async () => {
    const client =
      await prismaClientRepository.findById({
        businessId: businessAId,
        clientId,
      });

    expect(client).toMatchObject({
      id: clientId,
      businessId: businessAId,
      name: "Ada Okafor",
      phone: "08012345678",
      email: null,
    });
  });

  it("does not expose a Client to another Business", async () => {
    const client =
      await prismaClientRepository.findById({
        businessId: businessBId,
        clientId,
      });

    expect(client).toBeNull();
  });

  it("creates and tenant-scopes Order lookup", async () => {
    const ownOrder =
      await prismaOrderRepository.findById({
        businessId: businessAId,
        orderId,
      });

    const foreignOrder =
      await prismaOrderRepository.findById({
        businessId: businessBId,
        orderId,
      });

    expect(ownOrder).toMatchObject({
      id: orderId,
      businessId: businessAId,
      clientId,
    });

    expect(foreignOrder).toBeNull();
  });

  it("creates and tenant-scopes Garment lookup", async () => {
    const ownGarment =
      await prismaGarmentRepository.findById({
        businessId: businessAId,
        garmentId,
      });

    const foreignGarment =
      await prismaGarmentRepository.findById({
        businessId: businessBId,
        garmentId,
      });

    expect(ownGarment).toMatchObject({
      id: garmentId,
      businessId: businessAId,
      orderId,
      name: "Wedding gown",
    });

    expect(foreignGarment).toBeNull();
  });
});
