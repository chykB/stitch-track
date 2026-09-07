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
  "@/order/composition/create-order",
  () => ({
    createOrderForCurrentTenant:
      vi.fn(),
  }),
);

import {
  createOrderForCurrentTenant,
} from "@/order/composition/create-order";
import {
  createOrderAction,
} from "@/order/presentation/actions/create-order-action";
import type {
  CreateOrderActionState,
} from "@/order/presentation/create-order-action-state";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const CLIENT_A_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const CLIENT_B_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const ORDER_ID =
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const INITIAL_STATE:
  CreateOrderActionState = {
    status: "idle",
    message: null,
    issues: [],
    order: null,
  };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createOrderAction", () => {
  it("creates the Order using the bound Business and Client identifiers", async () => {
    vi.mocked(
      createOrderForCurrentTenant,
    ).mockResolvedValue({
      id: ORDER_ID,
      businessId: BUSINESS_A_ID,
      clientId: CLIENT_A_ID,
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
      "clientId",
      CLIENT_B_ID,
    );

    const result =
      await createOrderAction(
        BUSINESS_A_ID,
        CLIENT_A_ID,
        INITIAL_STATE,
        formData,
      );

    expect(
      createOrderForCurrentTenant,
    ).toHaveBeenCalledWith(
      BUSINESS_A_ID,
      {
        clientId: CLIENT_A_ID,
      },
    );

    expect(result).toEqual({
      status: "success",
      message:
        "Order created successfully.",
      issues: [],
      order: {
        id: ORDER_ID,
        clientId: CLIENT_A_ID,
      },
    });
  });

  it("rejects an invalid bound Client identifier before mutation", async () => {
    const result =
      await createOrderAction(
        BUSINESS_A_ID,
        "not-a-client-uuid",
        INITIAL_STATE,
        new FormData(),
      );

    expect(
      createOrderForCurrentTenant,
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
          issue.path === "clientId",
      ),
    ).toBe(true);
  });

  it("returns a safe NOT_FOUND error for an unavailable Client parent", async () => {
    vi.mocked(
      createOrderForCurrentTenant,
    ).mockRejectedValue(
      new ApplicationError(
        "NOT_FOUND",
        "Secret cross-tenant Client detail.",
      ),
    );

    const result =
      await createOrderAction(
        BUSINESS_A_ID,
        CLIENT_A_ID,
        INITIAL_STATE,
        new FormData(),
      );

    expect(result).toEqual({
      status: "error",
      message:
        "The requested resource was not found.",
      issues: [],
      order: null,
    });

    expect(
      JSON.stringify(result),
    ).not.toContain(
      "Secret cross-tenant Client detail.",
    );
  });
});
