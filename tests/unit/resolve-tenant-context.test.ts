import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ApplicationError,
} from "../../src/shared/application/errors/application-error";
import {
  resolveTenantContext,
} from "../../src/shared/application/tenancy/resolve-tenant-context";
import type {
  ActiveTenantMembership,
  TenantMembershipReader,
} from "../../src/shared/application/tenancy/tenant-membership-reader";

function createMembershipReader(
  membership: ActiveTenantMembership | null,
): TenantMembershipReader {
  return {
    findActiveMembership: vi
      .fn()
      .mockResolvedValue(membership),
  };
}

describe("resolveTenantContext", () => {
  it("rejects an unauthenticated request before reading membership", async () => {
    const membershipReader = createMembershipReader(null);

    await expect(
      resolveTenantContext(membershipReader, {
        authenticatedUserId: null,
        requestedBusinessId:
          "4b8b3608-8e8c-42eb-b454-262471d0334a",
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    expect(
      membershipReader.findActiveMembership,
    ).not.toHaveBeenCalled();
  });

  it("rejects an authenticated user without active membership", async () => {
    const membershipReader = createMembershipReader(null);

    await expect(
      resolveTenantContext(membershipReader, {
        authenticatedUserId:
          "60d6aa44-ca87-458d-b647-c80787e91a8a",
        requestedBusinessId:
          "4b8b3608-8e8c-42eb-b454-262471d0334a",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("resolves an active OWNER membership into TenantContext", async () => {
    const membershipReader = createMembershipReader({
      membershipId:
        "343ac59d-1100-40a9-9641-17b142f38681",
      userId:
        "60d6aa44-ca87-458d-b647-c80787e91a8a",
      businessId:
        "4b8b3608-8e8c-42eb-b454-262471d0334a",
      role: "OWNER",
    });

    await expect(
      resolveTenantContext(membershipReader, {
        authenticatedUserId:
          "60d6aa44-ca87-458d-b647-c80787e91a8a",
        requestedBusinessId:
          "4b8b3608-8e8c-42eb-b454-262471d0334a",
      }),
    ).resolves.toEqual({
      membershipId:
        "343ac59d-1100-40a9-9641-17b142f38681",
      userId:
        "60d6aa44-ca87-458d-b647-c80787e91a8a",
      businessId:
        "4b8b3608-8e8c-42eb-b454-262471d0334a",
      role: "OWNER",
    });
  });

  it("resolves an active MEMBER membership into TenantContext", async () => {
    const membershipReader = createMembershipReader({
      membershipId:
        "343ac59d-1100-40a9-9641-17b142f38681",
      userId:
        "60d6aa44-ca87-458d-b647-c80787e91a8a",
      businessId:
        "4b8b3608-8e8c-42eb-b454-262471d0334a",
      role: "MEMBER",
    });

    const context = await resolveTenantContext(
      membershipReader,
      {
        authenticatedUserId:
          "60d6aa44-ca87-458d-b647-c80787e91a8a",
        requestedBusinessId:
          "4b8b3608-8e8c-42eb-b454-262471d0334a",
      },
    );

    expect(context.role).toBe("MEMBER");
  });

  it("queries membership with both authenticated user and requested business", async () => {
    const findActiveMembership = vi
      .fn()
      .mockResolvedValue(null);

    const membershipReader: TenantMembershipReader = {
      findActiveMembership,
    };

    await expect(
      resolveTenantContext(membershipReader, {
        authenticatedUserId:
          "60d6aa44-ca87-458d-b647-c80787e91a8a",
        requestedBusinessId:
          "4b8b3608-8e8c-42eb-b454-262471d0334a",
      }),
    ).rejects.toBeInstanceOf(ApplicationError);

    expect(findActiveMembership).toHaveBeenCalledTimes(1);

    expect(findActiveMembership).toHaveBeenCalledWith({
      userId:
        "60d6aa44-ca87-458d-b647-c80787e91a8a",
      businessId:
        "4b8b3608-8e8c-42eb-b454-262471d0334a",
    });
  });
});
