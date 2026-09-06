import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  resolveAuthorizedTenantContext,
} from "../../src/shared/application/authorization/resolve-authorized-tenant-context";
import { prisma } from "../../src/shared/database/prisma";
import {
  prismaTenantMembershipReader,
} from "../../src/shared/infrastructure/tenancy/prisma-tenant-membership-reader";

const OWNER_USER_ID =
  "61111111-1111-4111-8111-111111111111";
const MEMBER_USER_ID =
  "62222222-2222-4222-8222-222222222222";

const BUSINESS_ID =
  "6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const OWNER_MEMBERSHIP_ID =
  "63333333-3333-4333-8333-333333333333";
const MEMBER_MEMBERSHIP_ID =
  "64444444-4444-4444-8444-444444444444";

const TEST_USER_IDS = [
  OWNER_USER_ID,
  MEMBER_USER_ID,
];

function assertDedicatedTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for authorization integration tests.",
    );
  }

  const databaseName =
    new URL(databaseUrl).pathname.slice(1);

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing authorization integration tests against non-test database "${databaseName}".`,
    );
  }
}

async function cleanupFixtures(): Promise<void> {
  await prisma.businessMember.deleteMany({
    where: {
      businessId: BUSINESS_ID,
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: TEST_USER_IDS,
      },
    },
  });

  await prisma.business.deleteMany({
    where: {
      id: BUSINESS_ID,
    },
  });
}

beforeAll(async () => {
  assertDedicatedTestDatabase();

  await cleanupFixtures();

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: OWNER_USER_ID,
        name: "Authorization Owner",
        email:
          "authorization-owner@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.user.create({
      data: {
        id: MEMBER_USER_ID,
        name: "Authorization Member",
        email:
          "authorization-member@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_ID,
        name:
          "Authorization Integration Business",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: OWNER_MEMBERSHIP_ID,
        businessId: BUSINESS_ID,
        userId: OWNER_USER_ID,
        role: "OWNER",
        status: "ACTIVE",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: MEMBER_MEMBERSHIP_ID,
        businessId: BUSINESS_ID,
        userId: MEMBER_USER_ID,
        role: "MEMBER",
        status: "ACTIVE",
      },
    }),
  ]);
});

afterAll(async () => {
  await cleanupFixtures();
  await prisma.$disconnect();
});

describe("tenant authorization integration", () => {
  it("allows the database-backed OWNER role for OWNER-only actions", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            OWNER_USER_ID,
          requestedBusinessId:
            BUSINESS_ID,
        },
        ["OWNER"],
      ),
    ).resolves.toMatchObject({
      userId: OWNER_USER_ID,
      businessId: BUSINESS_ID,
      membershipId:
        OWNER_MEMBERSHIP_ID,
      role: "OWNER",
    });
  });

  it("rejects the database-backed MEMBER role for OWNER-only actions", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            MEMBER_USER_ID,
          requestedBusinessId:
            BUSINESS_ID,
        },
        ["OWNER"],
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "You do not have permission to perform this action.",
    });
  });

  it("allows the same MEMBER when the action permits MEMBER", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            MEMBER_USER_ID,
          requestedBusinessId:
            BUSINESS_ID,
        },
        [
            "OWNER",
            "MEMBER",
          ],
      ),
    ).resolves.toMatchObject({
      role: "MEMBER",
      membershipId:
        MEMBER_MEMBERSHIP_ID,
    });
  });
});
