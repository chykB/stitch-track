import { describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@/shared/application/errors/application-error";
import type { ApplicationLogger } from "@/shared/application/logging/logger";
import { toSafeErrorResponse } from "@/shared/presentation/errors/to-safe-error-response";
import { InputValidationError } from "@/shared/validation/input-validation-error";

function createLoggerMock(): ApplicationLogger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe("toSafeErrorResponse", () => {
  it("maps validation errors to a safe 400 response", () => {
    const logger = createLoggerMock();

    const error = new InputValidationError([
      {
        path: "name",
        code: "too_small",
        message: "Name is required.",
      },
    ]);

    const result = toSafeErrorResponse(
      error,
      logger,
    );

    expect(result).toEqual({
      status: 400,
      body: {
        code: "INVALID_INPUT",
        message: "The submitted input is invalid.",
        issues: [
          {
            path: "name",
            code: "too_small",
            message: "Name is required.",
          },
        ],
      },
    });

    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each([
    ["NOT_FOUND", 404],
    ["CONFLICT", 409],
    ["UNAUTHORIZED", 401],
    ["FORBIDDEN", 403],
  ] as const)(
    "maps %s to status %s",
    (code, expectedStatus) => {
      const logger = createLoggerMock();

      const result = toSafeErrorResponse(
        new ApplicationError(
          code,
          "Internal implementation detail.",
        ),
        logger,
      );

      expect(result.status).toBe(
        expectedStatus,
      );

      expect(result.body.code).toBe(code);

      expect(
        JSON.stringify(result),
      ).not.toContain(
        "Internal implementation detail.",
      );

      expect(
        logger.error,
      ).not.toHaveBeenCalled();
    },
  );

  it("logs unexpected errors and returns a generic 500 response", () => {
    const logger = createLoggerMock();

    const error = new Error(
      "Database password=do-not-expose",
    );

    const result = toSafeErrorResponse(
      error,
      logger,
      {
        requestId: "request-123",
      },
    );

    expect(result).toEqual({
      status: 500,
      body: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    });

    expect(JSON.stringify(result)).not.toContain(
      "do-not-expose",
    );

    expect(logger.error).toHaveBeenCalledWith(
      "Unexpected boundary error.",
      error,
      {
        requestId: "request-123",
      },
    );
  });

  it("does not expose arbitrary thrown values", () => {
    const logger = createLoggerMock();

    const result = toSafeErrorResponse(
      {
        token: "secret-token",
        internal: "private-detail",
      },
      logger,
    );

    expect(result).toEqual({
      status: 500,
      body: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    });

    expect(JSON.stringify(result)).not.toContain(
      "secret-token",
    );

    expect(JSON.stringify(result)).not.toContain(
      "private-detail",
    );
  });
});
