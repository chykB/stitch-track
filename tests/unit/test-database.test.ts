import { describe, expect, it } from "vitest";

import { requireSafeTestDatabaseUrl } from "../support/test-database.mjs";

describe("requireSafeTestDatabaseUrl", () => {
  it("accepts a PostgreSQL database ending in _test", () => {
    const url =
      "postgresql://test_user:test_password@127.0.0.1:5432/stitchtrack_test";

    expect(requireSafeTestDatabaseUrl(url)).toBe(url);
  });

  it("rejects a development database", () => {
    const url =
      "postgresql://dev_user:dev_password@127.0.0.1:5432/stitchtrack_dev";

    expect(() => requireSafeTestDatabaseUrl(url)).toThrow(
      'Refusing to run integration tests against non-test database "stitchtrack_dev".',
    );
  });

  it("rejects a missing database URL", () => {
    expect(() => requireSafeTestDatabaseUrl(undefined)).toThrow(
      "TEST_DATABASE_URL is required for integration tests.",
    );
  });

  it("rejects a non-PostgreSQL URL", () => {
    expect(() =>
      requireSafeTestDatabaseUrl(
        "mysql://test_user:test_password@127.0.0.1:3306/stitchtrack_test",
      ),
    ).toThrow(
      "TEST_DATABASE_URL must use the PostgreSQL protocol.",
    );
  });

  it("rejects a malformed URL", () => {
    expect(() =>
      requireSafeTestDatabaseUrl("not-a-database-url"),
    ).toThrow(
      "TEST_DATABASE_URL must be a valid PostgreSQL connection URL.",
    );
  });
});
