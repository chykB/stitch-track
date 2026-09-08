import type {
  AgreementVersionRepository,
} from "../application/ports/agreement-version-repository";
import { prisma } from "../../shared/database/prisma";
import {
  agreementVersionInclude,
  toAgreementVersion,
} from "./prisma-agreement-mappers";

export const prismaAgreementVersionRepository:
  AgreementVersionRepository = {
    async findById({
      businessId,
      agreementVersionId,
    }) {
      const record =
        await prisma
          .agreementVersion
          .findFirst({
            where: {
              id:
                agreementVersionId,
              businessId,
            },
            include:
              agreementVersionInclude,
          });

      return record
        ? toAgreementVersion(
            record,
          )
        : null;
    },

    async listForGarment({
      businessId,
      garmentId,
    }) {
      const records =
        await prisma
          .agreementVersion
          .findMany({
            where: {
              businessId,
              garmentId,
            },
            include:
              agreementVersionInclude,
            orderBy: [
              {
                revisionNumber:
                  "asc",
              },
              {
                id:
                  "asc",
              },
            ],
          });

      return records.map(
        toAgreementVersion,
      );
    },
  };
