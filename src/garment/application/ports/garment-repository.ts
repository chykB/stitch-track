import type {
  Garment,
  GarmentDetails,
} from "../../domain/garment";

export type CreateGarmentData =
  GarmentDetails &
    Readonly<{
      businessId: string;
      orderId: string;
    }>;

export type FindGarmentById = Readonly<{
  businessId: string;
  garmentId: string;
}>;

export interface GarmentRepository {
  create(
    data: CreateGarmentData,
  ): Promise<Garment>;

  findById(
    lookup: FindGarmentById,
  ): Promise<Garment | null>;
}
