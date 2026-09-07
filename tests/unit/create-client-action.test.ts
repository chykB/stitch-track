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
  "@/client/composition/create-client",
  () => ({
    createClientForCurrentTenant:
      vi.fn(),
  }),
);

import {
  createClientForCurrentTenant,
} from "@/client/composition/create-client";
import {
  createClientAction,
} from "@/client/presentation/actions/create-client-action";
import type {
  CreateClientActionState,
} from "@/client/presentation/create-client-action-state";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const CLIENT_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const INITIAL_STATE:
  CreateClientActionState = {
    status: "idle",
    message: null,
    issues: [],
    client: null,
  };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createClientAction", () => {
  it("validates input and creates the Client in the bound Business", async () => {
    vi.mocked(
      createClientForCurrentTenant,
    ).mockResolvedValue({
      id: CLIENT_ID,
      businessId: BUSINESS_A_ID,
      name: "Ada Okafor",
      phone: "08012345678",
      email: "ada@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();

    formData.set(
      "name",
      "  Ada Okafor  ",
    );

    formData.set(
      "phone",
      " 08012345678 ",
    );

    formData.set(
      "email",
      " ada@example.com ",
    );

    formData.set(
      "businessId",
      BUSINESS_B_ID,
    );

    const result =
      await createClientAction(
        BUSINESS_A_ID,
        INITIAL_STATE,
        formData,
      );

    expect(
      createClientForCurrentTenant,
    ).toHaveBeenCalledWith(
      BUSINESS_A_ID,
      {
        name: "Ada Okafor",
        phone: "08012345678",
        email: "ada@example.com",
      },
    );

    expect(result).toEqual({
      status: "success",
      message:
        "Client created successfully.",
      issues: [],
      client: {
        id: CLIENT_ID,
        name: "Ada Okafor",
      },
    });
  });

  it("rejects invalid input before calling the mutation", async () => {
    const formData = new FormData();

    formData.set("name", "   ");
    formData.set(
      "phone",
      "08012345678",
    );
    formData.set("email", "");

    const result =
      await createClientAction(
        BUSINESS_A_ID,
        INITIAL_STATE,
        formData,
      );

    expect(
      createClientForCurrentTenant,
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

  it("returns a safe authorization error without exposing internal details", async () => {
    vi.mocked(
      createClientForCurrentTenant,
    ).mockRejectedValue(
      new ApplicationError(
        "FORBIDDEN",
        "Secret membership implementation detail.",
      ),
    );

    const formData = new FormData();

    formData.set(
      "name",
      "Ada Okafor",
    );

    formData.set(
      "phone",
      "08012345678",
    );

    formData.set("email", "");

    const result =
      await createClientAction(
        BUSINESS_A_ID,
        INITIAL_STATE,
        formData,
      );

    expect(result).toEqual({
      status: "error",
      message:
        "You do not have permission to perform this action.",
      issues: [],
      client: null,
    });

    expect(
      JSON.stringify(result),
    ).not.toContain(
      "Secret membership implementation detail.",
    );
  });
});
