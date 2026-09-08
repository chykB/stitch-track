import { randomUUID } from "node:crypto";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import type {
  CreateAgreementResolutionData,
  CreateAgreementVersionData,
} from "@/agreement/application/ports/agreement-lifecycle-repository";
import {
  createAgreementVersionForTenant,
} from "@/agreement/application/use-cases/create-agreement-version";
import {
  recordAgreementResolutionForTenant,
} from "@/agreement/application/use-cases/record-agreement-resolution";
import {
  prismaAgreementLifecycleRepository,
} from "@/agreement/infrastructure/prisma-agreement-lifecycle-repository";
import {
  prismaAgreementResolutionRepository,
} from "@/agreement/infrastructure/prisma-agreement-resolution-repository";
import {
  prismaAgreementVersionRepository,
} from "@/agreement/infrastructure/prisma-agreement-version-repository";
import {
  prismaClientRepository,
} from "@/client/infrastructure/prisma-client-repository";
import {
  prismaGarmentRepository,
} from "@/garment/infrastructure/prisma-garment-repository";
import {
  prismaMeasurementVersionRepository,
} from "@/measurement/infrastructure/prisma-measurement-version-repository";
import {
  prismaOrderRepository,
} from "@/order/infrastructure/prisma-order-repository";
import { prisma } from "@/shared/database/prisma";
import {
  prismaStyleReferenceRepository,
} from "@/style-reference/infrastructure/prisma-style-reference-repository";

const BUSINESS_A_ID =
  randomUUID();

const BUSINESS_B_ID =
  randomUUID();

const USER_A_ID =
  randomUUID();

const USER_B_ID =
  randomUUID();

const MEMBERSHIP_A_ID =
  randomUUID();

const MEMBERSHIP_B_ID =
  randomUUID();

const CLIENT_A_ID =
  randomUUID();

const CLIENT_B_ID =
  randomUUID();

const ORDER_A_ID =
  randomUUID();

const ORDER_B_ID =
  randomUUID();

const GARMENT_A_ID =
  randomUUID();

const GARMENT_A_OTHER_ID =
  randomUUID();

const GARMENT_B_ID =
  randomUUID();

const ORDER_A_OTHER_ID =
  randomUUID();

const MEASUREMENT_A_ID =
  randomUUID();

const STYLE_A_ONE_ID =
  randomUUID();

const STYLE_A_TWO_ID =
  randomUUID();

const STYLE_A_OTHER_GARMENT_ID =
  randomUUID();

function assertDedicatedTestDatabase():
  void {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for V0.5 agreement repository tests.",
    );
  }

  const databaseName =
    new URL(databaseUrl)
      .pathname
      .replace(/^\/+/, "");

  if (
    !databaseName.endsWith(
      "_test",
    )
  ) {
    throw new Error(
      `Refusing V0.5 agreement repository tests against non-test database "${databaseName}".`,
    );
  }
}

function versionData(
  overrides:
    Partial<CreateAgreementVersionData> = {},
): CreateAgreementVersionData {
  return {
    businessId:
      BUSINESS_A_ID,
    clientId:
      CLIENT_A_ID,
    orderId:
      ORDER_A_ID,
    garmentId:
      GARMENT_A_ID,
    revisionNumber:
      1,
    measurementVersionId:
      MEASUREMENT_A_ID,
    designSummary:
      "Structured fitted gown",
    fabricDescription:
      "Client supplied Ankara",
    quantity:
      1,
    priceAmount:
      "80000.5000",
    currency:
      "NGN",
    deliveryDate:
      "2026-10-15",
    note:
      "Repository integration test",
    styleReferenceIds: [
      STYLE_A_TWO_ID,
      STYLE_A_ONE_ID,
    ],
    supersedesAgreementVersionId:
      null,
    ...overrides,
  };
}

function resolutionData(
  agreementVersionId: string,
  overrides:
    Partial<CreateAgreementResolutionData> = {},
): CreateAgreementResolutionData {
  return {
    businessId:
      BUSINESS_A_ID,
    agreementVersionId,
    outcome:
      "APPROVED",
    occurredAt:
      new Date(
        "2026-09-08T18:00:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote:
      "Client approved on WhatsApp.",
    recordedByMembershipId:
      MEMBERSHIP_A_ID,
    ...overrides,
  };
}

async function countAgreementVersions():
  Promise<number> {
  const rows =
    await prisma.$queryRaw<
      Array<{
        count: number;
      }>
    >`
      SELECT
        COUNT(*)::int AS count
      FROM "agreement_version"
      WHERE "businessId" =
        ${BUSINESS_A_ID}::uuid
    `;

  return rows[0]?.count ?? 0;
}

const TENANT_CONTEXT = {
  userId:
    USER_A_ID,
  businessId:
    BUSINESS_A_ID,
  membershipId:
    MEMBERSHIP_A_ID,
  role:
    "OWNER" as const,
};

async function createAgreementThroughApplication() {
  return createAgreementVersionForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaMeasurementVersionRepository,
    prismaStyleReferenceRepository,
    prismaAgreementLifecycleRepository,
    TENANT_CONTEXT,
    {
      garmentId:
        GARMENT_A_ID,
      measurementVersionId:
        MEASUREMENT_A_ID,
      designSummary:
        "Concurrent fitted gown",
      fabricDescription:
        "Client supplied Ankara",
      quantity:
        1,
      priceAmount:
        "80000.5000",
      currency:
        "NGN",
      deliveryDate:
        "2026-10-15",
      note:
        "Application concurrency test",
      styleReferenceIds: [
        STYLE_A_ONE_ID,
        STYLE_A_TWO_ID,
      ],
    },
  );
}

async function recordResolutionThroughApplication(
  agreementVersionId: string,
  outcome:
    "APPROVED" | "REJECTED",
  evidenceNote: string,
) {
  return recordAgreementResolutionForTenant(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaAgreementLifecycleRepository,
    TENANT_CONTEXT,
    {
      garmentId:
        GARMENT_A_ID,
      agreementVersionId,
      outcome,
      occurredAt:
        new Date(),
      clientDecisionChannel:
        "WHATSAPP",
      evidenceNote,
    },
  );
}

async function countAgreementResolutions():
  Promise<number> {
  const rows =
    await prisma.$queryRaw<
      Array<{
        count: number;
      }>
    >`
      SELECT
        COUNT(*)::int AS count
      FROM "agreement_resolution"
      WHERE "businessId" =
        ${BUSINESS_A_ID}::uuid
    `;

  return rows[0]?.count ?? 0;
}

function delay(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}

describe(
  "agreement Prisma repositories",
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
        VALUES
        (
          ${BUSINESS_A_ID}::uuid,
          'V0.5 Repository Business A',
          NOW(),
          NOW()
        ),
        (
          ${BUSINESS_B_ID}::uuid,
          'V0.5 Repository Business B',
          NOW(),
          NOW()
        )
      `;

      await prisma.$executeRaw`
        INSERT INTO "user" (
          "id",
          "name",
          "email",
          "emailVerified",
          "createdAt",
          "updatedAt"
        )
        VALUES
        (
          ${USER_A_ID}::uuid,
          'Repository User A',
          ${`v05-repo-a-${USER_A_ID}@example.test`},
          false,
          NOW(),
          NOW()
        ),
        (
          ${USER_B_ID}::uuid,
          'Repository User B',
          ${`v05-repo-b-${USER_B_ID}@example.test`},
          false,
          NOW(),
          NOW()
        )
      `;

      await prisma.$executeRaw`
        INSERT INTO "business_member" (
          "id",
          "businessId",
          "userId",
          "role",
          "status",
          "createdAt",
          "updatedAt"
        )
        VALUES
        (
          ${MEMBERSHIP_A_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${USER_A_ID}::uuid,
          'OWNER',
          'ACTIVE',
          NOW(),
          NOW()
        ),
        (
          ${MEMBERSHIP_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          ${USER_B_ID}::uuid,
          'OWNER',
          'ACTIVE',
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
        VALUES
        (
          ${CLIENT_A_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          'Ada Okafor',
          '08000000601',
          NOW(),
          NOW()
        ),
        (
          ${CLIENT_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          'Repository Client B',
          '08000000602',
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
        VALUES
        (
          ${ORDER_A_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${CLIENT_A_ID}::uuid,
          NOW(),
          NOW()
        ),
        (
          ${ORDER_A_OTHER_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${CLIENT_A_ID}::uuid,
          NOW(),
          NOW()
        ),
        (
          ${ORDER_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          ${CLIENT_B_ID}::uuid,
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
        VALUES
        (
          ${GARMENT_A_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${ORDER_A_ID}::uuid,
          'Repository Garment A',
          NOW(),
          NOW()
        ),
        (
          ${GARMENT_A_OTHER_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${ORDER_A_OTHER_ID}::uuid,
          'Repository Garment A Other',
          NOW(),
          NOW()
        ),
        (
          ${GARMENT_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          ${ORDER_B_ID}::uuid,
          'Repository Garment B',
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
          ${MEASUREMENT_A_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${CLIENT_A_ID}::uuid,
          NOW(),
          'CENTIMETER',
          NOW()
        )
      `;

      await prisma.$executeRaw`
        INSERT INTO "style_reference" (
          "id",
          "businessId",
          "garmentId",
          "sourceUrl",
          "createdAt"
        )
        VALUES
        (
          ${STYLE_A_ONE_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${GARMENT_A_ID}::uuid,
          'https://example.com/repository-style-one.jpg',
          NOW()
        ),
        (
          ${STYLE_A_TWO_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${GARMENT_A_ID}::uuid,
          'https://example.com/repository-style-two.jpg',
          NOW()
        ),
        (
          ${STYLE_A_OTHER_GARMENT_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${GARMENT_A_OTHER_ID}::uuid,
          'https://example.com/repository-other-garment.jpg',
          NOW()
        )
      `;
    });

    afterEach(async () => {
      await prisma.$executeRaw`
        DELETE FROM "agreement_resolution"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "agreement_style_reference"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "agreement_version"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;
    });

    afterAll(async () => {
      await prisma.$executeRaw`
        DELETE FROM "style_reference"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "measurement_entry"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "measurement_version"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "garment"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "order"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "client"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "business_member"
        WHERE "businessId" =
          ${BUSINESS_A_ID}::uuid
           OR "businessId" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "business"
        WHERE "id" =
          ${BUSINESS_A_ID}::uuid
           OR "id" =
          ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "user"
        WHERE "id" =
          ${USER_A_ID}::uuid
           OR "id" =
          ${USER_B_ID}::uuid
      `;

      await prisma.$disconnect();
    });

    it(
      "persists and reads an AgreementVersion with its exact immutable references",
      async () => {
        const created =
          await prismaAgreementLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              (session) =>
                session.createVersion(
                  versionData(),
                ),
            );

        expect(
          created.revisionNumber,
        ).toBe(1);

        expect(
          created.priceAmount,
        ).toBe("80000.5");

        expect(
          created.deliveryDate,
        ).toBe("2026-10-15");

        expect(
          created.styleReferenceIds,
        ).toEqual(
          [
            STYLE_A_ONE_ID,
            STYLE_A_TWO_ID,
          ].sort(),
        );

        const found =
          await prismaAgreementVersionRepository
            .findById({
              businessId:
                BUSINESS_A_ID,
              agreementVersionId:
                created.id,
            });

        expect(found).toEqual(
          created,
        );
      },
    );

    it(
      "lists AgreementVersions in revision order",
      async () => {
        await prismaAgreementLifecycleRepository
          .withGarmentLifecycle(
            {
              businessId:
                BUSINESS_A_ID,
              garmentId:
                GARMENT_A_ID,
            },
            async (session) => {
              const first =
                await session
                  .createVersion(
                    versionData(),
                  );

              await session
                .createVersion(
                  versionData({
                    revisionNumber:
                      2,
                    designSummary:
                      "Second revision",
                    supersedesAgreementVersionId:
                      first.id,
                  }),
                );
            },
          );

        const versions =
          await prismaAgreementVersionRepository
            .listForGarment({
              businessId:
                BUSINESS_A_ID,
              garmentId:
                GARMENT_A_ID,
            });

        expect(
          versions.map(
            (version) =>
              version.revisionNumber,
          ),
        ).toEqual([
          1,
          2,
        ]);
      },
    );

    it(
      "persists and reads one AgreementResolution",
      async () => {
        const version =
          await prismaAgreementLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              (session) =>
                session.createVersion(
                  versionData(),
                ),
            );

        const resolution =
          await prismaAgreementLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              (session) =>
                session.createResolution(
                  resolutionData(
                    version.id,
                  ),
                ),
            );

        const found =
          await prismaAgreementResolutionRepository
            .findForVersion({
              businessId:
                BUSINESS_A_ID,
              agreementVersionId:
                version.id,
            });

        expect(found).toEqual(
          resolution,
        );
      },
    );

    it(
      "keeps AgreementVersion reads tenant scoped",
      async () => {
        const version =
          await prismaAgreementLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              (session) =>
                session.createVersion(
                  versionData(),
                ),
            );

        const foreignRead =
          await prismaAgreementVersionRepository
            .findById({
              businessId:
                BUSINESS_B_ID,
              agreementVersionId:
                version.id,
            });

        expect(
          foreignRead,
        ).toBeNull();
      },
    );

    it(
      "keeps AgreementResolution reads tenant scoped",
      async () => {
        const version =
          await prismaAgreementLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              (session) =>
                session.createVersion(
                  versionData(),
                ),
            );

        await prismaAgreementLifecycleRepository
          .withGarmentLifecycle(
            {
              businessId:
                BUSINESS_A_ID,
              garmentId:
                GARMENT_A_ID,
            },
            (session) =>
              session.createResolution(
                resolutionData(
                  version.id,
                ),
              ),
          );

        const foreignRead =
          await prismaAgreementResolutionRepository
            .findForVersion({
              businessId:
                BUSINESS_B_ID,
              agreementVersionId:
                version.id,
            });

        expect(
          foreignRead,
        ).toBeNull();
      },
    );

    it(
      "refuses a lifecycle scope for an inaccessible Garment before invoking the callback",
      async () => {
        let callbackInvoked =
          false;

        await expect(
          prismaAgreementLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_B_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async () => {
                callbackInvoked =
                  true;
              },
            ),
        ).rejects.toThrow(
          "Garment lifecycle scope could not be locked.",
        );

        expect(
          callbackInvoked,
        ).toBe(false);
      },
    );

    it(
      "rolls back the AgreementVersion when an immutable style association fails",
      async () => {
        await expect(
          prismaAgreementLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              (session) =>
                session.createVersion(
                  versionData({
                    styleReferenceIds: [
                      STYLE_A_ONE_ID,
                      STYLE_A_OTHER_GARMENT_ID,
                    ],
                  }),
                ),
            ),
        ).rejects.toThrow();

        expect(
          await countAgreementVersions(),
        ).toBe(0);
      },
    );

    it(
      "serializes competing lifecycle operations for the same Garment",
      async () => {
        let releaseFirst:
          (() => void) | undefined;

        let signalFirstEntered:
          (() => void) | undefined;

        let signalSecondEntered:
          (() => void) | undefined;

        const firstEntered =
          new Promise<void>(
            (resolve) => {
              signalFirstEntered =
                resolve;
            },
          );

        const secondEntered =
          new Promise<void>(
            (resolve) => {
              signalSecondEntered =
                resolve;
            },
          );

        const firstRelease =
          new Promise<void>(
            (resolve) => {
              releaseFirst =
                resolve;
            },
          );

        let secondObservedRevision:
          number | null =
          null;

        const firstOperation =
          prismaAgreementLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const latest =
                  await session
                    .findLatestVersion();

                expect(
                  latest,
                ).toBeNull();

                signalFirstEntered?.();

                await firstRelease;

                return session
                  .createVersion(
                    versionData(),
                  );
              },
            );

        await firstEntered;

        const secondOperation =
          prismaAgreementLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                signalSecondEntered?.();

                const latest =
                  await session
                    .findLatestVersion();

                secondObservedRevision =
                  latest
                    ?.revisionNumber ??
                  null;
              },
            );

        const earlySecondState =
          await Promise.race([
            secondEntered.then(
              () => "entered",
            ),
            delay(100).then(
              () => "blocked",
            ),
          ]);

        expect(
          earlySecondState,
        ).toBe("blocked");

        releaseFirst?.();

        await firstOperation;
        await secondOperation;

        expect(
          secondObservedRevision,
        ).toBe(1);
      },
    );
    it(
      "allows only one simultaneous first AgreementVersion creation through the application use case",
      async () => {
        const results =
          await Promise.allSettled([
            createAgreementThroughApplication(),
            createAgreementThroughApplication(),
          ]);

        const fulfilled =
          results.filter(
            (result) =>
              result.status ===
              "fulfilled",
          );

        const rejected =
          results.filter(
            (result) =>
              result.status ===
              "rejected",
          );

        expect(
          fulfilled,
        ).toHaveLength(1);

        expect(
          rejected,
        ).toHaveLength(1);

        const failure =
          rejected[0];

        if (
          !failure ||
          failure.status !==
            "rejected"
        ) {
          throw new Error(
            "Expected one rejected concurrent AgreementVersion creation.",
          );
        }

        expect(
          failure.reason,
        ).toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          await countAgreementVersions(),
        ).toBe(1);

        const versions =
          await prismaAgreementVersionRepository
            .listForGarment({
              businessId:
                BUSINESS_A_ID,
              garmentId:
                GARMENT_A_ID,
            });

        expect(
          versions,
        ).toHaveLength(1);

        expect(
          versions[0]
            ?.revisionNumber,
        ).toBe(1);
      },
    );

    it(
      "allows only one simultaneous terminal resolution through the application use case",
      async () => {
        const version =
          await createAgreementThroughApplication();

        const results =
          await Promise.allSettled([
            recordResolutionThroughApplication(
              version.id,
              "APPROVED",
              "Concurrent approval evidence.",
            ),
            recordResolutionThroughApplication(
              version.id,
              "REJECTED",
              "Concurrent rejection evidence.",
            ),
          ]);

        const fulfilled =
          results.filter(
            (result) =>
              result.status ===
              "fulfilled",
          );

        const rejected =
          results.filter(
            (result) =>
              result.status ===
              "rejected",
          );

        expect(
          fulfilled,
        ).toHaveLength(1);

        expect(
          rejected,
        ).toHaveLength(1);

        const failure =
          rejected[0];

        if (
          !failure ||
          failure.status !==
            "rejected"
        ) {
          throw new Error(
            "Expected one rejected concurrent AgreementResolution.",
          );
        }

        expect(
          failure.reason,
        ).toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          await countAgreementResolutions(),
        ).toBe(1);

        const persisted =
          await prismaAgreementResolutionRepository
            .findForVersion({
              businessId:
                BUSINESS_A_ID,
              agreementVersionId:
                version.id,
            });

        expect(
          persisted,
        ).not.toBeNull();

        expect([
          "APPROVED",
          "REJECTED",
        ]).toContain(
          persisted?.outcome,
        );
      },
    );

  },
);
