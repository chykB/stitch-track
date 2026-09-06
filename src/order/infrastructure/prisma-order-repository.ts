import type {
  OrderRepository,
} from "../application/ports/order-repository";
import type {
  Order,
} from "../domain/order";
import { prisma } from "../../shared/database/prisma";

function toOrder(
  record: Order,
): Order {
  return {
    id: record.id,
    businessId: record.businessId,
    clientId: record.clientId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const prismaOrderRepository: OrderRepository = {
  async create(data) {
    const record = await prisma.order.create({
      data: {
        businessId: data.businessId,
        clientId: data.clientId,
      },
    });

    return toOrder(record);
  },

  async findById({
    businessId,
    orderId,
  }) {
    const record = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId,
      },
    });

    return record
      ? toOrder(record)
      : null;
  },
};
