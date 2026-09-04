export function requireSafeTestDatabaseUrl(
  databaseUrl: string | undefined,
): string {
  if (!databaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL is required for integration tests.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error(
      "TEST_DATABASE_URL must be a valid PostgreSQL connection URL.",
    );
  }

  if (
    parsedUrl.protocol !== "postgresql:" &&
    parsedUrl.protocol !== "postgres:"
  ) {
    throw new Error(
      "TEST_DATABASE_URL must use the PostgreSQL protocol.",
    );
  }

  const databaseName = decodeURIComponent(
    parsedUrl.pathname.replace(/^\/+/, ""),
  );

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing to run integration tests against non-test database "${databaseName}".`,
    );
  }

  return databaseUrl;
}
