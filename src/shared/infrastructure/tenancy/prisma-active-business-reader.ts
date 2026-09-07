import type {
  ActiveBusinessReader,
} from "../../application/tenancy/active-business-reader";
import { prisma } from "../../database/prisma";

export const prismaActiveBusinessReader:
  ActiveBusinessReader = {
    async listForUser(userId) {
      const memberships =
        await prisma.businessMember.findMany({
          where: {
            userId,
            status: "ACTIVE",
          },
          select: {
            id: true,
            businessId: true,
            role: true,
            business: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });

      return memberships.map(
        (membership) => ({
          membershipId: membership.id,
          businessId: membership.businessId,
          businessName:
            membership.business.name,
          role: membership.role,
        }),
      );
    },
  };
