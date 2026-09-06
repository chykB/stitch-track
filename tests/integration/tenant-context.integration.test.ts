import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  ApplicationError,
} from "../../src/shared/application/errors/application-error";
import {
  resolveTenantContext,
} from "../../src/shared/application/tenancy/resolve-tenant-context";
import { prisma } from "../../src/shared/database/prisma";
import {
  prismaTenantMembershipReader,
} from "../../src/shared/infrastructure/tenancy/prisma-tenant-membership-reader";

const ACTIVE_USER_ID =
  "11111111-1111-4111-8111-111111111111";
const SUSPENDED_USER_ID =
  "22222222-2222-4222-8222-222222222222";
const NO_MEMBERSHIP_USER_ID =
  "33333333-3333-4333-8333-333333333333";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const NONEXISTENT_BUSINESS_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const ACTIVE_MEMBERSHIP_ID =
  "44444444-4444-4444-8444-444444444444";
const SUSPENDED_MEMBERSHIP_ID =
  "55555555-5555-4555-8555-555555555555";

const TEST_USER_IDS = [
  ACTIVE_USER_ID,
  SUSPENDED_USER_ID,
  NO_MEMBERSHIP_USER_ID,
];

const TEST_BUSINESS_IDS = [
  BUSINESS_A_ID,
  BUSINESS_B_ID,
];

function assertDedicatedTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for tenant integration tests.",
    );
  }

  const databaseName = new URL(databaseUrl).pathname.slice(1);

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing tenant integration tests against non-test database "${databaseName}".`,
    );
  }
}

async function cleanupFixtures(): Promise<void> {
  await prisma.businessMember.deleteMany({
    where: {
      OR: [
        {
          userId: {
            in: TEST_USER_IDS,
          },
        },
        {
          businessId: {
            in: TEST_BUSINESS_IDS,
          },
        },
      ],
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
      id: {
        in: TEST_BUSINESS_IDS,
      },
    },
  });
}

beforeAll(async () => {
  assertDedicatedTestDatabase();

  await cleanupFixtures();

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: ACTIVE_USER_ID,
        name: "Active Tenant User",
        email: "tenant-active@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.user.create({
      data: {
        id: SUSPENDED_USER_ID,
        name: "Suspended Tenant User",
        email: "tenant-suspended@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.user.create({
      data: {
        id: NO_MEMBERSHIP_USER_ID,
        name: "No Membership User",
        email: "tenant-none@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_A_ID,
        name: "Tenant Integration Business A",
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_B_ID,
        name: "Tenant Integration Business B",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: ACTIVE_MEMBERSHIP_ID,
        businessId: BUSINESS_A_ID,
        userId: ACTIVE_USER_ID,
        role: "OWNER",
        status: "ACTIVE",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: SUSPENDED_MEMBERSHIP_ID,
        businessId: BUSINESS_A_ID,
        userId: SUSPENDED_USER_ID,
        role: "MEMBER",
        status: "SUSPENDED",
      },
    }),
  ]);
});

afterAll(async () => {
  await cleanupFixtures();
  await prisma.$disconnect();
});

describe("Prisma tenant membership isolation", () => {
  it("returns an ACTIVE membership for the exact user and business", async () => {
    await expect(
      prismaTenantMembershipReader.findActiveMembership({
        userId: ACTIVE_USER_ID,
        businessId: BUSINESS_A_ID,
      }),
    ).resolves.toEqual({
      membershipId: ACTIVE_MEMBERSHIP_ID,
      userId: ACTIVE_USER_ID,
      businessId: BUSINESS_A_ID,
      role: "OWNER",
    });
  });

  it("does not return a SUSPENDED membership", async () => {
    await expect(
      prismaTenantMembershipReader.findActiveMembership({
        userId: SUSPENDED_USER_ID,
        businessId: BUSINESS_A_ID,
      }),
    ).resolves.toBeNull();
  });

  it("does not return membership when the authenticated user requests another business", async () => {
    await expect(
      prismaTenantMembershipReader.findActiveMembership({
        userId: ACTIVE_USER_ID,
        businessId: BUSINESS_B_ID,
      }),
    ).resolves.toBeNull();
  });

  it("does not return membership for a user with no membership", async () => {
    await expect(
      prismaTenantMembershipReader.findActiveMembership({
        userId: NO_MEMBERSHIP_USER_ID,
        businessId: BUSINESS_A_ID,
      }),
    ).resolves.toBeNull();
  });

  it("does not return membership for a nonexistent business", async () => {
    await expect(
      prismaTenantMembershipReader.findActiveMembership({
        userId: ACTIVE_USER_ID,
        businessId: NONEXISTENT_BUSINESS_ID,
      }),
    ).resolves.toBeNull();
  });

  it("resolves TenantContext only for the active exact membership", async () => {
    await expect(
      resolveTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId: ACTIVE_USER_ID,
          requestedBusinessId: BUSINESS_A_ID,
        },
      ),
    ).resolves.toEqual({
      membershipId: ACTIVE_MEMBERSHIP_ID,
      userId: ACTIVE_USER_ID,
      businessId: BUSINESS_A_ID,
      role: "OWNER",
    });
  });

  it.each([
    [
      "suspended membership",
      SUSPENDED_USER_ID,
      BUSINESS_A_ID,
    ],
    [
      "wrong business",
      ACTIVE_USER_ID,
      BUSINESS_B_ID,
    ],
    [
      "no membership",
      NO_MEMBERSHIP_USER_ID,
      BUSINESS_A_ID,
    ],
    [
      "nonexistent business",
      ACTIVE_USER_ID,
      NONEXISTENT_BUSINESS_ID,
    ],
  ])(
    "rejects TenantContext for %s",
    async (
      _caseName,
      userId,
      businessId,
    ) => {
      await expect(
        resolveTenantContext(
          prismaTenantMembershipReader,
          {
            authenticatedUserId: userId,
            requestedBusinessId: businessId,
          },
        ),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    },
  );

  it("does not reveal membership state through different application errors", async () => {
    const cases = [
      {
        userId: SUSPENDED_USER_ID,
        businessId: BUSINESS_A_ID,
      },
      {
        userId: ACTIVE_USER_ID,
        businessId: BUSINESS_B_ID,
      },
      {
        userId: NO_MEMBERSHIP_USER_ID,
        businessId: BUSINESS_A_ID,
      },
      {
        userId: ACTIVE_USER_ID,
        businessId: NONEXISTENT_BUSINESS_ID,
      },
    ];

    for (const testCase of cases) {
      try {
        await resolveTenantContext(
          prismaTenantMembershipReader,
          {
            authenticatedUserId: testCase.userId,
            requestedBusinessId:
              testCase.businessId,
          },
        );

        throw new Error(
          "Expected tenant resolution to be forbidden.",
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);

        expect(error).toMatchObject({
          code: "FORBIDDEN",
          message:
            "You do not have access to this business.",
        });
      }
    }
  });
});
