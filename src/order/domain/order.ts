export type Order = Readonly<{
  id: string;
  businessId: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export type CreateOrderInput = Readonly<{
  id: string;
  businessId: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export function createOrder(
  input: CreateOrderInput,
): Order {
  return {
    id: input.id,
    businessId: input.businessId,
    clientId: input.clientId,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
