import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  listActiveBusinessesForUser,
} from "@/shared/application/tenancy/list-active-businesses";
import { prisma } from "@/shared/database/prisma";
import {
  prismaActiveBusinessReader,
} from "@/shared/infrastructure/tenancy/prisma-active-business-reader";

const USER_A_ID =
  "91111111-1111-4111-8111-111111111111";

const USER_B_ID =
  "92222222-2222-4222-8222-222222222222";

const BUSINESS_A_ID =
  "9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const BUSINESS_C_ID =
  "9ccccccc-cccc-4ccc-8ccc-cccccccccccc";

const MEMBERSHIP_A_ID =
  "93333333-3333-4333-8333-333333333333";

const MEMBERSHIP_B_ID =
  "94444444-4444-4444-8444-444444444444";

const MEMBERSHIP_C_ID =
  "95555555-5555-4555-8555-555555555555";

const TEST_USER_IDS = [
  USER_A_ID,
  USER_B_ID,
];

const TEST_BUSINESS_IDS = [
  BUSINESS_A_ID,
  BUSINESS_B_ID,
  BUSINESS_C_ID,
];

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
  await cleanupFixtures();

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: USER_A_ID,
        name: "Workspace User A",
        email:
          "workspace-user-a@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.user.create({
      data: {
        id: USER_B_ID,
        name: "Workspace User B",
        email:
          "workspace-user-b@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_A_ID,
        name: "Workspace Business A",
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_B_ID,
        name: "Workspace Business B",
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_C_ID,
        name: "Workspace Business C",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: MEMBERSHIP_A_ID,
        userId: USER_A_ID,
        businessId: BUSINESS_A_ID,
        role: "OWNER",
        status: "ACTIVE",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: MEMBERSHIP_B_ID,
        userId: USER_A_ID,
        businessId: BUSINESS_B_ID,
        role: "MEMBER",
        status: "SUSPENDED",
      },
    }),

    prisma.businessMember.create({
      data: {
        id: MEMBERSHIP_C_ID,
        userId: USER_B_ID,
        businessId: BUSINESS_C_ID,
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

describe("active Business discovery", () => {
  it("returns only ACTIVE Businesses belonging to the authenticated user", async () => {
    const businesses =
      await listActiveBusinessesForUser(
        prismaActiveBusinessReader,
        USER_A_ID,
      );

    expect(businesses).toEqual([
      {
        membershipId: MEMBERSHIP_A_ID,
        businessId: BUSINESS_A_ID,
        businessName:
          "Workspace Business A",
        role: "OWNER",
      },
    ]);
  });

  it("does not expose another user's ACTIVE Business", async () => {
    const businesses =
      await listActiveBusinessesForUser(
        prismaActiveBusinessReader,
        USER_A_ID,
      );

    expect(
      businesses.some(
        (business) =>
          business.businessId ===
          BUSINESS_C_ID,
      ),
    ).toBe(false);
  });

  it("does not expose a SUSPENDED membership", async () => {
    const businesses =
      await listActiveBusinessesForUser(
        prismaActiveBusinessReader,
        USER_A_ID,
      );

    expect(
      businesses.some(
        (business) =>
          business.businessId ===
          BUSINESS_B_ID,
      ),
    ).toBe(false);
  });
});
