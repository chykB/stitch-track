import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ActiveBusinessReader,
} from "../../src/shared/application/tenancy/active-business-reader";
import {
  listActiveBusinessesForUser,
} from "../../src/shared/application/tenancy/list-active-businesses";

describe("listActiveBusinessesForUser", () => {
  it("uses the authenticated user ID to list active Businesses", async () => {
    const accesses = [
      {
        membershipId: "membership-a",
        businessId: "business-a",
        businessName: "Business A",
        role: "OWNER" as const,
      },
    ];

    const listForUser =
      vi.fn().mockResolvedValue(accesses);

    const reader: ActiveBusinessReader = {
      listForUser,
    };

    const result =
      await listActiveBusinessesForUser(
        reader,
        "user-a",
      );

    expect(listForUser)
      .toHaveBeenCalledWith("user-a");

    expect(result)
      .toBe(accesses);
  });

  it("rejects an unauthenticated request", async () => {
    const listForUser = vi.fn();

    const reader: ActiveBusinessReader = {
      listForUser,
    };

    await expect(
      listActiveBusinessesForUser(
        reader,
        null,
      ),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    expect(listForUser)
      .not.toHaveBeenCalled();
  });
});
