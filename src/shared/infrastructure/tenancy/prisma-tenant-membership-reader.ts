import type {
  TenantMembershipReader,
} from "../../application/tenancy/tenant-membership-reader";
import { prisma } from "../../database/prisma";

export const prismaTenantMembershipReader: TenantMembershipReader = {
  async findActiveMembership({
    userId,
    businessId,
  }) {
    const membership = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        userId: true,
        businessId: true,
        role: true,
      },
    });

    if (!membership) {
      return null;
    }

    return {
      membershipId: membership.id,
      userId: membership.userId,
      businessId: membership.businessId,
      role: membership.role,
    };
  },
};
