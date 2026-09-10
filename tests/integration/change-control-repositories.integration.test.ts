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
  CreateAppliedAgreementResolutionData,
  CreateAppliedAgreementVersionData,
  CreateChangeProposalDecisionData,
  CreateChangeProposalVersionData,
  CreateChangeRequestClosureData,
  CreateChangeRequestData,
} from "@/change-control/application/ports/change-control-lifecycle-repository";
import {
  prismaChangeControlHistoryRepository,
} from "@/change-control/infrastructure/prisma-change-control-history-repository";
import {
  prismaChangeControlLifecycleRepository,
} from "@/change-control/infrastructure/prisma-change-control-lifecycle-repository";
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

const STYLE_A_ONE_ID =
  randomUUID();

const STYLE_A_TWO_ID =
  randomUUID();

const STYLE_A_OTHER_GARMENT_ID =
  randomUUID();

const BASELINE_AGREEMENT_ID =
  randomUUID();

const BASELINE_RESOLUTION_ID =
  randomUUID();

function assertDedicatedTestDatabase():
  void {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for V0.6 change-control repository tests.",
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
      `Refusing V0.6 change-control repository tests against non-test database "${databaseName}".`,
    );
  }
}

function requestData(
  overrides:
    Partial<CreateChangeRequestData> = {},
): CreateChangeRequestData {
  return {
    businessId:
      BUSINESS_A_ID,
    clientId:
      CLIENT_A_ID,
    orderId:
      ORDER_A_ID,
    garmentId:
      GARMENT_A_ID,
    baselineAgreementVersionId:
      BASELINE_AGREEMENT_ID,
    requestedBy:
      "CLIENT",
    origin:
      "BUSINESS_RECORDED",
    requestChannel:
      "WHATSAPP",
    description:
      "Add long sleeves",
    requestedAt:
      new Date(
        "2026-09-10T09:00:00.000Z",
      ),
    recordedByMembershipId:
      MEMBERSHIP_A_ID,
    ...overrides,
  };
}

function proposalData(
  changeRequestId: string,
  overrides:
    Partial<CreateChangeProposalVersionData> = {},
): CreateChangeProposalVersionData {
  return {
    businessId:
      BUSINESS_A_ID,
    changeRequestId,
    clientId:
      CLIENT_A_ID,
    orderId:
      ORDER_A_ID,
    garmentId:
      GARMENT_A_ID,
    baselineAgreementVersionId:
      BASELINE_AGREEMENT_ID,
    revisionNumber:
      1,
    supersedesChangeProposalVersionId:
      null,
    measurementVersionId:
      MEASUREMENT_A_ID,
    designSummary:
      "Structured long sleeve gown",
    fabricDescription:
      "Client supplied Ankara",
    quantity:
      1,
    priceAmount:
      "90000.5000",
    currency:
      "NGN",
    deliveryDate:
      "2026-10-23",
    note:
      "Change-control repository test",
    styleReferenceIds: [
      STYLE_A_TWO_ID,
      STYLE_A_ONE_ID,
    ],
    rationale:
      "Sleeves affect price and delivery.",
    createdByMembershipId:
      MEMBERSHIP_A_ID,
    ...overrides,
  };
}

function decisionData(
  changeProposalVersionId:
    string,
  overrides:
    Partial<CreateChangeProposalDecisionData> = {},
): CreateChangeProposalDecisionData {
  return {
    businessId:
      BUSINESS_A_ID,
    changeProposalVersionId,
    outcome:
      "APPROVED",
    occurredAt:
      new Date(
        "2026-09-10T10:00:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    decisionSource:
      "BUSINESS_RECORDED",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote:
      "Client approved on WhatsApp.",
    recordedByMembershipId:
      MEMBERSHIP_A_ID,
    portalGrantId:
      null,
    ...overrides,
  };
}

function appliedAgreementData(
  overrides:
    Partial<CreateAppliedAgreementVersionData> = {},
): CreateAppliedAgreementVersionData {
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
      2,
    supersedesAgreementVersionId:
      BASELINE_AGREEMENT_ID,
    measurementVersionId:
      MEASUREMENT_A_ID,
    designSummary:
      "Structured long sleeve gown",
    fabricDescription:
      "Client supplied Ankara",
    quantity:
      1,
    priceAmount:
      "90000.5000",
    currency:
      "NGN",
    deliveryDate:
      "2026-10-23",
    note:
      "Change-control repository test",
    styleReferenceIds: [
      STYLE_A_TWO_ID,
      STYLE_A_ONE_ID,
    ],
    ...overrides,
  };
}

function appliedResolutionData(
  agreementVersionId: string,
  overrides:
    Partial<CreateAppliedAgreementResolutionData> = {},
): CreateAppliedAgreementResolutionData {
  return {
    businessId:
      BUSINESS_A_ID,
    agreementVersionId,
    outcome:
      "APPROVED",
    occurredAt:
      new Date(
        "2026-09-10T10:01:00.000Z",
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

function closureData(
  changeRequestId: string,
  overrides:
    Partial<CreateChangeRequestClosureData> = {},
): CreateChangeRequestClosureData {
  return {
    businessId:
      BUSINESS_A_ID,
    changeRequestId,
    outcome:
      "WITHDRAWN",
    reason:
      "Client withdrew the requested change.",
    occurredAt:
      new Date(
        "2026-09-10T11:00:00.000Z",
      ),
    recordedByMembershipId:
      MEMBERSHIP_A_ID,
    ...overrides,
  };
}

async function cleanupMutations():
  Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM "change_proposal_decision"
    WHERE "businessId" =
      ${BUSINESS_A_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "change_request_closure"
    WHERE "businessId" =
      ${BUSINESS_A_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "client_portal_grant"
    WHERE "businessId" =
      ${BUSINESS_A_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "change_proposal_style_reference"
    WHERE "businessId" =
      ${BUSINESS_A_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "change_proposal_version"
    WHERE "businessId" =
      ${BUSINESS_A_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "change_request"
    WHERE "businessId" =
      ${BUSINESS_A_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "agreement_resolution"
    WHERE "businessId" =
      ${BUSINESS_A_ID}::uuid
      AND "agreementVersionId" <>
        ${BASELINE_AGREEMENT_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "agreement_style_reference"
    WHERE "businessId" =
      ${BUSINESS_A_ID}::uuid
  `;

  await prisma.$executeRaw`
    DELETE FROM "agreement_version"
    WHERE "businessId" =
      ${BUSINESS_A_ID}::uuid
      AND "id" <>
        ${BASELINE_AGREEMENT_ID}::uuid
  `;
}

async function countRows(
  table:
    | "change_request"
    | "change_proposal_version"
    | "change_proposal_style_reference"
    | "change_proposal_decision"
    | "change_request_closure",
): Promise<number> {
  const rows =
    await prisma.$queryRawUnsafe<
      Array<{
        count: number;
      }>
    >(
      `
        SELECT COUNT(*)::int AS count
        FROM "${table}"
        WHERE "businessId" = $1::uuid
      `,
      BUSINESS_A_ID,
    );

  return rows[0]?.count ?? 0;
}

async function countAppliedAgreements():
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
        AND "id" <>
          ${BASELINE_AGREEMENT_ID}::uuid
    `;

  return rows[0]?.count ?? 0;
}

async function countAppliedResolutions():
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
        AND "agreementVersionId" <>
          ${BASELINE_AGREEMENT_ID}::uuid
    `;

  return rows[0]?.count ?? 0;
}

async function activeSlotFor(
  changeRequestId: string,
): Promise<string | null | undefined> {
  const record =
    await prisma.changeRequest.findFirst({
      where: {
        id:
          changeRequestId,
        businessId:
          BUSINESS_A_ID,
      },
      select: {
        activeSlot: true,
      },
    });

  return record?.activeSlot;
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
  "change-control Prisma lifecycle repository",
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
          'V0.6 Repository Business A',
          NOW(),
          NOW()
        ),
        (
          ${BUSINESS_B_ID}::uuid,
          'V0.6 Repository Business B',
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
          'V0.6 Repository User A',
          ${`v06-repo-a-${USER_A_ID}@example.test`},
          false,
          NOW(),
          NOW()
        ),
        (
          ${USER_B_ID}::uuid,
          'V0.6 Repository User B',
          ${`v06-repo-b-${USER_B_ID}@example.test`},
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
          '08000000701',
          NOW(),
          NOW()
        ),
        (
          ${CLIENT_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          'Repository Client B',
          '08000000702',
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
          'V0.6 Repository Garment A',
          NOW(),
          NOW()
        ),
        (
          ${GARMENT_A_OTHER_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${ORDER_A_OTHER_ID}::uuid,
          'V0.6 Repository Other Garment',
          NOW(),
          NOW()
        ),
        (
          ${GARMENT_B_ID}::uuid,
          ${BUSINESS_B_ID}::uuid,
          ${ORDER_B_ID}::uuid,
          'V0.6 Repository Garment B',
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
          'https://example.com/v06-repository-style-one.jpg',
          NOW()
        ),
        (
          ${STYLE_A_TWO_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${GARMENT_A_ID}::uuid,
          'https://example.com/v06-repository-style-two.jpg',
          NOW()
        ),
        (
          ${STYLE_A_OTHER_GARMENT_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${GARMENT_A_OTHER_ID}::uuid,
          'https://example.com/v06-repository-other-garment.jpg',
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
          "measurementVersionId",
          "designSummary",
          "fabricDescription",
          "quantity",
          "priceAmount",
          "currency",
          "deliveryDate",
          "note",
          "createdAt"
        )
        VALUES (
          ${BASELINE_AGREEMENT_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${CLIENT_A_ID}::uuid,
          ${ORDER_A_ID}::uuid,
          ${GARMENT_A_ID}::uuid,
          1,
          ${MEASUREMENT_A_ID}::uuid,
          'Approved baseline gown',
          'Client supplied Ankara',
          1,
          80000,
          'NGN',
          DATE '2026-10-20',
          'V0.6 repository baseline',
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
        VALUES (
          ${BASELINE_RESOLUTION_ID}::uuid,
          ${BUSINESS_A_ID}::uuid,
          ${BASELINE_AGREEMENT_ID}::uuid,
          'APPROVED',
          TIMESTAMPTZ '2026-09-10 08:00:00+00',
          'Ada Okafor',
          'WHATSAPP',
          'Approved baseline evidence.',
          ${MEMBERSHIP_A_ID}::uuid,
          NOW()
        )
      `;
    });

    afterEach(async () => {
      await cleanupMutations();
    });

    afterAll(async () => {
      await cleanupMutations();

      await prisma.$executeRaw`
        DELETE FROM "agreement_resolution"
        WHERE "id" =
          ${BASELINE_RESOLUTION_ID}::uuid
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
      "persists and reads an active ChangeRequest inside the Garment lifecycle",
      async () => {
        const result =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const latestAgreement =
                  await session
                    .findLatestAgreementVersion();

                expect(
                  latestAgreement?.id,
                ).toBe(
                  BASELINE_AGREEMENT_ID,
                );

                const resolution =
                  await session
                    .findAgreementResolutionForVersion(
                      BASELINE_AGREEMENT_ID,
                    );

                expect(
                  resolution?.outcome,
                ).toBe(
                  "APPROVED",
                );

                const created =
                  await session
                    .createChangeRequest(
                      requestData(),
                    );

                const active =
                  await session
                    .findActiveChangeRequest();

                return {
                  created,
                  active,
                };
              },
            );

        expect(
          result.active,
        ).toEqual(
          result.created,
        );

        expect(
          result.created.description,
        ).toBe(
          "Add long sleeves",
        );
      },
    );

    it(
      "persists a ChangeProposalVersion with exact immutable style references",
      async () => {
        const proposal =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const request =
                  await session
                    .createChangeRequest(
                      requestData(),
                    );

                return session
                  .createChangeProposalVersion(
                    proposalData(
                      request.id,
                    ),
                  );
              },
            );

        expect(
          proposal.revisionNumber,
        ).toBe(1);

        expect(
          proposal.priceAmount,
        ).toBe("90000.5");

        expect(
          proposal.deliveryDate,
        ).toBe("2026-10-23");

        expect(
          proposal.styleReferenceIds,
        ).toEqual(
          [
            STYLE_A_ONE_ID,
            STYLE_A_TWO_ID,
          ].sort(),
        );
      },
    );

    it(
      "persists and reads one ChangeProposalDecision",
      async () => {
        const result =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const request =
                  await session
                    .createChangeRequest(
                      requestData(),
                    );

                const proposal =
                  await session
                    .createChangeProposalVersion(
                      proposalData(
                        request.id,
                      ),
                    );

                const created =
                  await session
                    .createChangeProposalDecision(
                      decisionData(
                        proposal.id,
                      ),
                    );

                const found =
                  await session
                    .findDecisionForProposal(
                      proposal.id,
                    );

                return {
                  created,
                  found,
                };
              },
            );

        expect(
          result.found,
        ).toEqual(
          result.created,
        );
      },
    );

    it(
      "persists a closure and releases the active ChangeRequest slot",
      async () => {
        const result =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const request =
                  await session
                    .createChangeRequest(
                      requestData(),
                    );

                const closure =
                  await session
                    .createChangeRequestClosure(
                      closureData(
                        request.id,
                      ),
                    );

                await session
                  .releaseActiveChangeRequest(
                    request.id,
                  );

                const active =
                  await session
                    .findActiveChangeRequest();

                const foundClosure =
                  await session
                    .findClosureForRequest(
                      request.id,
                    );

                return {
                  request,
                  closure,
                  active,
                  foundClosure,
                };
              },
            );

        expect(
          result.active,
        ).toBeNull();

        expect(
          result.foundClosure,
        ).toEqual(
          result.closure,
        );

        expect(
          await activeSlotFor(
            result.request.id,
          ),
        ).toBeNull();
      },
    );

    it(
      "persists a complete applied change atomically",
      async () => {
        const result =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const request =
                  await session
                    .createChangeRequest(
                      requestData(),
                    );

                const proposal =
                  await session
                    .createChangeProposalVersion(
                      proposalData(
                        request.id,
                      ),
                    );

                const decision =
                  await session
                    .createChangeProposalDecision(
                      decisionData(
                        proposal.id,
                      ),
                    );

                const agreementVersion =
                  await session
                    .createAppliedAgreementVersion(
                      appliedAgreementData(),
                    );

                const agreementResolution =
                  await session
                    .createAppliedAgreementResolution(
                      appliedResolutionData(
                        agreementVersion.id,
                      ),
                    );

                await session
                  .releaseActiveChangeRequest(
                    request.id,
                  );

                return {
                  request,
                  proposal,
                  decision,
                  agreementVersion,
                  agreementResolution,
                };
              },
            );

        expect(
          result.agreementVersion
            .revisionNumber,
        ).toBe(2);

        expect(
          result.agreementVersion
            .supersedesAgreementVersionId,
        ).toBe(
          BASELINE_AGREEMENT_ID,
        );

        expect(
          result.agreementVersion
            .styleReferenceIds,
        ).toEqual(
          [
            STYLE_A_ONE_ID,
            STYLE_A_TWO_ID,
          ].sort(),
        );

        expect(
          result.agreementResolution
            .outcome,
        ).toBe(
          "APPROVED",
        );

        expect(
          await activeSlotFor(
            result.request.id,
          ),
        ).toBeNull();

        expect(
          await countRows(
            "change_proposal_decision",
          ),
        ).toBe(1);

        expect(
          await countAppliedAgreements(),
        ).toBe(1);

        expect(
          await countAppliedResolutions(),
        ).toBe(1);
      },
    );

    it(
      "rolls back a ChangeProposalVersion when an immutable style association fails",
      async () => {
        await expect(
          prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const request =
                  await session
                    .createChangeRequest(
                      requestData(),
                    );

                await session
                  .createChangeProposalVersion(
                    proposalData(
                      request.id,
                      {
                        styleReferenceIds: [
                          STYLE_A_ONE_ID,
                          STYLE_A_OTHER_GARMENT_ID,
                        ],
                      },
                    ),
                  );
              },
            ),
        ).rejects.toThrow();

        expect(
          await countRows(
            "change_request",
          ),
        ).toBe(0);

        expect(
          await countRows(
            "change_proposal_version",
          ),
        ).toBe(0);

        expect(
          await countRows(
            "change_proposal_style_reference",
          ),
        ).toBe(0);
      },
    );

    it(
      "rolls back the complete applied change when the lifecycle transaction fails after slot release",
      async () => {
        const request =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              (session) =>
                session
                  .createChangeRequest(
                    requestData(),
                  ),
            );

        const proposal =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              (session) =>
                session
                  .createChangeProposalVersion(
                    proposalData(
                      request.id,
                    ),
                  ),
            );

        await expect(
          prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                await session
                  .createChangeProposalDecision(
                    decisionData(
                      proposal.id,
                    ),
                  );

                const agreementVersion =
                  await session
                    .createAppliedAgreementVersion(
                      appliedAgreementData(),
                    );

                await session
                  .createAppliedAgreementResolution(
                    appliedResolutionData(
                      agreementVersion.id,
                    ),
                  );

                await session
                  .releaseActiveChangeRequest(
                    request.id,
                  );

                throw new Error(
                  "Force rollback after complete applied change persistence.",
                );
              },
            ),
        ).rejects.toThrow(
          "Force rollback after complete applied change persistence.",
        );

        expect(
          await countRows(
            "change_proposal_decision",
          ),
        ).toBe(0);

        expect(
          await countAppliedAgreements(),
        ).toBe(0);

        expect(
          await countAppliedResolutions(),
        ).toBe(0);

        expect(
          await activeSlotFor(
            request.id,
          ),
        ).toBe(
          "ACTIVE",
        );
      },
    );

    it(
      "refuses an inaccessible Garment lifecycle scope before invoking the callback",
      async () => {
        let callbackInvoked =
          false;

        await expect(
          prismaChangeControlLifecycleRepository
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

        let secondObservedRequestId:
          string | null =
          null;

        const firstOperation =
          prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                expect(
                  await session
                    .findActiveChangeRequest(),
                ).toBeNull();

                signalFirstEntered?.();

                await firstRelease;

                return session
                  .createChangeRequest(
                    requestData(),
                  );
              },
            );

        await firstEntered;

        const secondOperation =
          prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                signalSecondEntered?.();

                const active =
                  await session
                    .findActiveChangeRequest();

                secondObservedRequestId =
                  active?.id ??
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
        ).toBe(
          "blocked",
        );

        releaseFirst?.();

        const firstRequest =
          await firstOperation;

        await secondOperation;

        expect(
          secondObservedRequestId,
        ).toBe(
          firstRequest.id,
        );
      },
    );
    it(
      "lists ChangeRequests in stable chronological order",
      async () => {
        const first =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const created =
                  await session
                    .createChangeRequest(
                      requestData({
                        requestedAt:
                          new Date(
                            "2026-09-10T09:00:00.000Z",
                          ),
                      }),
                    );

                await session
                  .createChangeRequestClosure(
                    closureData(
                      created.id,
                      {
                        occurredAt:
                          new Date(
                            "2026-09-10T09:30:00.000Z",
                          ),
                      },
                    ),
                  );

                await session
                  .releaseActiveChangeRequest(
                    created.id,
                  );

                return created;
              },
            );

        const second =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              (session) =>
                session
                  .createChangeRequest(
                    requestData({
                      requestedAt:
                        new Date(
                          "2026-09-10T10:00:00.000Z",
                        ),
                    }),
                  ),
            );

        const requests =
          await prismaChangeControlHistoryRepository
            .listRequestsForGarment({
              businessId:
                BUSINESS_A_ID,
              garmentId:
                GARMENT_A_ID,
            });

        expect(
          requests.map(
            (request) =>
              request.id,
          ),
        ).toEqual([
          first.id,
          second.id,
        ]);
      },
    );

    it(
      "reads proposal revisions, decisions, and closures through the history repository",
      async () => {
        const result =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const request =
                  await session
                    .createChangeRequest(
                      requestData(),
                    );

                const firstProposal =
                  await session
                    .createChangeProposalVersion(
                      proposalData(
                        request.id,
                      ),
                    );

                const firstDecision =
                  await session
                    .createChangeProposalDecision(
                      decisionData(
                        firstProposal.id,
                        {
                          outcome:
                            "REJECTED",
                        },
                      ),
                    );

                const secondProposal =
                  await session
                    .createChangeProposalVersion(
                      proposalData(
                        request.id,
                        {
                          revisionNumber:
                            2,
                          supersedesChangeProposalVersionId:
                            firstProposal.id,
                          rationale:
                            "Revised commercial proposal.",
                        },
                      ),
                    );

                return {
                  request,
                  firstProposal,
                  firstDecision,
                  secondProposal,
                };
              },
            );

        const proposals =
          await prismaChangeControlHistoryRepository
            .listProposalsForRequest({
              businessId:
                BUSINESS_A_ID,
              changeRequestId:
                result.request.id,
            });

        expect(
          proposals.map(
            (proposal) =>
              proposal.id,
          ),
        ).toEqual([
          result.firstProposal.id,
          result.secondProposal.id,
        ]);

        expect(
          proposals.map(
            (proposal) =>
              proposal.revisionNumber,
          ),
        ).toEqual([
          1,
          2,
        ]);

        const decision =
          await prismaChangeControlHistoryRepository
            .findDecisionForProposal({
              businessId:
                BUSINESS_A_ID,
              changeProposalVersionId:
                result.firstProposal.id,
            });

        expect(
          decision,
        ).toEqual(
          result.firstDecision,
        );

        const closure =
          await prismaChangeControlHistoryRepository
            .findClosureForRequest({
              businessId:
                BUSINESS_A_ID,
              changeRequestId:
                result.request.id,
            });

        expect(
          closure,
        ).toBeNull();
      },
    );

    it(
      "keeps ChangeControl history reads tenant scoped",
      async () => {
        const result =
          await prismaChangeControlLifecycleRepository
            .withGarmentLifecycle(
              {
                businessId:
                  BUSINESS_A_ID,
                garmentId:
                  GARMENT_A_ID,
              },
              async (session) => {
                const request =
                  await session
                    .createChangeRequest(
                      requestData(),
                    );

                const proposal =
                  await session
                    .createChangeProposalVersion(
                      proposalData(
                        request.id,
                      ),
                    );

                const decision =
                  await session
                    .createChangeProposalDecision(
                      decisionData(
                        proposal.id,
                        {
                          outcome:
                            "REJECTED",
                        },
                      ),
                    );

                const closure =
                  await session
                    .createChangeRequestClosure(
                      closureData(
                        request.id,
                      ),
                    );

                return {
                  request,
                  proposal,
                  decision,
                  closure,
                };
              },
            );

        expect(
          await prismaChangeControlHistoryRepository
            .listRequestsForGarment({
              businessId:
                BUSINESS_B_ID,
              garmentId:
                GARMENT_A_ID,
            }),
        ).toEqual([]);

        expect(
          await prismaChangeControlHistoryRepository
            .listProposalsForRequest({
              businessId:
                BUSINESS_B_ID,
              changeRequestId:
                result.request.id,
            }),
        ).toEqual([]);

        expect(
          await prismaChangeControlHistoryRepository
            .findDecisionForProposal({
              businessId:
                BUSINESS_B_ID,
              changeProposalVersionId:
                result.proposal.id,
            }),
        ).toBeNull();

        expect(
          await prismaChangeControlHistoryRepository
            .findClosureForRequest({
              businessId:
                BUSINESS_B_ID,
              changeRequestId:
                result.request.id,
            }),
        ).toBeNull();
      },
    );

  },
);
