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
const GARMENT_A_ID = randomUUID();

const MEASUREMENT_VERSION_A_ID =
  randomUUID();

function assertDedicatedTestDatabase(): void {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for V0.4 integrity tests.",
    );
  }

  const databaseName =
    new URL(databaseUrl)
      .pathname
      .replace(/^\/+/, "");

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing V0.4 integrity tests against non-test database "${databaseName}".`,
    );
  }
}

async function countById(
  table:
    | "measurement_version"
    | "measurement_entry"
    | "style_reference",
  id: string,
): Promise<number> {
  if (table === "measurement_version") {
    const rows = await prisma.$queryRaw<
      Array<{ count: number }>
    >`
      SELECT COUNT(*)::int AS count
      FROM "measurement_version"
      WHERE "id" = ${id}::uuid
    `;

    return rows[0]?.count ?? 0;
  }

  if (table === "measurement_entry") {
    const rows = await prisma.$queryRaw<
      Array<{ count: number }>
    >`
      SELECT COUNT(*)::int AS count
      FROM "measurement_entry"
      WHERE "id" = ${id}::uuid
    `;

    return rows[0]?.count ?? 0;
  }

  const rows = await prisma.$queryRaw<
    Array<{ count: number }>
  >`
    SELECT COUNT(*)::int AS count
    FROM "style_reference"
    WHERE "id" = ${id}::uuid
  `;

  return rows[0]?.count ?? 0;
}

describe(
  "measurement and style reference database integrity",
  () => {
    beforeAll(async () => {
      assertDedicatedTestDatabase();

      await prisma.$executeRaw`
        INSERT INTO "business" (
          "id",
          "name",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${BUSINESS_A_ID}::uuid,
          'V0.4 Integrity Business A',
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
          'V0.4 Integrity Business B',
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
          'V0.4 Client A',
          '08000000004',
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

      await prisma.$executeRaw`
        INSERT INTO "garment" (
          "id",
          "businessId",
          "orderId",
          "name",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${GARMENT_A_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${ORDER_A_ID}::uuid,
          'V0.4 Garment A',
          NOW(),
          NOW()
        )
      `;

      await prisma.$executeRaw`
        INSERT INTO "measurement_version" (
          "id",
          "businessId",
          "clientId",
          "measuredAt",
          "unit",
          "createdAt"
        )
        VALUES (
          ${MEASUREMENT_VERSION_A_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${CLIENT_A_ID}::uuid,
          NOW(),
          'CENTIMETER',
          NOW()
        )
      `;
    });

    afterAll(async () => {
      await prisma.$executeRaw`
        DELETE FROM "style_reference"
        WHERE "businessId" = ${BUSINESS_A_ID}::uuid
           OR "businessId" = ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "measurement_entry"
        WHERE "businessId" = ${BUSINESS_A_ID}::uuid
           OR "businessId" = ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "measurement_version"
        WHERE "businessId" = ${BUSINESS_A_ID}::uuid
           OR "businessId" = ${BUSINESS_B_ID}::uuid
      `;

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

    it(
      "rejects a MeasurementVersion that references a Client from another Business",
      async () => {
        const invalidId =
          randomUUID();

        await expect(
          prisma.$executeRaw`
            INSERT INTO "measurement_version" (
              "id",
              "businessId",
              "clientId",
              "measuredAt",
              "unit",
              "createdAt"
            )
            VALUES (
              ${invalidId}::uuid,
              ${BUSINESS_B_ID}::uuid,
              ${CLIENT_A_ID}::uuid,
              NOW(),
              'CENTIMETER',
              NOW()
            )
          `,
        ).rejects.toThrow();

        expect(
          await countById(
            "measurement_version",
            invalidId,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects a MeasurementEntry that references a MeasurementVersion from another Business",
      async () => {
        const invalidId =
          randomUUID();

        await expect(
          prisma.$executeRaw`
            INSERT INTO "measurement_entry" (
              "id",
              "businessId",
              "measurementVersionId",
              "label",
              "normalizedKey",
              "value",
              "createdAt"
            )
            VALUES (
              ${invalidId}::uuid,
              ${BUSINESS_B_ID}::uuid,
              ${MEASUREMENT_VERSION_A_ID}::uuid,
              'Waist',
              'waist',
              80.5,
              NOW()
            )
          `,
        ).rejects.toThrow();

        expect(
          await countById(
            "measurement_entry",
            invalidId,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects a StyleReference that references a Garment from another Business",
      async () => {
        const invalidId =
          randomUUID();

        await expect(
          prisma.$executeRaw`
            INSERT INTO "style_reference" (
              "id",
              "businessId",
              "garmentId",
              "sourceUrl",
              "createdAt"
            )
            VALUES (
              ${invalidId}::uuid,
              ${BUSINESS_B_ID}::uuid,
              ${GARMENT_A_ID}::uuid,
              'https://example.com/reference.jpg',
              NOW()
            )
          `,
        ).rejects.toThrow();

        expect(
          await countById(
            "style_reference",
            invalidId,
          ),
        ).toBe(0);
      },
    );

    it.each([
      "0",
      "-1",
    ])(
      "rejects non-positive measurement value %s",
      async (value) => {
        const invalidId =
          randomUUID();

        await expect(
          prisma.$executeRaw`
            INSERT INTO "measurement_entry" (
              "id",
              "businessId",
              "measurementVersionId",
              "label",
              "normalizedKey",
              "value",
              "createdAt"
            )
            VALUES (
              ${invalidId}::uuid,
              ${BUSINESS_A_ID}::uuid,
              ${MEASUREMENT_VERSION_A_ID}::uuid,
              'Invalid value',
              ${`invalid-${invalidId}`}::text,
              ${value}::numeric,
              NOW()
            )
          `,
        ).rejects.toThrow();

        expect(
          await countById(
            "measurement_entry",
            invalidId,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects duplicate normalized measurement keys within one MeasurementVersion",
      async () => {
        const firstId =
          randomUUID();

        const duplicateId =
          randomUUID();

        const normalizedKey =
          `waist-${randomUUID()}`;

        await prisma.$executeRaw`
          INSERT INTO "measurement_entry" (
            "id",
            "businessId",
            "measurementVersionId",
            "label",
            "normalizedKey",
            "value",
            "createdAt"
          )
          VALUES (
            ${firstId}::uuid,
            ${BUSINESS_A_ID}::uuid,
            ${MEASUREMENT_VERSION_A_ID}::uuid,
            'Waist',
            ${normalizedKey},
            80.5,
            NOW()
          )
        `;

        await expect(
          prisma.$executeRaw`
            INSERT INTO "measurement_entry" (
              "id",
              "businessId",
              "measurementVersionId",
              "label",
              "normalizedKey",
              "value",
              "createdAt"
            )
            VALUES (
              ${duplicateId}::uuid,
              ${BUSINESS_A_ID}::uuid,
              ${MEASUREMENT_VERSION_A_ID}::uuid,
              ' waist ',
              ${normalizedKey},
              81,
              NOW()
            )
          `,
        ).rejects.toThrow();

        expect(
          await countById(
            "measurement_entry",
            firstId,
          ),
        ).toBe(1);

        expect(
          await countById(
            "measurement_entry",
            duplicateId,
          ),
        ).toBe(0);
      },
    );
  },
);
