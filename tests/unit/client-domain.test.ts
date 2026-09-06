import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createClient,
} from "../../src/client/domain/client";

const CREATED_AT =
  new Date("2026-09-06T12:00:00.000Z");
const UPDATED_AT =
  new Date("2026-09-06T12:30:00.000Z");

describe("Client domain", () => {
  it("creates a normalized Client", () => {
    const client = createClient({
      id: "client-1",
      businessId: "business-1",
      name: "  Ada Okafor  ",
      phone: "  +2348012345678  ",
      email: "  ada@example.com  ",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    });

    expect(client).toEqual({
      id: "client-1",
      businessId: "business-1",
      name: "Ada Okafor",
      phone: "+2348012345678",
      email: "ada@example.com",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    });
  });

  it("normalizes an empty optional email to null", () => {
    const client = createClient({
      id: "client-1",
      businessId: "business-1",
      name: "Ada Okafor",
      phone: "+2348012345678",
      email: "   ",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    });

    expect(client.email).toBeNull();
  });

  it("rejects an empty Client name", () => {
    expect(() =>
      createClient({
        id: "client-1",
        businessId: "business-1",
        name: "   ",
        phone: "+2348012345678",
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      }),
    ).toThrow("Client name is required.");
  });

  it("rejects an empty Client phone", () => {
    expect(() =>
      createClient({
        id: "client-1",
        businessId: "business-1",
        name: "Ada Okafor",
        phone: "   ",
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      }),
    ).toThrow("Client phone is required.");
  });
});

describe("normalizeClientDetails", () => {
  it("normalizes data before persistence", async () => {
    const {
      normalizeClientDetails,
    } = await import(
      "../../src/client/domain/client"
    );

    expect(
      normalizeClientDetails({
        name: "  Chioma Obi  ",
        phone: "  08012345678  ",
        email: "  chioma@example.com  ",
      }),
    ).toEqual({
      name: "Chioma Obi",
      phone: "08012345678",
      email: "chioma@example.com",
    });
  });
});
