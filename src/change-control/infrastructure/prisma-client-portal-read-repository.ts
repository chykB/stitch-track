import type {
  ClientPortalReadRepository,
} from "../application/ports/client-portal-read-repository";
import {
  prisma,
} from "../../shared/database/prisma";
import {
  toChangeRequest,
} from "./prisma-change-control-mappers";

export const prismaClientPortalReadRepository:
  ClientPortalReadRepository = {
    async findActiveRequestForGarment({
      businessId,
      garmentId,
    }) {
      const record =
        await prisma
          .changeRequest
          .findFirst({
            where: {
              businessId,
              garmentId,
              activeSlot:
                "ACTIVE",
            },
          });

      return record
        ? toChangeRequest(
            record,
          )
        : null;
    },
  };
