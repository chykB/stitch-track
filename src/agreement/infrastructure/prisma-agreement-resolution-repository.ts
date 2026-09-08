import type {
  AgreementResolutionRepository,
} from "../application/ports/agreement-resolution-repository";
import { prisma } from "../../shared/database/prisma";
import {
  toAgreementResolution,
} from "./prisma-agreement-mappers";

export const prismaAgreementResolutionRepository:
  AgreementResolutionRepository = {
    async findForVersion({
      businessId,
      agreementVersionId,
    }) {
      const record =
        await prisma
          .agreementResolution
          .findFirst({
            where: {
              businessId,
              agreementVersionId,
            },
          });

      return record
        ? toAgreementResolution(
            record,
          )
        : null;
    },
  };
