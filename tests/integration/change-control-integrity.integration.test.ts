import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "../../src/shared/database/prisma";

const USER_ID = randomUUID();
const BUSINESS_ID = randomUUID();
const MEMBERSHIP_ID = randomUUID();
const CLIENT_ID = randomUUID();

const ORDER_1_ID = randomUUID();
const ORDER_2_ID = randomUUID();

const GARMENT_1_ID = randomUUID();
const GARMENT_2_ID = randomUUID();

const AGREEMENT_1_ID = randomUUID();
const AGREEMENT_2_ID = randomUUID();

function assertDedicatedTestDatabase(): void {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for V0.6 change-control integrity tests.",
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
      `Refusing V0.6 change-control integrity tests against non-test database "${databaseName}".`,
    );
  }
}

async function cleanupChangeControl(): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM "change_proposal_decision"
    WHERE "businessId" = ${BUSINESS_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "change_request_closure"
    WHERE "businessId" = ${BUSINESS_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "client_portal_grant"
    WHERE "businessId" = ${BUSINESS_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "change_proposal_style_reference"
    WHERE "businessId" = ${BUSINESS_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "change_proposal_version"
    WHERE "businessId" = ${BUSINESS_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "change_request"
    WHERE "businessId" = ${BUSINESS_ID}::uuid
  `;
}

type InsertRequestOptions =
  Readonly<{
    id?: string;
    orderId?: string;
    garmentId?: string;
    baselineAgreementVersionId?: string;
    activeSlot?: string | null;
  }>;

async function insertValidRequest(
  options:
    InsertRequestOptions = {},
): Promise<string> {
  const id =
    options.id ??
    randomUUID();

  const orderId =
    options.orderId ??
    ORDER_1_ID;

  const garmentId =
    options.garmentId ??
    GARMENT_1_ID;

  const baselineAgreementVersionId =
    options
      .baselineAgreementVersionId ??
    AGREEMENT_1_ID;

  const activeSlot =
    options.activeSlot ===
    undefined
      ? "ACTIVE"
      : options.activeSlot;

  await prisma.$executeRaw`
    INSERT INTO "change_request" (
      "id",
      "businessId",
      "clientId",
      "orderId",
      "garmentId",
      "baselineAgreementVersionId",
      "requestedBy",
      "origin",
      "requestChannel",
      "description",
      "requestedAt",
      "recordedByMembershipId",
      "activeSlot"
    )
    VALUES (
      ${id}::uuid,
      ${BUSINESS_ID}::uuid,
      ${CLIENT_ID}::uuid,
      ${orderId}::uuid,
      ${garmentId}::uuid,
      ${baselineAgreementVersionId}::uuid,
      'CLIENT',
      'BUSINESS_RECORDED',
      'WHATSAPP',
      'Add long sleeves',
      NOW(),
      ${MEMBERSHIP_ID}::uuid,
      ${activeSlot}
    )
  `;

  return id;
}

type InsertProposalOptions =
  Readonly<{
    id?: string;
    changeRequestId: string;
    orderId?: string;
    garmentId?: string;
    baselineAgreementVersionId?: string;
    revisionNumber?: number;
    supersedesChangeProposalVersionId?:
      string | null;
  }>;

async function insertValidProposal(
  options:
    InsertProposalOptions,
): Promise<string> {
  const id =
    options.id ??
    randomUUID();

  const orderId =
    options.orderId ??
    ORDER_1_ID;

  const garmentId =
    options.garmentId ??
    GARMENT_1_ID;

  const baselineAgreementVersionId =
    options
      .baselineAgreementVersionId ??
    AGREEMENT_1_ID;

  const revisionNumber =
    options.revisionNumber ??
    1;

  const supersedes =
    options
      .supersedesChangeProposalVersionId ??
    null;

  await prisma.$executeRaw`
    INSERT INTO "change_proposal_version" (
      "id",
      "businessId",
      "changeRequestId",
      "clientId",
      "orderId",
      "garmentId",
      "baselineAgreementVersionId",
      "revisionNumber",
      "supersedesChangeProposalVersionId",
      "designSummary",
      "quantity",
      "priceAmount",
      "currency",
      "deliveryDate",
      "rationale",
      "createdByMembershipId"
    )
    VALUES (
      ${id}::uuid,
      ${BUSINESS_ID}::uuid,
      ${options.changeRequestId}::uuid,
      ${CLIENT_ID}::uuid,
      ${orderId}::uuid,
      ${garmentId}::uuid,
      ${baselineAgreementVersionId}::uuid,
      ${revisionNumber},
      ${supersedes}::uuid,
      'Long sleeve gown',
      1,
      90000,
      'NGN',
      DATE '2026-10-23',
      'Sleeves affect price and delivery.',
      ${MEMBERSHIP_ID}::uuid
    )
  `;

  return id;
}

async function insertDecisionGrant(
  changeProposalVersionId:
    string,
  orderId: string =
    ORDER_1_ID,
  garmentId: string =
    GARMENT_1_ID,
): Promise<string> {
  const id =
    randomUUID();

  await prisma.$executeRaw`
    INSERT INTO "client_portal_grant" (
      "id",
      "businessId",
      "clientId",
      "orderId",
      "garmentId",
      "changeProposalVersionId",
      "purpose",
      "tokenHash",
      "expiresAt",
      "createdByMembershipId"
    )
    VALUES (
      ${id}::uuid,
      ${BUSINESS_ID}::uuid,
      ${CLIENT_ID}::uuid,
      ${orderId}::uuid,
      ${garmentId}::uuid,
      ${changeProposalVersionId}::uuid,
      'DECIDE_CHANGE_PROPOSAL',
      ${`grant-${id}`},
      NOW() + INTERVAL '1 hour',
      ${MEMBERSHIP_ID}::uuid
    )
  `;

  return id;
}

describe(
  "change-control database integrity",
  () => {
    beforeAll(async () => {
      assertDedicatedTestDatabase();

      await prisma.$executeRaw`
        INSERT INTO "user" (
          "id",
          "name",
          "email",
          "emailVerified",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${USER_ID}::uuid,
          'V0.6 Integrity User',
          ${`v06-${USER_ID}@example.test`},
          false,
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
          ${BUSINESS_ID}::uuid,
          'V0.6 Integrity Business',
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
        VALUES (
          ${MEMBERSHIP_ID}::uuid,
          ${BUSINESS_ID}::uuid,
          ${USER_ID}::uuid,
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
        VALUES (
          ${CLIENT_ID}::uuid,
          ${BUSINESS_ID}::uuid,
          'Ada Okafor',
          '08000000601',
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
          ${ORDER_1_ID}::uuid,
          ${BUSINESS_ID}::uuid,
          ${CLIENT_ID}::uuid,
          NOW(),
          NOW()
        ),
        (
          ${ORDER_2_ID}::uuid,
          ${BUSINESS_ID}::uuid,
          ${CLIENT_ID}::uuid,
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
          ${GARMENT_1_ID}::uuid,
          ${BUSINESS_ID}::uuid,
          ${ORDER_1_ID}::uuid,
          'V0.6 Integrity Garment One',
          NOW(),
          NOW()
        ),
        (
          ${GARMENT_2_ID}::uuid,
          ${BUSINESS_ID}::uuid,
          ${ORDER_2_ID}::uuid,
          'V0.6 Integrity Garment Two',
          NOW(),
          NOW()
        )
      `;

      await prisma.$executeRaw`
        INSERT INTO "agreement_version" (
          "id",
          "businessId",
          "clientId",
          "orderId",
          "garmentId",
          "revisionNumber",
          "designSummary",
          "quantity",
          "priceAmount",
          "currency",
          "deliveryDate",
          "createdAt"
        )
        VALUES
        (
          ${AGREEMENT_1_ID}::uuid,
          ${BUSINESS_ID}::uuid,
          ${CLIENT_ID}::uuid,
          ${ORDER_1_ID}::uuid,
          ${GARMENT_1_ID}::uuid,
          1,
          'Original gown one',
          1,
          80000,
          'NGN',
          DATE '2026-10-20',
          NOW()
        ),
        (
          ${AGREEMENT_2_ID}::uuid,
          ${BUSINESS_ID}::uuid,
          ${CLIENT_ID}::uuid,
          ${ORDER_2_ID}::uuid,
          ${GARMENT_2_ID}::uuid,
          1,
          'Original gown two',
          1,
          85000,
          'NGN',
          DATE '2026-10-21',
          NOW()
        )
      `;

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
        VALUES
        (
          ${randomUUID()}::uuid,
          ${BUSINESS_ID}::uuid,
          ${AGREEMENT_1_ID}::uuid,
          'APPROVED',
          NOW(),
          'Ada Okafor',
          'WHATSAPP',
          'Approved baseline one.',
          ${MEMBERSHIP_ID}::uuid,
          NOW()
        ),
        (
          ${randomUUID()}::uuid,
          ${BUSINESS_ID}::uuid,
          ${AGREEMENT_2_ID}::uuid,
          'APPROVED',
          NOW(),
          'Ada Okafor',
          'WHATSAPP',
          'Approved baseline two.',
          ${MEMBERSHIP_ID}::uuid,
          NOW()
        )
      `;
    });

    afterEach(async () => {
      await cleanupChangeControl();
    });

    afterAll(async () => {
      await cleanupChangeControl();

      await prisma.$executeRaw`
        DELETE FROM "agreement_resolution"
        WHERE "businessId" = ${BUSINESS_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "agreement_version"
        WHERE "businessId" = ${BUSINESS_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "garment"
        WHERE "businessId" = ${BUSINESS_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "order"
        WHERE "businessId" = ${BUSINESS_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "client"
        WHERE "businessId" = ${BUSINESS_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "business_member"
        WHERE "businessId" = ${BUSINESS_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "business"
        WHERE "id" = ${BUSINESS_ID}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM "user"
        WHERE "id" = ${USER_ID}::uuid
      `;

      await prisma.$disconnect();
    });

    it(
      "accepts a valid active ChangeRequest",
      async () => {
        const id =
          await insertValidRequest();

        const rows =
          await prisma.$queryRaw<
            Array<{
              count: number;
            }>
          >`
            SELECT COUNT(*)::int AS count
            FROM "change_request"
            WHERE "id" = ${id}::uuid
          `;

        expect(
          rows[0]?.count,
        ).toBe(1);
      },
    );

    it(
      "rejects a portal request carrying a staff recorder",
      async () => {
        await expect(
          prisma.$executeRaw`
            INSERT INTO "change_request" (
              "id",
              "businessId",
              "clientId",
              "orderId",
              "garmentId",
              "baselineAgreementVersionId",
              "requestedBy",
              "origin",
              "requestChannel",
              "description",
              "requestedAt",
              "recordedByMembershipId"
            )
            VALUES (
              ${randomUUID()}::uuid,
              ${BUSINESS_ID}::uuid,
              ${CLIENT_ID}::uuid,
              ${ORDER_1_ID}::uuid,
              ${GARMENT_1_ID}::uuid,
              ${AGREEMENT_1_ID}::uuid,
              'CLIENT',
              'CLIENT_PORTAL',
              'PORTAL',
              'Invalid portal request',
              NOW(),
              ${MEMBERSHIP_ID}::uuid
            )
          `,
        ).rejects.toThrow();
      },
    );

    it(
      "rejects a ChangeRequest with the wrong Order for its Garment",
      async () => {
        await expect(
          insertValidRequest({
            orderId:
              ORDER_2_ID,
            garmentId:
              GARMENT_1_ID,
            baselineAgreementVersionId:
              AGREEMENT_1_ID,
          }),
        ).rejects.toThrow();
      },
    );

    it(
      "allows only one active ChangeRequest per Garment and permits another after release",
      async () => {
        const firstRequestId =
          await insertValidRequest();

        await expect(
          insertValidRequest(),
        ).rejects.toThrow();

        await prisma.$executeRaw`
          UPDATE "change_request"
          SET "activeSlot" = NULL
          WHERE "id" =
            ${firstRequestId}::uuid
        `;

        await expect(
          insertValidRequest(),
        ).resolves.toBeTypeOf(
          "string",
        );
      },
    );

    it(
      "rejects proposal revision two without supersession evidence",
      async () => {
        const requestId =
          await insertValidRequest();

        await expect(
          insertValidProposal({
            changeRequestId:
              requestId,
            revisionNumber:
              2,
          }),
        ).rejects.toThrow();
      },
    );

    it(
      "rejects a Business-recorded decision that claims PORTAL",
      async () => {
        const requestId =
          await insertValidRequest();

        const proposalId =
          await insertValidProposal({
            changeRequestId:
              requestId,
          });

        await expect(
          prisma.$executeRaw`
            INSERT INTO "change_proposal_decision" (
              "id",
              "businessId",
              "changeProposalVersionId",
              "outcome",
              "occurredAt",
              "clientNameSnapshot",
              "decisionSource",
              "clientDecisionChannel",
              "evidenceNote",
              "recordedByMembershipId"
            )
            VALUES (
              ${randomUUID()}::uuid,
              ${BUSINESS_ID}::uuid,
              ${proposalId}::uuid,
              'APPROVED',
              NOW(),
              'Ada Okafor',
              'BUSINESS_RECORDED',
              'PORTAL',
              'Invalid staff portal decision.',
              ${MEMBERSHIP_ID}::uuid
            )
          `,
        ).rejects.toThrow();
      },
    );

    it(
      "rejects REQUEST_CHANGE grants that target a proposal",
      async () => {
        const requestId =
          await insertValidRequest();

        const proposalId =
          await insertValidProposal({
            changeRequestId:
              requestId,
          });

        await expect(
          prisma.$executeRaw`
            INSERT INTO "client_portal_grant" (
              "id",
              "businessId",
              "clientId",
              "orderId",
              "garmentId",
              "changeProposalVersionId",
              "purpose",
              "tokenHash",
              "expiresAt",
              "createdByMembershipId"
            )
            VALUES (
              ${randomUUID()}::uuid,
              ${BUSINESS_ID}::uuid,
              ${CLIENT_ID}::uuid,
              ${ORDER_1_ID}::uuid,
              ${GARMENT_1_ID}::uuid,
              ${proposalId}::uuid,
              'REQUEST_CHANGE',
              ${`invalid-${randomUUID()}`},
              NOW() + INTERVAL '1 hour',
              ${MEMBERSHIP_ID}::uuid
            )
          `,
        ).rejects.toThrow();
      },
    );

    it(
      "rejects a portal grant that is both consumed and revoked",
      async () => {
        await expect(
          prisma.$executeRaw`
            INSERT INTO "client_portal_grant" (
              "id",
              "businessId",
              "clientId",
              "orderId",
              "garmentId",
              "purpose",
              "tokenHash",
              "expiresAt",
              "consumedAt",
              "revokedAt",
              "createdByMembershipId",
              "createdAt"
            )
            VALUES (
              ${randomUUID()}::uuid,
              ${BUSINESS_ID}::uuid,
              ${CLIENT_ID}::uuid,
              ${ORDER_1_ID}::uuid,
              ${GARMENT_1_ID}::uuid,
              'REQUEST_CHANGE',
              ${`terminal-${randomUUID()}`},
              NOW() + INTERVAL '1 hour',
              NOW(),
              NOW(),
              ${MEMBERSHIP_ID}::uuid,
              NOW()
            )
          `,
        ).rejects.toThrow();
      },
    );

    it(
      "accepts a portal decision using its exact proposal grant",
      async () => {
        const requestId =
          await insertValidRequest();

        const proposalId =
          await insertValidProposal({
            changeRequestId:
              requestId,
          });

        const grantId =
          await insertDecisionGrant(
            proposalId,
          );

        await expect(
          prisma.$executeRaw`
            INSERT INTO "change_proposal_decision" (
              "id",
              "businessId",
              "changeProposalVersionId",
              "outcome",
              "occurredAt",
              "clientNameSnapshot",
              "decisionSource",
              "clientDecisionChannel",
              "evidenceNote",
              "recordedByMembershipId",
              "portalGrantId"
            )
            VALUES (
              ${randomUUID()}::uuid,
              ${BUSINESS_ID}::uuid,
              ${proposalId}::uuid,
              'APPROVED',
              NOW(),
              'Ada Okafor',
              'CLIENT_PORTAL',
              'PORTAL',
              'Approved through secure portal.',
              NULL,
              ${grantId}::uuid
            )
          `,
        ).resolves.toBe(1);
      },
    );

    it(
      "rejects using a portal grant to decide a different proposal",
      async () => {
        const requestOneId =
          await insertValidRequest();

        const proposalOneId =
          await insertValidProposal({
            changeRequestId:
              requestOneId,
          });

        const requestTwoId =
          await insertValidRequest({
            orderId:
              ORDER_2_ID,
            garmentId:
              GARMENT_2_ID,
            baselineAgreementVersionId:
              AGREEMENT_2_ID,
          });

        const proposalTwoId =
          await insertValidProposal({
            changeRequestId:
              requestTwoId,
            orderId:
              ORDER_2_ID,
            garmentId:
              GARMENT_2_ID,
            baselineAgreementVersionId:
              AGREEMENT_2_ID,
          });

        const grantId =
          await insertDecisionGrant(
            proposalOneId,
          );

        await expect(
          prisma.$executeRaw`
            INSERT INTO "change_proposal_decision" (
              "id",
              "businessId",
              "changeProposalVersionId",
              "outcome",
              "occurredAt",
              "clientNameSnapshot",
              "decisionSource",
              "clientDecisionChannel",
              "evidenceNote",
              "recordedByMembershipId",
              "portalGrantId"
            )
            VALUES (
              ${randomUUID()}::uuid,
              ${BUSINESS_ID}::uuid,
              ${proposalTwoId}::uuid,
              'APPROVED',
              NOW(),
              'Ada Okafor',
              'CLIENT_PORTAL',
              'PORTAL',
              'Attempted grant reuse.',
              NULL,
              ${grantId}::uuid
            )
          `,
        ).rejects.toThrow();
      },
    );
  },
);
