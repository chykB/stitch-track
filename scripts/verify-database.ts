import { prisma } from "../src/shared/database/prisma";

type DatabaseIdentity = {
  database_name: string;
  database_user: string;
  server_version: string;
};

function getExpectedIdentity(): {
  databaseName: string;
  databaseUser: string;
} {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const parsedUrl = new URL(databaseUrl);

  return {
    databaseName: decodeURIComponent(
      parsedUrl.pathname.replace(/^\//, ""),
    ),
    databaseUser: decodeURIComponent(parsedUrl.username),
  };
}

async function main(): Promise<void> {
  const expected = getExpectedIdentity();

  const rows = await prisma.$queryRaw<DatabaseIdentity[]>`
    SELECT
      current_database()::text AS database_name,
      current_user::text AS database_user,
      current_setting('server_version') AS server_version
  `;

  const identity = rows[0];

  if (!identity) {
    throw new Error("Database identity query returned no rows.");
  }

  if (identity.database_name !== expected.databaseName) {
    throw new Error(
      `Connected to unexpected database: ${identity.database_name}`,
    );
  }

  if (identity.database_user !== expected.databaseUser) {
    throw new Error(
      `Connected as unexpected database user: ${identity.database_user}`,
    );
  }

  console.log(
    `PASS: Prisma connected to ${identity.database_name} as ${identity.database_user}`,
  );
  console.log(
    `PASS: PostgreSQL server version ${identity.server_version}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Database verification failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
