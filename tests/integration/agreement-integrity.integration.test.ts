import { randomUUID } from "node:crypto";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/shared/database/prisma";

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

const CLIENT_A_OTHER_ID =
  randomUUID();

const CLIENT_B_ID =
  randomUUID();

const ORDER_A_ID =
  randomUUID();

const ORDER_A_OTHER_ID =
  randomUUID();

const ORDER_B_ID =
  randomUUID();

const GARMENT_A_ID =
  randomUUID();

const GARMENT_A_OTHER_ID =
  randomUUID();

const GARMENT_B_ID =
  randomUUID();

const MEASUREMENT_A_ID =
  randomUUID();

const MEASUREMENT_A_OTHER_CLIENT_ID =
  randomUUID();

const MEASUREMENT_B_ID =
  randomUUID();

const STYLE_A_ID =
  randomUUID();

const STYLE_A_OTHER_GARMENT_ID =
  randomUUID();

const STYLE_B_ID =
  randomUUID();

function assertDedicatedTestDatabase():
  void {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for V0.5 agreement integrity tests.",
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
      `Refusing V0.5 agreement integrity tests against non-test database "${databaseName}".`,
    );
  }
}

type InsertAgreementOptions =
  Readonly<{
    id?: string;
    businessId?: string;
    clientId?: string;
    orderId?: string;
    garmentId?: string;
    revisionNumber?: number;
    measurementVersionId?:
      string | null;
    quantity?: number;
    priceAmount?: string;
    currency?: string;
    supersedesAgreementVersionId?:
      string | null;
  }>;

async function insertAgreementVersion(
  options:
    InsertAgreementOptions = {},
): Promise<string> {
  const id =
    options.id ??
    randomUUID();

  const businessId =
    options.businessId ??
    BUSINESS_A_ID;

  const clientId =
    options.clientId ??
    CLIENT_A_ID;

  const orderId =
    options.orderId ??
    ORDER_A_ID;

  const garmentId =
    options.garmentId ??
    GARMENT_A_ID;

  const revisionNumber =
    options.revisionNumber ??
    1;

  const measurementVersionId =
    options
      .measurementVersionId ===
    undefined
      ? MEASUREMENT_A_ID
      : options
          .measurementVersionId;

  const quantity =
    options.quantity ??
    1;

  const priceAmount =
    options.priceAmount ??
    "80000";

  const currency =
    options.currency ??
    "NGN";

  const supersedesAgreementVersionId =
    options
      .supersedesAgreementVersionId ??
    null;

  await prisma.$executeRaw`
    INSERT INTO "agreement_version" (
      "id",
      "businessId",
      "clientId",
      "orderId",
      "garmentId",
      "revisionNumber",
      "measurementVersionId",
      "designSummary",
      "fabricDescription",
      "quantity",
      "priceAmount",
      "currency",
      "deliveryDate",
      "note",
      "supersedesAgreementVersionId",
      "createdAt"
    )
    VALUES (
      ${id}::uuid,
      ${businessId}::uuid,
      ${clientId}::uuid,
      ${orderId}::uuid,
      ${garmentId}::uuid,
      ${revisionNumber},
      ${measurementVersionId}::uuid,
      'V0.5 test agreement',
      'Client supplied fabric',
      ${quantity},
      ${priceAmount}::numeric,
      ${currency},
      DATE '2026-10-15',
      'Integrity test',
      ${supersedesAgreementVersionId}::uuid,
      NOW()
    )
  `;

  return id;
}

type InsertResolutionOptions =
  Readonly<{
    id?: string;
    businessId?: string;
    agreementVersionId: string;
    outcome?:
      | "APPROVED"
      | "REJECTED"
      | "WITHDRAWN";
    clientNameSnapshot?:
      string | null;
    clientDecisionChannel?:
      | "WHATSAPP"
      | "EMAIL"
      | "PHONE"
      | "IN_PERSON"
      | "OTHER"
      | null;
    evidenceNote?: string;
    recordedByMembershipId?:
      string;
  }>;

async function insertResolution(
  options:
    InsertResolutionOptions,
): Promise<string> {
  const id =
    options.id ??
    randomUUID();

  const businessId =
    options.businessId ??
    BUSINESS_A_ID;

  const outcome =
    options.outcome ??
    "APPROVED";

  const defaultClientDecision =
    outcome === "WITHDRAWN"
      ? null
      : "Ada Okafor";

  const defaultChannel =
    outcome === "WITHDRAWN"
      ? null
      : "WHATSAPP";

  const clientNameSnapshot =
    options.clientNameSnapshot ===
    undefined
      ? defaultClientDecision
      : options
          .clientNameSnapshot;

  const clientDecisionChannel =
    options
      .clientDecisionChannel ===
    undefined
      ? defaultChannel
      : options
          .clientDecisionChannel;

  const evidenceNote =
    options.evidenceNote ??
    "Recorded operational evidence.";

  const recordedByMembershipId =
    options
      .recordedByMembershipId ??
    MEMBERSHIP_A_ID;

  await prisma.$executeRaw`
    INSERT INTO "agreement_resolution" (
      "id",
      "businessId",
      "agreementVersionId",
      "outcome",
      "occurredAt",
      "clientNameSnapshot",
      "clientDecisionChannel",
      "evidenceNote",
      "recordedByMembershipId",
      "createdAt"
    )
    VALUES (
      ${id}::uuid,
      ${businessId}::uuid,
      ${options.agreementVersionId}::uuid,
      ${outcome}::"AgreementResolutionOutcome",
      NOW(),
      ${clientNameSnapshot},
      ${clientDecisionChannel}::"ClientDecisionChannel",
      ${evidenceNote},
      ${recordedByMembershipId}::uuid,
      NOW()
    )
  `;

  return id;
}

async function countAgreementVersion(
  id: string,
): Promise<number> {
  const rows =
    await prisma.$queryRaw<
      Array<{
        count: number;
      }>
    >`
      SELECT
        COUNT(*)::int AS count
      FROM "agreement_version"
      WHERE "id" = ${id}::uuid
    `;

  return rows[0]?.count ?? 0;
}

async function countAgreementResolution(
  id: string,
): Promise<number> {
  const rows =
    await prisma.$queryRaw<
      Array<{
        count: number;
      }>
    >`
      SELECT
        COUNT(*)::int AS count
      FROM "agreement_resolution"
      WHERE "id" = ${id}::uuid
    `;

  return rows[0]?.count ?? 0;
}

describe(
  "agreement database integrity",
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
          'V0.5 Integrity Business A',
          NOW(),
          NOW()
        ),
        (
          ${BUSINESS_B_ID}::uuid,
          'V0.5 Integrity Business B',
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
          'V0.5 User A',
          ${`v05-a-${USER_A_ID}@example.test`},
          false,
          NOW(),
          NOW()
        ),
        (
          ${USER_B_ID}::uuid,
          'V0.5 User B',
          ${`v05-b-${USER_B_ID}@example.test`},
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
          '08000000501',
          NOW(),
          NOW()
        ),
        (
          ${CLIENT_A_OTHER_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          'Ngozi Okafor',
          '08000000502',
          NOW(),
          NOW()
        ),
        (
          ${CLIENT_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          'Business B Client',
          '08000000503',
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
          'V0.5 Garment A',
          NOW(),
          NOW()
        ),
        (
          ${GARMENT_A_OTHER_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${ORDER_A_OTHER_ID}::uuid,
          'V0.5 Garment A Other',
          NOW(),
          NOW()
        ),
        (
          ${GARMENT_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          ${ORDER_B_ID}::uuid,
          'V0.5 Garment B',
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
        VALUES
        (
          ${MEASUREMENT_A_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${CLIENT_A_ID}::uuid,
          NOW(),
          'CENTIMETER',
          NOW()
        ),
        (
          ${MEASUREMENT_A_OTHER_CLIENT_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${CLIENT_A_OTHER_ID}::uuid,
          NOW(),
          'CENTIMETER',
          NOW()
        ),
        (
          ${MEASUREMENT_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          ${CLIENT_B_ID}::uuid,
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
          ${STYLE_A_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${GARMENT_A_ID}::uuid,
          'https://example.com/v05-a.jpg',
          NOW()
        ),
        (
          ${STYLE_A_OTHER_GARMENT_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${GARMENT_A_OTHER_ID}::uuid,
          'https://example.com/v05-a-other.jpg',
          NOW()
        ),
        (
          ${STYLE_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          ${GARMENT_B_ID}::uuid,
          'https://example.com/v05-b.jpg',
          NOW()
        )
      `;
    });

    afterEach(async () => {
      await prisma.$executeRaw`
        DELETE FROM "agreement_resolution"
        WHERE "businessId" = ${BUSINESS_A_ID}::uuid
           OR "businessId" = ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "agreement_style_reference"
        WHERE "businessId" = ${BUSINESS_A_ID}::uuid
           OR "businessId" = ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "agreement_version"
        WHERE "businessId" = ${BUSINESS_A_ID}::uuid
           OR "businessId" = ${BUSINESS_B_ID}::uuid
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
        DELETE FROM "business_member"
        WHERE "businessId" = ${BUSINESS_A_ID}::uuid
           OR "businessId" = ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "business"
        WHERE "id" = ${BUSINESS_A_ID}::uuid
           OR "id" = ${BUSINESS_B_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "user"
        WHERE "id" = ${USER_A_ID}::uuid
           OR "id" = ${USER_B_ID}::uuid
      `;

      await prisma.$disconnect();
    });

    it(
      "accepts a valid AgreementVersion parent chain",
      async () => {
        const id =
          await insertAgreementVersion();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(1);
      },
    );

    it(
      "rejects an AgreementVersion using a Client from another Business",
      async () => {
        const id =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id,
            clientId:
              CLIENT_B_ID,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects a same-Business wrong Client for the Order",
      async () => {
        const id =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id,
            clientId:
              CLIENT_A_OTHER_ID,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects a same-Business wrong Order for the Garment",
      async () => {
        const id =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id,
            orderId:
              ORDER_A_OTHER_ID,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects a MeasurementVersion belonging to another Client in the same Business",
      async () => {
        const id =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id,
            measurementVersionId:
              MEASUREMENT_A_OTHER_CLIENT_ID,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects a cross-Business MeasurementVersion",
      async () => {
        const id =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id,
            measurementVersionId:
              MEASUREMENT_B_ID,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects a StyleReference belonging to another Garment in the same Business",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        await expect(
          prisma.$executeRaw`
            INSERT INTO "agreement_style_reference" (
              "businessId",
              "agreementVersionId",
              "styleReferenceId",
              "garmentId",
              "createdAt"
            )
            VALUES (
              ${BUSINESS_A_ID}::uuid,
              ${agreementId}::uuid,
              ${STYLE_A_OTHER_GARMENT_ID}::uuid,
              ${GARMENT_A_ID}::uuid,
              NOW()
            )
          `,
        ).rejects.toThrow();

        const rows =
          await prisma.$queryRaw<
            Array<{
              count: number;
            }>
          >`
            SELECT
              COUNT(*)::int AS count
            FROM "agreement_style_reference"
            WHERE "agreementVersionId" =
                  ${agreementId}::uuid
          `;

        expect(
          rows[0]?.count,
        ).toBe(0);
      },
    );

    it(
      "rejects a cross-Garment supersession reference",
      async () => {
        const firstAgreementId =
          await insertAgreementVersion();

        const invalidId =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id:
              invalidId,
            garmentId:
              GARMENT_A_OTHER_ID,
            orderId:
              ORDER_A_OTHER_ID,
            revisionNumber:
              1,
            supersedesAgreementVersionId:
              firstAgreementId,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            invalidId,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects duplicate revision numbers for one Business and Garment",
      async () => {
        await insertAgreementVersion({
          revisionNumber:
            1,
        });

        const duplicateId =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id:
              duplicateId,
            revisionNumber:
              1,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            duplicateId,
          ),
        ).toBe(0);
      },
    );

    it.each([
      0,
      -1,
    ])(
      "rejects non-positive revision number %s",
      async (
        revisionNumber,
      ) => {
        const id =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id,
            revisionNumber,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(0);
      },
    );

    it.each([
      0,
      -1,
    ])(
      "rejects non-positive quantity %s",
      async (quantity) => {
        const id =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id,
            quantity,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(0);
      },
    );

    it.each([
      "0",
      "-1",
    ])(
      "rejects non-positive price %s",
      async (
        priceAmount,
      ) => {
        const id =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id,
            priceAmount,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(0);
      },
    );

    it.each([
      "ngn",
      "NG",
      "NGNN",
      "N1N",
    ])(
      "rejects malformed currency %s",
      async (currency) => {
        const id =
          randomUUID();

        await expect(
          insertAgreementVersion({
            id,
            currency,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementVersion(
            id,
          ),
        ).toBe(0);
      },
    );

    it(
      "accepts a valid client approval resolution",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        const resolutionId =
          await insertResolution({
            agreementVersionId:
              agreementId,
            outcome:
              "APPROVED",
          });

        expect(
          await countAgreementResolution(
            resolutionId,
          ),
        ).toBe(1);
      },
    );

    it(
      "rejects more than one terminal resolution for an AgreementVersion",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        await insertResolution({
          agreementVersionId:
            agreementId,
          outcome:
            "APPROVED",
        });

        const duplicateId =
          randomUUID();

        await expect(
          insertResolution({
            id:
              duplicateId,
            agreementVersionId:
              agreementId,
            outcome:
              "REJECTED",
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementResolution(
            duplicateId,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects a resolution recorded by a Membership from another Business",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        const resolutionId =
          randomUUID();

        await expect(
          insertResolution({
            id:
              resolutionId,
            agreementVersionId:
              agreementId,
            recordedByMembershipId:
              MEMBERSHIP_B_ID,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementResolution(
            resolutionId,
          ),
        ).toBe(0);
      },
    );

    it.each([
      "",
      "   ",
      "\t",
      "\n",
      " \t\n ",
    ])(
      "rejects blank resolution evidence %j",
      async (
        evidenceNote,
      ) => {
        const agreementId =
          await insertAgreementVersion();

        const resolutionId =
          randomUUID();

        await expect(
          insertResolution({
            id:
              resolutionId,
            agreementVersionId:
              agreementId,
            evidenceNote,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementResolution(
            resolutionId,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects APPROVED without a Client name snapshot",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        const resolutionId =
          randomUUID();

        await expect(
          insertResolution({
            id:
              resolutionId,
            agreementVersionId:
              agreementId,
            outcome:
              "APPROVED",
            clientNameSnapshot:
              null,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementResolution(
            resolutionId,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects REJECTED without a Client decision channel",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        const resolutionId =
          randomUUID();

        await expect(
          insertResolution({
            id:
              resolutionId,
            agreementVersionId:
              agreementId,
            outcome:
              "REJECTED",
            clientDecisionChannel:
              null,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementResolution(
            resolutionId,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects whitespace-only Client name evidence",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        const resolutionId =
          randomUUID();

        await expect(
          insertResolution({
            id:
              resolutionId,
            agreementVersionId:
              agreementId,
            outcome:
              "APPROVED",
            clientNameSnapshot:
              " \t\n ",
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementResolution(
            resolutionId,
          ),
        ).toBe(0);
      },
    );

    it(
      "accepts WITHDRAWN with no fabricated Client evidence",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        const resolutionId =
          await insertResolution({
            agreementVersionId:
              agreementId,
            outcome:
              "WITHDRAWN",
          });

        expect(
          await countAgreementResolution(
            resolutionId,
          ),
        ).toBe(1);
      },
    );

    it(
      "rejects WITHDRAWN containing Client evidence",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        const resolutionId =
          randomUUID();

        await expect(
          insertResolution({
            id:
              resolutionId,
            agreementVersionId:
              agreementId,
            outcome:
              "WITHDRAWN",
            clientNameSnapshot:
              "Ada Okafor",
            clientDecisionChannel:
              "WHATSAPP",
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementResolution(
            resolutionId,
          ),
        ).toBe(0);
      },
    );

    it(
      "rejects a resolution whose Business does not own the AgreementVersion",
      async () => {
        const agreementId =
          await insertAgreementVersion();

        const resolutionId =
          randomUUID();

        await expect(
          insertResolution({
            id:
              resolutionId,
            businessId:
              BUSINESS_B_ID,
            agreementVersionId:
              agreementId,
            recordedByMembershipId:
              MEMBERSHIP_B_ID,
          }),
        ).rejects.toThrow();

        expect(
          await countAgreementResolution(
            resolutionId,
          ),
        ).toBe(0);
      },
    );
  },
);
