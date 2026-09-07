import { randomUUID } from "node:crypto";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/shared/database/prisma";

const BUSINESS_A_ID = randomUUID();
const BUSINESS_B_ID = randomUUID();
const CLIENT_A_ID = randomUUID();
const ORDER_A_ID = randomUUID();

describe("product tenant database integrity", () => {
  beforeAll(async () => {
    await prisma.$executeRaw`
      INSERT INTO "business" (
        "id",
        "name",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${BUSINESS_A_ID}::uuid,
        'C3 Business A',
        NOW(),
        NOW()
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO "business" (
        "id",
        "name",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${BUSINESS_B_ID}::uuid,
        'C3 Business B',
        NOW(),
        NOW()
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO "client" (
        "id",
        "businessId",
        "name",
        "phone",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${CLIENT_A_ID}::uuid,
        ${BUSINESS_A_ID}::uuid,
        'Client A',
        '08000000001',
        NOW(),
        NOW()
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO "order" (
        "id",
        "businessId",
        "clientId",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${ORDER_A_ID}::uuid,
        ${BUSINESS_A_ID}::uuid,
        ${CLIENT_A_ID}::uuid,
        NOW(),
        NOW()
      )
    `;
  });

  afterAll(async () => {
    await prisma.$executeRaw`
      DELETE FROM "garment"
      WHERE "businessId" = ${BUSINESS_A_ID}::uuid
         OR "businessId" = ${BUSINESS_B_ID}::uuid
    `;

    await prisma.$executeRaw`
      DELETE FROM "order"
      WHERE "businessId" = ${BUSINESS_A_ID}::uuid
         OR "businessId" = ${BUSINESS_B_ID}::uuid
    `;

    await prisma.$executeRaw`
      DELETE FROM "client"
      WHERE "businessId" = ${BUSINESS_A_ID}::uuid
         OR "businessId" = ${BUSINESS_B_ID}::uuid
    `;

    await prisma.$executeRaw`
      DELETE FROM "business"
      WHERE "id" = ${BUSINESS_A_ID}::uuid
         OR "id" = ${BUSINESS_B_ID}::uuid
    `;

    await prisma.$disconnect();
  });

  it("rejects an Order that references a Client from another Business", async () => {
    const invalidOrderId = randomUUID();

    await expect(
      prisma.$executeRaw`
        INSERT INTO "order" (
          "id",
          "businessId",
          "clientId",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${invalidOrderId}::uuid,
          ${BUSINESS_B_ID}::uuid,
          ${CLIENT_A_ID}::uuid,
          NOW(),
          NOW()
        )
      `,
    ).rejects.toThrow();

    const rows = await prisma.$queryRaw<
      Array<{ count: number }>
    >`
      SELECT COUNT(*)::int AS count
      FROM "order"
      WHERE "id" = ${invalidOrderId}::uuid
    `;

    expect(rows[0]?.count).toBe(0);
  });

  it("rejects a Garment that references an Order from another Business", async () => {
    const invalidGarmentId = randomUUID();

    await expect(
      prisma.$executeRaw`
        INSERT INTO "garment" (
          "id",
          "businessId",
          "orderId",
          "name",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${invalidGarmentId}::uuid,
          ${BUSINESS_B_ID}::uuid,
          ${ORDER_A_ID}::uuid,
          'Cross-tenant garment',
          NOW(),
          NOW()
        )
      `,
    ).rejects.toThrow();

    const rows = await prisma.$queryRaw<
      Array<{ count: number }>
    >`
      SELECT COUNT(*)::int AS count
      FROM "garment"
      WHERE "id" = ${invalidGarmentId}::uuid
    `;

    expect(rows[0]?.count).toBe(0);
  });
});
