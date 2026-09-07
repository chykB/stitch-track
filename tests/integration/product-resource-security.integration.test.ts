import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  createClientForTenant,
  type CreateClientRequest,
} from "@/client/application/use-cases/create-client";
import {
  getClientForTenant,
} from "@/client/application/use-cases/get-client";
import {
  prismaClientRepository,
} from "@/client/infrastructure/prisma-client-repository";
import {
  createGarmentForTenant,
} from "@/garment/application/use-cases/create-garment";
import {
  getGarmentForTenant,
} from "@/garment/application/use-cases/get-garment";
import {
  prismaGarmentRepository,
} from "@/garment/infrastructure/prisma-garment-repository";
import {
  createOrderForTenant,
} from "@/order/application/use-cases/create-order";
import {
  getOrderForTenant,
} from "@/order/application/use-cases/get-order";
import {
  prismaOrderRepository,
} from "@/order/infrastructure/prisma-order-repository";
import {
  resolveAuthorizedTenantContext,
  type ResolveAuthorizedTenantContextInput,
} from "@/shared/application/authorization/resolve-authorized-tenant-context";
import { prisma } from "@/shared/database/prisma";
import {
  prismaTenantMembershipReader,
} from "@/shared/infrastructure/tenancy/prisma-tenant-membership-reader";

const OWNER_A_USER_ID =
  "81111111-1111-4111-8111-111111111111";
const MEMBER_A_USER_ID =
  "82222222-2222-4222-8222-222222222222";

const BUSINESS_A_ID =
  "8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BUSINESS_B_ID =
  "8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const OWNER_A_MEMBERSHIP_ID =
  "83333333-3333-4333-8333-333333333333";
const MEMBER_A_MEMBERSHIP_ID =
  "84444444-4444-4444-8444-444444444444";

const TEST_USER_IDS = [
  OWNER_A_USER_ID,
  MEMBER_A_USER_ID,
];

const TEST_BUSINESS_IDS = [
  BUSINESS_A_ID,
  BUSINESS_B_ID,
];

let clientAId: string;
let clientBId: string;

let orderAId: string;
let orderBId: string;

let garmentAId: string;
let garmentBId: string;

function assertDedicatedTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for product resource security tests.",
    );
  }

  const databaseName =
    new URL(databaseUrl).pathname.slice(1);

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing product resource security tests against non-test database "${databaseName}".`,
    );
  }
}

async function cleanupFixtures(): Promise<void> {
  await prisma.garment.deleteMany({
    where: {
      businessId: {
        in: TEST_BUSINESS_IDS,
      },
    },
  });

  await prisma.order.deleteMany({
    where: {
      businessId: {
        in: TEST_BUSINESS_IDS,
      },
    },
  });

  await prisma.client.deleteMany({
    where: {
      businessId: {
        in: TEST_BUSINESS_IDS,
      },
    },
  });

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

async function resolveOwnerAContext() {
  return resolveAuthorizedTenantContext(
    prismaTenantMembershipReader,
    {
      authenticatedUserId:
        OWNER_A_USER_ID,
      requestedBusinessId:
        BUSINESS_A_ID,
    },
    ["OWNER"],
  );
}

beforeAll(async () => {
  assertDedicatedTestDatabase();

  await cleanupFixtures();

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: OWNER_A_USER_ID,
        name: "Product Security Owner A",
        email:
          "product-security-owner-a@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.user.create({
      data: {
        id: MEMBER_A_USER_ID,
        name: "Product Security Member A",
        email:
          "product-security-member-a@example.invalid",
        emailVerified: false,
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_A_ID,
        name: "Product Security Business A",
      },
    }),

    prisma.business.create({
      data: {
        id: BUSINESS_B_ID,
        name: "Product Security Business B",
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
  ]);

  const clientA =
    await prismaClientRepository.create({
      businessId: BUSINESS_A_ID,
      name: "Client A",
      phone: "08010000001",
      email: null,
    });

  const clientB =
    await prismaClientRepository.create({
      businessId: BUSINESS_B_ID,
      name: "Client B",
      phone: "08010000002",
      email: null,
    });

  clientAId = clientA.id;
  clientBId = clientB.id;

  const orderA =
    await prismaOrderRepository.create({
      businessId: BUSINESS_A_ID,
      clientId: clientAId,
    });

  const orderB =
    await prismaOrderRepository.create({
      businessId: BUSINESS_B_ID,
      clientId: clientBId,
    });

  orderAId = orderA.id;
  orderBId = orderB.id;

  const garmentA =
    await prismaGarmentRepository.create({
      businessId: BUSINESS_A_ID,
      orderId: orderAId,
      name: "Garment A",
    });

  const garmentB =
    await prismaGarmentRepository.create({
      businessId: BUSINESS_B_ID,
      orderId: orderBId,
      name: "Garment B",
    });

  garmentAId = garmentA.id;
  garmentBId = garmentB.id;
});

afterAll(async () => {
  await cleanupFixtures();
  await prisma.$disconnect();
});

describe("product resource cross-tenant security", () => {
  it("allows an authorized Business A owner to read Business A resources", async () => {
    const tenantContext =
      await resolveOwnerAContext();

    const client =
      await getClientForTenant(
        prismaClientRepository,
        tenantContext,
        {
          clientId: clientAId,
        },
      );

    const order =
      await getOrderForTenant(
        prismaOrderRepository,
        tenantContext,
        {
          orderId: orderAId,
        },
      );

    const garment =
      await getGarmentForTenant(
        prismaGarmentRepository,
        tenantContext,
        {
          garmentId: garmentAId,
        },
      );

    expect(client.businessId)
      .toBe(BUSINESS_A_ID);

    expect(order.businessId)
      .toBe(BUSINESS_A_ID);

    expect(garment.businessId)
      .toBe(BUSINESS_A_ID);
  });

  it("returns NOT_FOUND for a Business B Client UUID under Business A context", async () => {
    const tenantContext =
      await resolveOwnerAContext();

    await expect(
      getClientForTenant(
        prismaClientRepository,
        tenantContext,
        {
          clientId: clientBId,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("returns NOT_FOUND for a Business B Order UUID under Business A context", async () => {
    const tenantContext =
      await resolveOwnerAContext();

    await expect(
      getOrderForTenant(
        prismaOrderRepository,
        tenantContext,
        {
          orderId: orderBId,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("returns NOT_FOUND for a Business B Garment UUID under Business A context", async () => {
    const tenantContext =
      await resolveOwnerAContext();

    await expect(
      getGarmentForTenant(
        prismaGarmentRepository,
        tenantContext,
        {
          garmentId: garmentBId,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("rejects a Business B Client as an Order parent and creates no Order", async () => {
    const tenantContext =
      await resolveOwnerAContext();

    const beforeCount =
      await prisma.order.count({
        where: {
          businessId: BUSINESS_A_ID,
        },
      });

    await expect(
      createOrderForTenant(
        prismaClientRepository,
        prismaOrderRepository,
        tenantContext,
        {
          clientId: clientBId,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    const afterCount =
      await prisma.order.count({
        where: {
          businessId: BUSINESS_A_ID,
        },
      });

    expect(afterCount)
      .toBe(beforeCount);
  });

  it("rejects a Business B Order as a Garment parent and creates no Garment", async () => {
    const tenantContext =
      await resolveOwnerAContext();

    const beforeCount =
      await prisma.garment.count({
        where: {
          businessId: BUSINESS_A_ID,
        },
      });

    await expect(
      createGarmentForTenant(
        prismaOrderRepository,
        prismaGarmentRepository,
        tenantContext,
        {
          orderId: orderBId,
          name: "Forged foreign garment",
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    const afterCount =
      await prisma.garment.count({
        where: {
          businessId: BUSINESS_A_ID,
        },
      });

    expect(afterCount)
      .toBe(beforeCount);
  });

  it("ignores a forged Business identifier during Client creation", async () => {
    const tenantContext =
      await resolveOwnerAContext();

    const forgedRequest:
      CreateClientRequest & {
        businessId: string;
      } = {
        businessId: BUSINESS_B_ID,
        name: "Forged Tenant Client",
        phone: "08010000003",
        email: null,
      };

    const client =
      await createClientForTenant(
        prismaClientRepository,
        tenantContext,
        forgedRequest,
      );

    expect(client.businessId)
      .toBe(BUSINESS_A_ID);

    expect(client.businessId)
      .not.toBe(BUSINESS_B_ID);
  });

  it("does not let forged role and membership identifiers override database authorization", async () => {
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
});
