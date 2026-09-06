import type {
  Order,
} from "../../domain/order";

export type CreateOrderData = Readonly<{
  businessId: string;
  clientId: string;
}>;

export type FindOrderById = Readonly<{
  businessId: string;
  orderId: string;
}>;

export interface OrderRepository {
  create(
    data: CreateOrderData,
  ): Promise<Order>;

  findById(
    lookup: FindOrderById,
  ): Promise<Order | null>;
}
