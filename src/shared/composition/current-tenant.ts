import { headers } from "next/headers";

import type {
  AllowedTenantRoles,
} from "../application/authorization/require-tenant-role";
import {
  resolveAuthorizedTenantContext,
} from "../application/authorization/resolve-authorized-tenant-context";
import type {
  TenantContext,
} from "../application/tenancy/tenant-context";
import {
  prismaTenantMembershipReader,
} from "../infrastructure/tenancy/prisma-tenant-membership-reader";
import { auth } from "./auth";

export async function resolveCurrentTenantContext(
  requestedBusinessId: string,
  allowedRoles: AllowedTenantRoles,
): Promise<TenantContext> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return resolveAuthorizedTenantContext(
    prismaTenantMembershipReader,
    {
      authenticatedUserId:
        session?.user.id ?? null,
      requestedBusinessId,
    },
    allowedRoles,
  );
}
