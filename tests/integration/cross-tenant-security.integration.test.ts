import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  resolveAuthorizedTenantContext,
  type ResolveAuthorizedTenantContextInput,
} from "../../src/shared/application/authorization/resolve-authorized-tenant-context";
import { prisma } from "../../src/shared/database/prisma";
import {
  prismaTenantMembershipReader,
} from "../../src/shared/infrastructure/tenancy/prisma-tenant-membership-reader";

const OWNER_A_USER_ID =
  "71111111-1111-4111-8111-111111111111";
const MEMBER_A_USER_ID =
  "72222222-2222-4222-8222-222222222222";
const OWNER_B_USER_ID =
  "73333333-3333-4333-8333-333333333333";
const SUSPENDED_A_USER_ID =
  "74444444-4444-4444-8444-444444444444";
const MUTABLE_A_USER_ID =
  "75555555-5555-4555-8555-555555555555";

const BUSINESS_A_ID =
  "7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BUSINESS_B_ID =
  "7bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const NONEXISTENT_BUSINESS_ID =
  "7ccccccc-cccc-4ccc-8ccc-cccccccccccc";

const OWNER_A_MEMBERSHIP_ID =
  "76111111-1111-4111-8111-111111111111";
const MEMBER_A_MEMBERSHIP_ID =
  "76222222-2222-4222-8222-222222222222";
const OWNER_B_MEMBERSHIP_ID =
  "76333333-3333-4333-8333-333333333333";
const SUSPENDED_A_MEMBERSHIP_ID =
  "76444444-4444-4444-8444-444444444444";
const MUTABLE_A_MEMBERSHIP_ID =
  "76555555-5555-4555-8555-555555555555";

const TEST_USER_IDS = [
  OWNER_A_USER_ID,
  MEMBER_A_USER_ID,
  OWNER_B_USER_ID,
  SUSPENDED_A_USER_ID,
  MUTABLE_A_USER_ID,
];

const TEST_BUSINESS_IDS = [
  BUSINESS_A_ID,
  BUSINESS_B_ID,
];

function assertDedicatedTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for cross-tenant security tests.",
    );
  }

  const databaseName =
    new URL(databaseUrl).pathname.slice(1);

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing cross-tenant security tests against non-test database "${databaseName}".`,
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
        id: OWNER_A_USER_ID,
        name: "Security Owner A",
        email:
          "security-owner-a@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.user.create({
      data: {
        id: MEMBER_A_USER_ID,
        name: "Security Member A",
        email:
          "security-member-a@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.user.create({
      data: {
        id: OWNER_B_USER_ID,
        name: "Security Owner B",
        email:
          "security-owner-b@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.user.create({
      data: {
        id: SUSPENDED_A_USER_ID,
        name: "Security Suspended A",
        email:
          "security-suspended-a@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.user.create({
      data: {
        id: MUTABLE_A_USER_ID,
        name: "Security Mutable A",
        email:
          "security-mutable-a@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_A_ID,
        name: "Security Business A",
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_B_ID,
        name: "Security Business B",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: OWNER_A_MEMBERSHIP_ID,
        businessId: BUSINESS_A_ID,
        userId: OWNER_A_USER_ID,
        role: "OWNER",
        status: "ACTIVE",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: MEMBER_A_MEMBERSHIP_ID,
        businessId: BUSINESS_A_ID,
        userId: MEMBER_A_USER_ID,
        role: "MEMBER",
        status: "ACTIVE",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: OWNER_B_MEMBERSHIP_ID,
        businessId: BUSINESS_B_ID,
        userId: OWNER_B_USER_ID,
        role: "OWNER",
        status: "ACTIVE",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: SUSPENDED_A_MEMBERSHIP_ID,
        businessId: BUSINESS_A_ID,
        userId: SUSPENDED_A_USER_ID,
        role: "MEMBER",
        status: "SUSPENDED",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: MUTABLE_A_MEMBERSHIP_ID,
        businessId: BUSINESS_A_ID,
        userId: MUTABLE_A_USER_ID,
        role: "OWNER",
        status: "ACTIVE",
      },
    }),
  ]);
});

afterAll(async () => {
  await cleanupFixtures();
  await prisma.$disconnect();
});

describe("cross-tenant security boundary", () => {
  it("allows Business A OWNER to access Business A", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            OWNER_A_USER_ID,
          requestedBusinessId:
            BUSINESS_A_ID,
        },
        ["OWNER"],
      ),
    ).resolves.toMatchObject({
      userId: OWNER_A_USER_ID,
      businessId: BUSINESS_A_ID,
      role: "OWNER",
    });
  });

  it("rejects Business A OWNER attempting Business B", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            OWNER_A_USER_ID,
          requestedBusinessId:
            BUSINESS_B_ID,
        },
        ["OWNER"],
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "You do not have access to this business.",
    });
  });

  it("rejects Business B OWNER attempting Business A", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            OWNER_B_USER_ID,
          requestedBusinessId:
            BUSINESS_A_ID,
        },
        ["OWNER"],
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("does not let permissive action roles bypass tenant membership", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            MEMBER_A_USER_ID,
          requestedBusinessId:
            BUSINESS_B_ID,
        },
        ["OWNER", "MEMBER"],
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "You do not have access to this business.",
    });
  });

  it("ignores forged role and membership identifiers on request-like input", async () => {
    const forgedInput:
      ResolveAuthorizedTenantContextInput & {
        role: "OWNER";
        membershipId: string;
      } = {
        authenticatedUserId:
          MEMBER_A_USER_ID,
        requestedBusinessId:
          BUSINESS_A_ID,
        role: "OWNER",
        membershipId:
          OWNER_A_MEMBERSHIP_ID,
      };

    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        forgedInput,
        ["OWNER"],
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "You do not have permission to perform this action.",
    });
  });

  it("rejects a fabricated business ID", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            OWNER_A_USER_ID,
          requestedBusinessId:
            NONEXISTENT_BUSINESS_ID,
        },
        ["OWNER"],
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "You do not have access to this business.",
    });
  });

  it("rejects a suspended Business A membership", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            SUSPENDED_A_USER_ID,
          requestedBusinessId:
            BUSINESS_A_ID,
        },
        ["OWNER", "MEMBER"],
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "You do not have access to this business.",
    });
  });

  it("observes a database role demotion on the next authorization check", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            MUTABLE_A_USER_ID,
          requestedBusinessId:
            BUSINESS_A_ID,
        },
        ["OWNER"],
      ),
    ).resolves.toMatchObject({
      role: "OWNER",
    });

    await prisma.businessMember.update({
      where: {
        id: MUTABLE_A_MEMBERSHIP_ID,
      },
      data: {
        role: "MEMBER",
      },
    });

    try {
      await expect(
        resolveAuthorizedTenantContext(
          prismaTenantMembershipReader,
          {
            authenticatedUserId:
              MUTABLE_A_USER_ID,
            requestedBusinessId:
              BUSINESS_A_ID,
          },
          ["OWNER"],
        ),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message:
          "You do not have permission to perform this action.",
      });
    } finally {
      await prisma.businessMember.update({
        where: {
          id: MUTABLE_A_MEMBERSHIP_ID,
        },
        data: {
          role: "OWNER",
        },
      });
    }
  });

  it("observes membership suspension on the next tenant resolution", async () => {
    await expect(
      resolveAuthorizedTenantContext(
        prismaTenantMembershipReader,
        {
          authenticatedUserId:
            MUTABLE_A_USER_ID,
          requestedBusinessId:
            BUSINESS_A_ID,
        },
        ["OWNER"],
      ),
    ).resolves.toMatchObject({
      role: "OWNER",
    });

    await prisma.businessMember.update({
      where: {
        id: MUTABLE_A_MEMBERSHIP_ID,
      },
      data: {
        status: "SUSPENDED",
      },
    });

    try {
      await expect(
        resolveAuthorizedTenantContext(
          prismaTenantMembershipReader,
          {
            authenticatedUserId:
              MUTABLE_A_USER_ID,
            requestedBusinessId:
              BUSINESS_A_ID,
          },
          ["OWNER"],
        ),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message:
          "You do not have access to this business.",
      });
    } finally {
      await prisma.businessMember.update({
        where: {
          id: MUTABLE_A_MEMBERSHIP_ID,
        },
        data: {
          status: "ACTIVE",
        },
      });
    }
  });
});
