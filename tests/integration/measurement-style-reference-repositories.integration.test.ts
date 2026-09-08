import { randomUUID } from "node:crypto";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  prismaMeasurementVersionRepository,
} from "@/measurement/infrastructure/prisma-measurement-version-repository";
import {
  prismaStyleReferenceRepository,
} from "@/style-reference/infrastructure/prisma-style-reference-repository";
import { prisma } from "@/shared/database/prisma";

const BUSINESS_A_ID = randomUUID();
const BUSINESS_B_ID = randomUUID();

const CLIENT_A_ID = randomUUID();
const CLIENT_LIST_ID = randomUUID();

const ORDER_A_ID = randomUUID();

const GARMENT_A_ID = randomUUID();
const GARMENT_LIST_ID = randomUUID();

function assertDedicatedTestDatabase(): void {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for V0.4 repository tests.",
    );
  }

  const databaseName =
    new URL(databaseUrl)
      .pathname
      .replace(/^\/+/, "");

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing V0.4 repository tests against non-test database "${databaseName}".`,
    );
  }
}

describe(
  "measurement and style reference Prisma repositories",
  () => {
    beforeAll(async () => {
      assertDedicatedTestDatabase();

      await prisma.business.createMany({
        data: [
          {
            id: BUSINESS_A_ID,
            name:
              "V0.4 Repository Business A",
          },
          {
            id: BUSINESS_B_ID,
            name:
              "V0.4 Repository Business B",
          },
        ],
      });

      await prisma.client.createMany({
        data: [
          {
            id: CLIENT_A_ID,
            businessId:
              BUSINESS_A_ID,
            name:
              "Measurement Client",
            phone:
              "08040000001",
          },
          {
            id: CLIENT_LIST_ID,
            businessId:
              BUSINESS_A_ID,
            name:
              "Measurement History Client",
            phone:
              "08040000002",
          },
        ],
      });

      await prisma.order.create({
        data: {
          id: ORDER_A_ID,
          businessId:
            BUSINESS_A_ID,
          clientId:
            CLIENT_A_ID,
        },
      });

      await prisma.garment.createMany({
        data: [
          {
            id: GARMENT_A_ID,
            businessId:
              BUSINESS_A_ID,
            orderId:
              ORDER_A_ID,
            name:
              "Repository Garment",
          },
          {
            id: GARMENT_LIST_ID,
            businessId:
              BUSINESS_A_ID,
            orderId:
              ORDER_A_ID,
            name:
              "Reference List Garment",
          },
        ],
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
      "creates a MeasurementVersion with all entries and maps Decimal values to canonical strings",
      async () => {
        const created =
          await prismaMeasurementVersionRepository
            .create({
              businessId:
                BUSINESS_A_ID,
              clientId:
                CLIENT_A_ID,
              measuredAt:
                new Date(
                  "2026-09-07T10:00:00.000Z",
                ),
              unit:
                "CENTIMETER",
              note:
                "Before cutting",
              entries: [
                {
                  label:
                    "Waist",
                  normalizedKey:
                    "waist",
                  value:
                    "080.500",
                },
                {
                  label:
                    "Bust",
                  normalizedKey:
                    "bust",
                  value:
                    "090.000",
                },
              ],
            });

        expect(created).toMatchObject({
          businessId:
            BUSINESS_A_ID,
          clientId:
            CLIENT_A_ID,
          unit:
            "CENTIMETER",
          note:
            "Before cutting",
        });

        expect(created.entries)
          .toHaveLength(2);

        expect(
          created.entries.map(
            (entry) => ({
              label:
                entry.label,
              normalizedKey:
                entry.normalizedKey,
              value:
                entry.value,
            }),
          ),
        ).toEqual([
          {
            label: "Bust",
            normalizedKey:
              "bust",
            value: "90",
          },
          {
            label: "Waist",
            normalizedKey:
              "waist",
            value: "80.5",
          },
        ]);

        const persisted =
          await prismaMeasurementVersionRepository
            .findById({
              businessId:
                BUSINESS_A_ID,
              measurementVersionId:
                created.id,
            });

        expect(persisted)
          .toEqual(created);
      },
    );

    it(
      "tenant-scopes MeasurementVersion lookup",
      async () => {
        const created =
          await prismaMeasurementVersionRepository
            .create({
              businessId:
                BUSINESS_A_ID,
              clientId:
                CLIENT_A_ID,
              measuredAt:
                new Date(
                  "2026-09-07T11:00:00.000Z",
                ),
              unit: "INCH",
              note: null,
              entries: [
                {
                  label:
                    "Shoulder",
                  normalizedKey:
                    "shoulder",
                  value: "18.25",
                },
              ],
            });

        const own =
          await prismaMeasurementVersionRepository
            .findById({
              businessId:
                BUSINESS_A_ID,
              measurementVersionId:
                created.id,
            });

        const foreign =
          await prismaMeasurementVersionRepository
            .findById({
              businessId:
                BUSINESS_B_ID,
              measurementVersionId:
                created.id,
            });

        expect(own?.id)
          .toBe(created.id);

        expect(foreign)
          .toBeNull();
      },
    );

    it(
      "lists a Client's MeasurementVersions newest measurement first",
      async () => {
        const older =
          await prismaMeasurementVersionRepository
            .create({
              businessId:
                BUSINESS_A_ID,
              clientId:
                CLIENT_LIST_ID,
              measuredAt:
                new Date(
                  "2026-08-01T10:00:00.000Z",
                ),
              unit:
                "CENTIMETER",
              note: "Older",
              entries: [
                {
                  label:
                    "Waist",
                  normalizedKey:
                    "waist",
                  value: "80",
                },
              ],
            });

        const newer =
          await prismaMeasurementVersionRepository
            .create({
              businessId:
                BUSINESS_A_ID,
              clientId:
                CLIENT_LIST_ID,
              measuredAt:
                new Date(
                  "2026-09-01T10:00:00.000Z",
                ),
              unit:
                "CENTIMETER",
              note: "Newer",
              entries: [
                {
                  label:
                    "Waist",
                  normalizedKey:
                    "waist",
                  value: "81",
                },
              ],
            });

        const history =
          await prismaMeasurementVersionRepository
            .listForClient({
              businessId:
                BUSINESS_A_ID,
              clientId:
                CLIENT_LIST_ID,
            });

        expect(
          history.map(
            (version) =>
              version.id,
          ),
        ).toEqual([
          newer.id,
          older.id,
        ]);
      },
    );

    it(
      "rolls back the MeasurementVersion when one child entry violates persistence constraints",
      async () => {
        const beforeVersions =
          await prisma
            .measurementVersion
            .count({
              where: {
                businessId:
                  BUSINESS_A_ID,
                clientId:
                  CLIENT_A_ID,
              },
            });

        const beforeEntries =
          await prisma
            .measurementEntry
            .count({
              where: {
                businessId:
                  BUSINESS_A_ID,
              },
            });

        await expect(
          prismaMeasurementVersionRepository
            .create({
              businessId:
                BUSINESS_A_ID,
              clientId:
                CLIENT_A_ID,
              measuredAt:
                new Date(
                  "2026-09-07T12:00:00.000Z",
                ),
              unit:
                "CENTIMETER",
              note:
                "Must roll back",
              entries: [
                {
                  label:
                    "Waist",
                  normalizedKey:
                    "duplicate-key",
                  value: "80",
                },
                {
                  label:
                    " waist ",
                  normalizedKey:
                    "duplicate-key",
                  value: "81",
                },
              ],
            }),
        ).rejects.toThrow();

        const afterVersions =
          await prisma
            .measurementVersion
            .count({
              where: {
                businessId:
                  BUSINESS_A_ID,
                clientId:
                  CLIENT_A_ID,
              },
            });

        const afterEntries =
          await prisma
            .measurementEntry
            .count({
              where: {
                businessId:
                  BUSINESS_A_ID,
              },
            });

        expect(afterVersions)
          .toBe(beforeVersions);

        expect(afterEntries)
          .toBe(beforeEntries);
      },
    );

    it(
      "creates and tenant-scopes StyleReference lookup",
      async () => {
        const created =
          await prismaStyleReferenceRepository
            .create({
              businessId:
                BUSINESS_A_ID,
              garmentId:
                GARMENT_A_ID,
              sourceUrl:
                "https://example.com/style/front.jpg",
              label:
                "Front view",
              note:
                "Use neckline",
            });

        const own =
          await prismaStyleReferenceRepository
            .findById({
              businessId:
                BUSINESS_A_ID,
              styleReferenceId:
                created.id,
            });

        const foreign =
          await prismaStyleReferenceRepository
            .findById({
              businessId:
                BUSINESS_B_ID,
              styleReferenceId:
                created.id,
            });

        expect(own)
          .toEqual(created);

        expect(foreign)
          .toBeNull();
      },
    );

    it(
      "lists a Garment's StyleReferences in stable creation order",
      async () => {
        const first =
          await prismaStyleReferenceRepository
            .create({
              businessId:
                BUSINESS_A_ID,
              garmentId:
                GARMENT_LIST_ID,
              sourceUrl:
                "https://example.com/style/first.jpg",
              label:
                "First",
              note: null,
            });

        const second =
          await prismaStyleReferenceRepository
            .create({
              businessId:
                BUSINESS_A_ID,
              garmentId:
                GARMENT_LIST_ID,
              sourceUrl:
                "https://example.com/style/second.jpg",
              label:
                "Second",
              note: null,
            });

        await prisma.styleReference.update({
          where: {
            id: first.id,
          },
          data: {
            createdAt:
              new Date(
                "2026-09-07T10:00:00.000Z",
              ),
          },
        });

        await prisma.styleReference.update({
          where: {
            id: second.id,
          },
          data: {
            createdAt:
              new Date(
                "2026-09-07T10:01:00.000Z",
              ),
          },
        });

        const references =
          await prismaStyleReferenceRepository
            .listForGarment({
              businessId:
                BUSINESS_A_ID,
              garmentId:
                GARMENT_LIST_ID,
            });

        expect(
          references.map(
            (reference) =>
              reference.id,
          ),
        ).toEqual([
          first.id,
          second.id,
        ]);
      },
    );
  },
);
