import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/database/prisma";

type DatabaseIdentity = {
  database_name: string;
  database_user: string;
};

function getExpectedDatabaseIdentity(): DatabaseIdentity {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be available during integration tests.",
    );
  }

  const parsedUrl = new URL(databaseUrl);

  return {
    database_name: decodeURIComponent(
      parsedUrl.pathname.replace(/^\/+/, ""),
    ),
    database_user: decodeURIComponent(parsedUrl.username),
  };
}

describe("database integration", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to the dedicated test database", async () => {
    const expected = getExpectedDatabaseIdentity();

    const rows = await prisma.$queryRaw<DatabaseIdentity[]>`
      SELECT
        current_database()::text AS database_name,
        current_user::text AS database_user
    `;

    expect(rows).toHaveLength(1);

    expect(rows[0]).toEqual(expected);

    expect(rows[0]?.database_name.endsWith("_test")).toBe(true);
  });
});
