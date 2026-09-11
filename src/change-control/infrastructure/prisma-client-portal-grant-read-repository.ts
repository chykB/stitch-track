import type {
  ClientPortalGrantReadRepository,
} from "../application/ports/client-portal-grant-read-repository";
import {
  prisma,
} from "../../shared/database/prisma";

export const prismaClientPortalGrantReadRepository:
  ClientPortalGrantReadRepository = {
    async listOutstandingForGarment({
      businessId,
      garmentId,
    }) {
      const records =
        await prisma
          .clientPortalGrant
          .findMany({
            where: {
              businessId,
              garmentId,
              consumedAt:
                null,
              revokedAt:
                null,
              expiresAt: {
                gt:
                  new Date(),
              },
            },
            select: {
              id: true,
              businessId: true,
              garmentId: true,
              purpose: true,
              changeProposalVersionId:
                true,
              expiresAt: true,
              createdAt: true,
            },
            orderBy: [
              {
                createdAt:
                  "desc",
              },
              {
                id:
                  "desc",
              },
            ],
          });

      return records;
    },
  };
