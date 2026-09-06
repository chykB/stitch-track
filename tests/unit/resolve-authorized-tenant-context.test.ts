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
  resolveAuthorizedTenantContext,
} from "../../src/shared/application/authorization/resolve-authorized-tenant-context";
import type {
  ActiveTenantMembership,
  TenantMembershipReader,
} from "../../src/shared/application/tenancy/tenant-membership-reader";

const USER_ID =
  "11111111-1111-4111-8111-111111111111";
const MEMBER_USER_ID =
  "22222222-2222-4222-8222-222222222222";
const BUSINESS_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_BUSINESS_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OWNER_MEMBERSHIP_ID =
  "44444444-4444-4444-8444-444444444444";
const MEMBER_MEMBERSHIP_ID =
  "55555555-5555-4555-8555-555555555555";

function createMembershipReader(
  membership: ActiveTenantMembership | null,
): TenantMembershipReader {
  return {
    findActiveMembership: vi
      .fn()
      .mockResolvedValue(membership),
  };
}

describe("resolveAuthorizedTenantContext", () => {
  it("returns the server-resolved TenantContext when the membership role is allowed", async () => {
    const membershipReader = createMembershipReader({
      membershipId: OWNER_MEMBERSHIP_ID,
      userId: USER_ID,
      businessId: BUSINESS_ID,
      role: "OWNER",
    });

    await expect(
      resolveAuthorizedTenantContext(
        membershipReader,
        {
          authenticatedUserId: USER_ID,
          requestedBusinessId: BUSINESS_ID,
        },
        ["OWNER"],
      ),
    ).resolves.toEqual({
      membershipId: OWNER_MEMBERSHIP_ID,
      userId: USER_ID,
      businessId: BUSINESS_ID,
      role: "OWNER",
    });
  });

  it("rejects a server-resolved MEMBER when OWNER is required", async () => {
    const membershipReader = createMembershipReader({
      membershipId: MEMBER_MEMBERSHIP_ID,
      userId: MEMBER_USER_ID,
      businessId: BUSINESS_ID,
      role: "MEMBER",
    });

    await expect(
      resolveAuthorizedTenantContext(
        membershipReader,
        {
          authenticatedUserId: MEMBER_USER_ID,
          requestedBusinessId: BUSINESS_ID,
        },
        ["OWNER"],
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "You do not have permission to perform this action.",
    });
  });

  it("does not authorize when tenant membership cannot be resolved", async () => {
    const membershipReader =
      createMembershipReader(null);

    await expect(
      resolveAuthorizedTenantContext(
        membershipReader,
        {
          authenticatedUserId: USER_ID,
          requestedBusinessId:
            OTHER_BUSINESS_ID,
        },
        ["OWNER"],
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "You do not have access to this business.",
    });
  });

  it("rejects unauthenticated requests before authorization", async () => {
    const findActiveMembership = vi.fn();

    const membershipReader: TenantMembershipReader = {
      findActiveMembership,
    };

    await expect(
      resolveAuthorizedTenantContext(
        membershipReader,
        {
          authenticatedUserId: null,
          requestedBusinessId: BUSINESS_ID,
        },
        ["OWNER"],
      ),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    expect(
      findActiveMembership,
    ).not.toHaveBeenCalled();
  });

  it("preserves the membership role returned by the trusted reader", async () => {
    const membershipReader = createMembershipReader({
      membershipId: MEMBER_MEMBERSHIP_ID,
      userId: MEMBER_USER_ID,
      businessId: BUSINESS_ID,
      role: "MEMBER",
    });

    const context =
      await resolveAuthorizedTenantContext(
        membershipReader,
        {
          authenticatedUserId: MEMBER_USER_ID,
          requestedBusinessId: BUSINESS_ID,
        },
        ["OWNER", "MEMBER"],
      );

    expect(context.role).toBe("MEMBER");
  });

  it("throws ApplicationError for authorization failure", async () => {
    const membershipReader = createMembershipReader({
      membershipId: MEMBER_MEMBERSHIP_ID,
      userId: MEMBER_USER_ID,
      businessId: BUSINESS_ID,
      role: "MEMBER",
    });

    await expect(
      resolveAuthorizedTenantContext(
        membershipReader,
        {
          authenticatedUserId: MEMBER_USER_ID,
          requestedBusinessId: BUSINESS_ID,
        },
        ["OWNER"],
      ),
    ).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });
});
