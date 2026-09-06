import { ApplicationError } from "../errors/application-error";
import type { TenantContext } from "./tenant-context";
import type { TenantMembershipReader } from "./tenant-membership-reader";

export type ResolveTenantContextInput = Readonly<{
  authenticatedUserId: string | null;
  requestedBusinessId: string;
}>;

export async function resolveTenantContext(
  membershipReader: TenantMembershipReader,
  input: ResolveTenantContextInput,
): Promise<TenantContext> {
  if (!input.authenticatedUserId) {
    throw new ApplicationError(
      "UNAUTHORIZED",
      "Authentication is required.",
    );
  }

  const membership = await membershipReader.findActiveMembership({
    userId: input.authenticatedUserId,
    businessId: input.requestedBusinessId,
  });

  if (!membership) {
    throw new ApplicationError(
      "FORBIDDEN",
      "You do not have access to this business.",
    );
  }

  return {
    userId: membership.userId,
    businessId: membership.businessId,
    membershipId: membership.membershipId,
    role: membership.role,
  };
}
