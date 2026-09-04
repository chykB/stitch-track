import { Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { createPinoApplicationLogger } from "@/shared/infrastructure/logging/pino-logger";

type CapturedLog = Record<string, unknown>;

function createLogCapture(): {
  stream: Writable;
  logs: CapturedLog[];
} {
  const logs: CapturedLog[] = [];

  const stream = new Writable({
    write(chunk, _encoding, callback) {
      logs.push(
        JSON.parse(chunk.toString()) as CapturedLog,
      );

      callback();
    },
  });

  return {
    stream,
    logs,
  };
}

describe("PinoApplicationLogger", () => {
  it("writes structured application context", () => {
    const capture = createLogCapture();

    const logger = createPinoApplicationLogger({
      level: "info",
      destination: capture.stream,
    });

    logger.info("Operation completed.", {
      requestId: "request-123",
      operation: "test-operation",
    });

    expect(capture.logs).toHaveLength(1);

    expect(capture.logs[0]).toMatchObject({
      msg: "Operation completed.",
      context: {
        requestId: "request-123",
        operation: "test-operation",
      },
    });
  });

  it("redacts common sensitive context fields", () => {
    const capture = createLogCapture();

    const logger = createPinoApplicationLogger({
      level: "info",
      destination: capture.stream,
    });

    logger.info("Sensitive operation.", {
      password: "super-secret-password",
      token: "secret-token",
      accessToken: "secret-access-token",
      authorization: "Bearer secret",
      safeValue: "visible",
    });

    const entry = capture.logs[0];

    expect(entry).toBeDefined();

    const context = entry?.context as
      | Record<string, unknown>
      | undefined;

    expect(context).toMatchObject({
      password: "[REDACTED]",
      token: "[REDACTED]",
      accessToken: "[REDACTED]",
      authorization: "[REDACTED]",
      safeValue: "visible",
    });

    expect(JSON.stringify(entry)).not.toContain(
      "super-secret-password",
    );

    expect(JSON.stringify(entry)).not.toContain(
      "secret-token",
    );

    expect(JSON.stringify(entry)).not.toContain(
      "secret-access-token",
    );
  });

  it("redacts sensitive header values", () => {
    const capture = createLogCapture();

    const logger = createPinoApplicationLogger({
      level: "info",
      destination: capture.stream,
    });

    logger.info("Request metadata.", {
      headers: {
        authorization: "Bearer hidden-value",
        cookie: "session=hidden-value",
        "user-agent": "test-agent",
      },
    });

    const entry = capture.logs[0];

    const context = entry?.context as
      | Record<string, unknown>
      | undefined;

    const headers = context?.headers as
      | Record<string, unknown>
      | undefined;

    expect(headers?.authorization).toBe(
      "[REDACTED]",
    );

    expect(headers?.cookie).toBe(
      "[REDACTED]",
    );

    expect(headers?.["user-agent"]).toBe(
      "test-agent",
    );
  });

  it("does not copy arbitrary properties from Error objects", () => {
    const capture = createLogCapture();

    const logger = createPinoApplicationLogger({
      level: "error",
      destination: capture.stream,
    });

    const error = new Error("Expected failure.") as Error & {
      password?: string;
    };

    error.password = "must-not-be-logged";

    logger.error(
      "Operation failed.",
      error,
      {
        requestId: "request-123",
      },
    );

    const serialized = JSON.stringify(
      capture.logs[0],
    );

    expect(serialized).toContain(
      "Expected failure.",
    );

    expect(serialized).not.toContain(
      "must-not-be-logged",
    );
  });

  it("does not serialize arbitrary non-Error values", () => {
    const capture = createLogCapture();

    const logger = createPinoApplicationLogger({
      level: "error",
      destination: capture.stream,
    });

    logger.error(
      "Unknown failure.",
      {
        password: "must-not-be-logged",
        token: "also-secret",
      },
    );

    expect(capture.logs[0]).toMatchObject({
      error: {
        name: "UnknownError",
      },
    });

    const serialized = JSON.stringify(
      capture.logs[0],
    );

    expect(serialized).not.toContain(
      "must-not-be-logged",
    );

    expect(serialized).not.toContain(
      "also-secret",
    );
  });

  it("respects the configured log level", () => {
    const capture = createLogCapture();

    const logger = createPinoApplicationLogger({
      level: "warn",
      destination: capture.stream,
    });

    logger.debug("Debug message.");
    logger.info("Info message.");
    logger.warn("Warning message.");

    expect(capture.logs).toHaveLength(1);

    expect(capture.logs[0]).toMatchObject({
      msg: "Warning message.",
    });
  });
});

describe("PinoApplicationLogger error handling", () => {
  it("logs an error message without error details when no error is supplied", () => {
    const capture = createLogCapture();

    const logger = createPinoApplicationLogger({
      level: "error",
      destination: capture.stream,
    });

    logger.error("Operation failed.");

    expect(capture.logs).toHaveLength(1);

    expect(capture.logs[0]).toMatchObject({
      msg: "Operation failed.",
    });

    expect(capture.logs[0]).not.toHaveProperty(
      "error",
    );
  });
});
