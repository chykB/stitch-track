import type {
  ClientRepository,
} from "../application/ports/client-repository";
import type {
  Client,
} from "../domain/client";
import { prisma } from "../../shared/database/prisma";

function toClient(
  record: Client,
): Client {
  return {
    id: record.id,
    businessId: record.businessId,
    name: record.name,
    phone: record.phone,
    email: record.email,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const prismaClientRepository: ClientRepository = {
  async create(data) {
    const record = await prisma.client.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        phone: data.phone,
        email: data.email,
      },
    });

    return toClient(record);
  },

  async findById({
    businessId,
    clientId,
  }) {
    const record = await prisma.client.findFirst({
      where: {
        id: clientId,
        businessId,
      },
    });

    return record
      ? toClient(record)
      : null;
  },
};
