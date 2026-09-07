import type {
  GarmentRepository,
} from "../application/ports/garment-repository";
import type {
  Garment,
} from "../domain/garment";
import { prisma } from "../../shared/database/prisma";

function toGarment(
  record: Garment,
): Garment {
  return {
    id: record.id,
    businessId: record.businessId,
    orderId: record.orderId,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const prismaGarmentRepository: GarmentRepository = {
  async create(data) {
    const record = await prisma.garment.create({
      data: {
        businessId: data.businessId,
        orderId: data.orderId,
        name: data.name,
      },
    });

    return toGarment(record);
  },

  async findById({
    businessId,
    garmentId,
  }) {
    const record = await prisma.garment.findFirst({
      where: {
        id: garmentId,
        businessId,
      },
    });

    return record
      ? toGarment(record)
      : null;
  },
};
