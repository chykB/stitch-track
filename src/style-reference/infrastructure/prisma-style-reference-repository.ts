import type {
  StyleReferenceRepository,
} from "../application/ports/style-reference-repository";
import type {
  StyleReference,
} from "../domain/style-reference";
import { prisma } from "../../shared/database/prisma";

function toStyleReference(
  record: StyleReference,
): StyleReference {
  return {
    id: record.id,
    businessId: record.businessId,
    garmentId: record.garmentId,
    sourceUrl: record.sourceUrl,
    label: record.label,
    note: record.note,
    createdAt: record.createdAt,
  };
}

export const prismaStyleReferenceRepository:
  StyleReferenceRepository = {
    async create(data) {
      const record =
        await prisma.styleReference.create({
          data: {
            businessId:
              data.businessId,
            garmentId:
              data.garmentId,
            sourceUrl:
              data.sourceUrl,
            label:
              data.label,
            note:
              data.note,
          },
        });

      return toStyleReference(
        record,
      );
    },

    async findById({
      businessId,
      styleReferenceId,
    }) {
      const record =
        await prisma
          .styleReference
          .findFirst({
            where: {
              id:
                styleReferenceId,
              businessId,
            },
          });

      return record
        ? toStyleReference(
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
          .styleReference
          .findMany({
            where: {
              businessId,
              garmentId,
            },
            orderBy: [
              {
                createdAt: "asc",
              },
              {
                id: "asc",
              },
            ],
          });

      return records.map(
        toStyleReference,
      );
    },
  };
