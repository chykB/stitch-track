import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  isApplicationError,
} from "@/shared/application/errors/application-error";

describe("ApplicationError", () => {
  it("preserves its semantic code and message", () => {
    const error = new ApplicationError(
      "NOT_FOUND",
      "Requested resource was not found.",
    );

    expect(error.name).toBe("ApplicationError");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe(
      "Requested resource was not found.",
    );
    expect(error.isExpected).toBe(true);
  });

  it("is recognized as an application error", () => {
    const error = new ApplicationError(
      "CONFLICT",
      "The requested operation conflicts with current state.",
    );

    expect(isApplicationError(error)).toBe(true);
  });

  it("does not classify arbitrary errors as application errors", () => {
    expect(
      isApplicationError(new Error("Unexpected failure")),
    ).toBe(false);

    expect(isApplicationError("failure")).toBe(false);
    expect(isApplicationError(null)).toBe(false);
  });
});
