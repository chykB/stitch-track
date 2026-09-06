import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createGarment,
} from "../../src/garment/domain/garment";

const CREATED_AT =
  new Date("2026-09-06T12:00:00.000Z");
const UPDATED_AT =
  new Date("2026-09-06T12:30:00.000Z");

describe("Garment domain", () => {
  it("creates a Garment representing one physical item", () => {
    const garment = createGarment({
      id: "garment-1",
      businessId: "business-1",
      orderId: "order-1",
      name: "  Wedding gown  ",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    });

    expect(garment).toEqual({
      id: "garment-1",
      businessId: "business-1",
      orderId: "order-1",
      name: "Wedding gown",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    });
  });

  it("rejects an empty Garment name", () => {
    expect(() =>
      createGarment({
        id: "garment-1",
        businessId: "business-1",
        orderId: "order-1",
        name: "   ",
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      }),
    ).toThrow("Garment name is required.");
  });
});

describe("normalizeGarmentDetails", () => {
  it("normalizes data before persistence", async () => {
    const {
      normalizeGarmentDetails,
    } = await import(
      "../../src/garment/domain/garment"
    );

    expect(
      normalizeGarmentDetails({
        name: "  Senator trousers  ",
      }),
    ).toEqual({
      name: "Senator trousers",
    });
  });
});
