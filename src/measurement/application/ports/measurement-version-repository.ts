import type {
  MeasurementVersion,
  MeasurementVersionDetails,
} from "../../domain/measurement";

export type CreateMeasurementVersionData =
  MeasurementVersionDetails &
    Readonly<{
      businessId: string;
      clientId: string;
    }>;

export type FindMeasurementVersionById =
  Readonly<{
    businessId: string;
    measurementVersionId: string;
  }>;

export type ListMeasurementVersionsForClient =
  Readonly<{
    businessId: string;
    clientId: string;
  }>;

export interface MeasurementVersionRepository {
  create(
    data: CreateMeasurementVersionData,
  ): Promise<MeasurementVersion>;

  findById(
    lookup: FindMeasurementVersionById,
  ): Promise<MeasurementVersion | null>;

  listForClient(
    lookup: ListMeasurementVersionsForClient,
  ): Promise<readonly MeasurementVersion[]>;
}
