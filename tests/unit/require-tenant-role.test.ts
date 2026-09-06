import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ApplicationError,
} from "../../src/shared/application/errors/application-error";
import {
  requireTenantRole,
} from "../../src/shared/application/authorization/require-tenant-role";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

function createTenantContext(
  role: TenantContext["role"],
): TenantContext {
  return {
    userId:
      "11111111-1111-4111-8111-111111111111",
    businessId:
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    membershipId:
      "44444444-4444-4444-8444-444444444444",
    role,
  };
}

describe("requireTenantRole", () => {
  it("allows OWNER when OWNER is required", () => {
    const tenantContext =
      createTenantContext("OWNER");

    expect(() =>
      requireTenantRole(
        tenantContext,
        ["OWNER"],
      ),
    ).not.toThrow();
  });

  it("rejects MEMBER when OWNER is required", () => {
    const tenantContext =
      createTenantContext("MEMBER");

    expect(() =>
      requireTenantRole(
        tenantContext,
        ["OWNER"],
      ),
    ).toThrowError(ApplicationError);
  });

  it("returns the generic FORBIDDEN authorization error", () => {
    const tenantContext =
      createTenantContext("MEMBER");

    try {
      requireTenantRole(
        tenantContext,
        ["OWNER"],
      );

      throw new Error(
        "Expected authorization to be forbidden.",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(
        ApplicationError,
      );

      expect(error).toMatchObject({
        code: "FORBIDDEN",
        message:
          "You do not have permission to perform this action.",
      });
    }
  });

  it("allows MEMBER when both current roles are permitted", () => {
    const tenantContext =
      createTenantContext("MEMBER");

    expect(() =>
      requireTenantRole(
        tenantContext,
        ["OWNER", "MEMBER"],
      ),
    ).not.toThrow();
  });

  it("allows OWNER when both current roles are permitted", () => {
    const tenantContext =
      createTenantContext("OWNER");

    expect(() =>
      requireTenantRole(
        tenantContext,
        ["OWNER", "MEMBER"],
      ),
    ).not.toThrow();
  });
});
