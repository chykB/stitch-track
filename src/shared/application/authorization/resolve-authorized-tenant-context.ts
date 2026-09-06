import type {
  TenantContext,
} from "../tenancy/tenant-context";
import {
  resolveTenantContext,
} from "../tenancy/resolve-tenant-context";
import type {
  TenantMembershipReader,
} from "../tenancy/tenant-membership-reader";
import {
  requireTenantRole,
  type AllowedTenantRoles,
} from "./require-tenant-role";

export type ResolveAuthorizedTenantContextInput = Readonly<{
  authenticatedUserId: string | null;
  requestedBusinessId: string;
}>;

export async function resolveAuthorizedTenantContext(
  membershipReader: TenantMembershipReader,
  input: ResolveAuthorizedTenantContextInput,
  allowedRoles: AllowedTenantRoles,
): Promise<TenantContext> {
  const tenantContext = await resolveTenantContext(
    membershipReader,
    {
      authenticatedUserId: input.authenticatedUserId,
      requestedBusinessId: input.requestedBusinessId,
    },
  );

  requireTenantRole(
    tenantContext,
    allowedRoles,
  );

  return tenantContext;
}
