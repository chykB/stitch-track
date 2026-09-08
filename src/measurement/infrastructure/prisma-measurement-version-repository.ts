import type {
  MeasurementVersionRepository,
} from "../application/ports/measurement-version-repository";
import {
  normalizeMeasurementValue,
  type MeasurementEntry,
  type MeasurementUnit,
  type MeasurementVersion,
} from "../domain/measurement";
import { prisma } from "../../shared/database/prisma";

type PersistedMeasurementEntry =
  Readonly<{
    id: string;
    businessId: string;
    measurementVersionId: string;
    label: string;
    normalizedKey: string;
    value: Readonly<{
      toString(): string;
    }>;
    createdAt: Date;
  }>;

type PersistedMeasurementVersion =
  Readonly<{
    id: string;
    businessId: string;
    clientId: string;
    measuredAt: Date;
    unit: MeasurementUnit;
    note: string | null;
    createdAt: Date;
    entries:
      readonly PersistedMeasurementEntry[];
  }>;

function toMeasurementEntry(
  record: PersistedMeasurementEntry,
): MeasurementEntry {
  return {
    id: record.id,
    businessId: record.businessId,
    measurementVersionId:
      record.measurementVersionId,
    label: record.label,
    normalizedKey:
      record.normalizedKey,
    value:
      normalizeMeasurementValue(
        record.value.toString(),
      ),
    createdAt: record.createdAt,
  };
}

function toMeasurementVersion(
  record: PersistedMeasurementVersion,
): MeasurementVersion {
  return {
    id: record.id,
    businessId: record.businessId,
    clientId: record.clientId,
    measuredAt: record.measuredAt,
    unit: record.unit,
    note: record.note,
    entries:
      record.entries.map(
        toMeasurementEntry,
      ),
    createdAt: record.createdAt,
  };
}

const entriesInclude = {
  entries: {
    orderBy: [
      {
        normalizedKey:
          "asc" as const,
      },
      {
        id: "asc" as const,
      },
    ],
  },
};

export const prismaMeasurementVersionRepository:
  MeasurementVersionRepository = {
    async create(data) {
      const record =
        await prisma.$transaction(
          async (transaction) => {
            const version =
              await transaction
                .measurementVersion
                .create({
                  data: {
                    businessId:
                      data.businessId,
                    clientId:
                      data.clientId,
                    measuredAt:
                      data.measuredAt,
                    unit:
                      data.unit,
                    note:
                      data.note,
                  },
                });

            await transaction
              .measurementEntry
              .createMany({
                data:
                  data.entries.map(
                    (entry) => ({
                      businessId:
                        data.businessId,
                      measurementVersionId:
                        version.id,
                      label:
                        entry.label,
                      normalizedKey:
                        entry.normalizedKey,
                      value:
                        entry.value,
                    }),
                  ),
              });

            return transaction
              .measurementVersion
              .findFirstOrThrow({
                where: {
                  id: version.id,
                  businessId:
                    data.businessId,
                },
                include:
                  entriesInclude,
              });
          },
        );

      return toMeasurementVersion(
        record,
      );
    },

    async findById({
      businessId,
      measurementVersionId,
    }) {
      const record =
        await prisma
          .measurementVersion
          .findFirst({
            where: {
              id:
                measurementVersionId,
              businessId,
            },
            include:
              entriesInclude,
          });

      return record
        ? toMeasurementVersion(
            record,
          )
        : null;
    },

    async listForClient({
      businessId,
      clientId,
    }) {
      const records =
        await prisma
          .measurementVersion
          .findMany({
            where: {
              businessId,
              clientId,
            },
            include:
              entriesInclude,
            orderBy: [
              {
                measuredAt: "desc",
              },
              {
                createdAt: "desc",
              },
              {
                id: "desc",
              },
            ],
          });

      return records.map(
        toMeasurementVersion,
      );
    },
  };
