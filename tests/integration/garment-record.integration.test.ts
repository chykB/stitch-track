import {
  randomUUID,
} from "node:crypto";

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "@/shared/composition/current-tenant",
  () => ({
    resolveCurrentTenantContext:
      vi.fn(),
  }),
);

import {
  getGarmentRecordForCurrentTenant,
} from "@/garment/composition/get-garment-record";
import {
  prismaMeasurementVersionRepository,
} from "@/measurement/infrastructure/prisma-measurement-version-repository";
import {
  prisma,
} from "@/shared/database/prisma";
import {
  resolveCurrentTenantContext,
} from "@/shared/composition/current-tenant";
import {
  prismaStyleReferenceRepository,
} from "@/style-reference/infrastructure/prisma-style-reference-repository";

const BUSINESS_A_ID =
  randomUUID();

const BUSINESS_B_ID =
  randomUUID();

const CLIENT_A_ID =
  randomUUID();

const OTHER_CLIENT_A_ID =
  randomUUID();

const ORDER_A_ID =
  randomUUID();

const GARMENT_A_ID =
  randomUUID();

const USER_A_ID =
  randomUUID();

const USER_B_ID =
  randomUUID();

const MEMBERSHIP_A_ID =
  randomUUID();

const MEMBERSHIP_B_ID =
  randomUUID();

function assertDedicatedTestDatabase(): void {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for garment record integration tests.",
    );
  }

  const databaseName =
    new URL(databaseUrl)
      .pathname
      .replace(/^\/+/, "");

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing garment record integration tests against non-test database "${databaseName}".`,
    );
  }
}

describe(
  "getGarmentRecordForCurrentTenant",
  () => {
    beforeAll(async () => {
      assertDedicatedTestDatabase();

      await prisma.business.createMany({
        data: [
          {
            id:
              BUSINESS_A_ID,
            name:
              "Garment Record Business A",
          },
          {
            id:
              BUSINESS_B_ID,
            name:
              "Garment Record Business B",
          },
        ],
      });

      await prisma.client.createMany({
        data: [
          {
            id:
              CLIENT_A_ID,
            businessId:
              BUSINESS_A_ID,
            name:
              "Correct Client",
            phone:
              "08050000001",
          },
          {
            id:
              OTHER_CLIENT_A_ID,
            businessId:
              BUSINESS_A_ID,
            name:
              "Other Same-Tenant Client",
            phone:
              "08050000002",
          },
        ],
      });

      await prisma.order.create({
        data: {
          id:
            ORDER_A_ID,
          businessId:
            BUSINESS_A_ID,
          clientId:
            CLIENT_A_ID,
        },
      });

      await prisma.garment.create({
        data: {
          id:
            GARMENT_A_ID,
          businessId:
            BUSINESS_A_ID,
          orderId:
            ORDER_A_ID,
          name:
            "Emerald Gown",
        },
      });

      await prismaMeasurementVersionRepository
        .create({
          businessId:
            BUSINESS_A_ID,
          clientId:
            CLIENT_A_ID,
          measuredAt:
            new Date(
              "2026-09-08T00:00:00.000Z",
            ),
          unit:
            "CENTIMETER",
          note:
            "Record page fixture",
          entries: [
            {
              label:
                "Waist",
              normalizedKey:
                "waist",
              value:
                "80.5",
            },
          ],
        });

      await prismaStyleReferenceRepository
        .create({
          businessId:
            BUSINESS_A_ID,
          garmentId:
            GARMENT_A_ID,
          sourceUrl:
            "https://example.com/styles/emerald-gown.jpg",
          label:
            "Front inspiration",
          note:
            "Reference only",
        });
    });

    beforeEach(() => {
      vi.clearAllMocks();

      vi.mocked(
        resolveCurrentTenantContext,
      ).mockResolvedValue({
        userId:
          USER_A_ID,
        businessId:
          BUSINESS_A_ID,
        membershipId:
          MEMBERSHIP_A_ID,
        role:
          "OWNER",
      });
    });

    afterAll(async () => {
      await prisma.styleReference.deleteMany({
        where: {
          businessId: {
            in: [
              BUSINESS_A_ID,
              BUSINESS_B_ID,
            ],
          },
        },
      });

      await prisma.measurementEntry.deleteMany({
        where: {
          businessId: {
            in: [
              BUSINESS_A_ID,
              BUSINESS_B_ID,
            ],
          },
        },
      });

      await prisma.measurementVersion.deleteMany({
        where: {
          businessId: {
            in: [
              BUSINESS_A_ID,
              BUSINESS_B_ID,
            ],
          },
        },
      });

      await prisma.garment.deleteMany({
        where: {
          businessId: {
            in: [
              BUSINESS_A_ID,
              BUSINESS_B_ID,
            ],
          },
        },
      });

      await prisma.order.deleteMany({
        where: {
          businessId: {
            in: [
              BUSINESS_A_ID,
              BUSINESS_B_ID,
            ],
          },
        },
      });

      await prisma.client.deleteMany({
        where: {
          businessId: {
            in: [
              BUSINESS_A_ID,
              BUSINESS_B_ID,
            ],
          },
        },
      });

      await prisma.business.deleteMany({
        where: {
          id: {
            in: [
              BUSINESS_A_ID,
              BUSINESS_B_ID,
            ],
          },
        },
      });

      await prisma.$disconnect();
    });

    it(
      "derives the correct Client from Garment through Order and returns its histories",
      async () => {
        const record =
          await getGarmentRecordForCurrentTenant(
            BUSINESS_A_ID,
            GARMENT_A_ID,
          );

        expect(
          resolveCurrentTenantContext,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          [
            "OWNER",
            "MEMBER",
          ],
        );

        expect(record.garment).toMatchObject({
          id:
            GARMENT_A_ID,
          businessId:
            BUSINESS_A_ID,
          orderId:
            ORDER_A_ID,
          name:
            "Emerald Gown",
        });

        expect(record.order).toMatchObject({
          id:
            ORDER_A_ID,
          clientId:
            CLIENT_A_ID,
        });

        expect(record.client).toMatchObject({
          id:
            CLIENT_A_ID,
          name:
            "Correct Client",
        });

        expect(record.client.id)
          .not.toBe(
            OTHER_CLIENT_A_ID,
          );

        expect(
          record.measurementVersions,
        ).toHaveLength(1);

        expect(
          record
            .measurementVersions[0]
            .entries,
        ).toEqual([
          expect.objectContaining({
            label:
              "Waist",
            normalizedKey:
              "waist",
            value:
              "80.5",
          }),
        ]);

        expect(
          record.styleReferences,
        ).toEqual([
          expect.objectContaining({
            garmentId:
              GARMENT_A_ID,
            sourceUrl:
              "https://example.com/styles/emerald-gown.jpg",
            label:
              "Front inspiration",
          }),
        ]);
      },
    );

    it(
      "returns NOT_FOUND when another Business requests the Garment",
      async () => {
        vi.mocked(
          resolveCurrentTenantContext,
        ).mockResolvedValue({
          userId:
            USER_B_ID,
          businessId:
            BUSINESS_B_ID,
          membershipId:
            MEMBERSHIP_B_ID,
          role:
            "MEMBER",
        });

        await expect(
          getGarmentRecordForCurrentTenant(
            BUSINESS_B_ID,
            GARMENT_A_ID,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });
      },
    );
  },
);
