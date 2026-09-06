import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createOrder,
} from "../../src/order/domain/order";

describe("Order domain", () => {
  it("creates an Order with explicit Business and Client ownership", () => {
    const createdAt =
      new Date("2026-09-06T12:00:00.000Z");
    const updatedAt =
      new Date("2026-09-06T12:30:00.000Z");

    const order = createOrder({
      id: "order-1",
      businessId: "business-1",
      clientId: "client-1",
      createdAt,
      updatedAt,
    });

    expect(order).toEqual({
      id: "order-1",
      businessId: "business-1",
      clientId: "client-1",
      createdAt,
      updatedAt,
    });
  });
});
