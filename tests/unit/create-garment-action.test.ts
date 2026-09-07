import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ApplicationError,
} from "@/shared/application/errors/application-error";

vi.mock(
  "@/garment/composition/create-garment",
  () => ({
    createGarmentForCurrentTenant:
      vi.fn(),
  }),
);

import {
  createGarmentForCurrentTenant,
} from "@/garment/composition/create-garment";
import {
  createGarmentAction,
} from "@/garment/presentation/actions/create-garment-action";
import type {
  CreateGarmentActionState,
} from "@/garment/presentation/create-garment-action-state";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const ORDER_A_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const ORDER_B_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const GARMENT_ID =
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const INITIAL_STATE:
  CreateGarmentActionState = {
    status: "idle",
    message: null,
    issues: [],
    garment: null,
  };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createGarmentAction", () => {
  it("uses the bound Business and Order identifiers and validated garment name", async () => {
    vi.mocked(
      createGarmentForCurrentTenant,
    ).mockResolvedValue({
      id: GARMENT_ID,
      businessId: BUSINESS_A_ID,
      orderId: ORDER_A_ID,
      name: "Wedding gown",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData =
      new FormData();

    formData.set(
      "businessId",
      BUSINESS_B_ID,
    );

    formData.set(
      "orderId",
      ORDER_B_ID,
    );

    formData.set(
      "name",
      "  Wedding gown  ",
    );

    const result =
      await createGarmentAction(
        BUSINESS_A_ID,
        ORDER_A_ID,
        INITIAL_STATE,
        formData,
      );

    expect(
      createGarmentForCurrentTenant,
    ).toHaveBeenCalledWith(
      BUSINESS_A_ID,
      {
        orderId: ORDER_A_ID,
        name: "Wedding gown",
      },
    );

    expect(result).toEqual({
      status: "success",
      message:
        "Garment created successfully.",
      issues: [],
      garment: {
        id: GARMENT_ID,
        orderId: ORDER_A_ID,
        name: "Wedding gown",
      },
    });
  });

  it("rejects an empty garment name before mutation", async () => {
    const formData =
      new FormData();

    formData.set(
      "name",
      "   ",
    );

    const result =
      await createGarmentAction(
        BUSINESS_A_ID,
        ORDER_A_ID,
        INITIAL_STATE,
        formData,
      );

    expect(
      createGarmentForCurrentTenant,
    ).not.toHaveBeenCalled();

    expect(result.status)
      .toBe("error");

    expect(result.message)
      .toBe(
        "The submitted input is invalid.",
      );

    expect(
      result.issues.some(
        (issue) =>
          issue.path === "name",
      ),
    ).toBe(true);
  });

  it("returns a safe NOT_FOUND response for an unavailable Order parent", async () => {
    vi.mocked(
      createGarmentForCurrentTenant,
    ).mockRejectedValue(
      new ApplicationError(
        "NOT_FOUND",
        "Secret cross-tenant Order detail.",
      ),
    );

    const formData =
      new FormData();

    formData.set(
      "name",
      "Wedding gown",
    );

    const result =
      await createGarmentAction(
        BUSINESS_A_ID,
        ORDER_A_ID,
        INITIAL_STATE,
        formData,
      );

    expect(result).toEqual({
      status: "error",
      message:
        "The requested resource was not found.",
      issues: [],
      garment: null,
    });

    expect(
      JSON.stringify(result),
    ).not.toContain(
      "Secret cross-tenant Order detail.",
    );
  });
});
