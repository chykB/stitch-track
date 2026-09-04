import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

import { requireSafeTestDatabaseUrl } from "./tests/support/test-database.mjs";

const testDatabaseUrl = requireSafeTestDatabaseUrl(
  process.env.TEST_DATABASE_URL,
);

process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  test: {
    name: "integration",
    environment: "node",
    include: ["tests/integration/**/*.integration.test.ts"],

    env: {
      DATABASE_URL: testDatabaseUrl,
    },

    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 10_000,
  },
});
