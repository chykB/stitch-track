import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_EMAIL = "v02-auth-integration@example.invalid";
const TEST_EMAIL_UPPER = "V02-AUTH-INTEGRATION@EXAMPLE.INVALID";
const TEST_PASSWORD = "stitchtrack integration passphrase 2026";
const WRONG_PASSWORD = "stitchtrack incorrect passphrase 2026";

type Auth = typeof import("../../src/shared/composition/auth").auth;
type Prisma = typeof import("../../src/shared/database/prisma").prisma;

let auth: Auth;
let prisma: Prisma;

function assertDedicatedTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for auth integration tests.");
  }

  const databaseName = new URL(databaseUrl).pathname.slice(1);

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing auth integration tests against non-test database "${databaseName}".`,
    );
  }
}

function cookieHeaderFrom(responseHeaders: Headers): string {
  return responseHeaders
    .getSetCookie()
    .map((cookie) => cookie.split(";", 1)[0])
    .join("; ");
}

async function removeTestUsers(): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [TEST_EMAIL, TEST_EMAIL_UPPER],
      },
    },
    select: {
      id: true,
    },
  });

  if (users.length === 0) {
    return;
  }

  await prisma.user.deleteMany({
    where: {
      id: {
        in: users.map((user) => user.id),
      },
    },
  });
}

beforeAll(async () => {
  assertDedicatedTestDatabase();

  ({ prisma } = await import("../../src/shared/database/prisma"));
  ({ auth } = await import("../../src/shared/composition/auth"));

  await removeTestUsers();
});

afterAll(async () => {
  await removeTestUsers();
  await prisma.$disconnect();
});

describe("Better Auth integration", () => {
  it("creates a user and stores an Argon2id password hash without creating a session", async () => {
    await auth.api.signUpEmail({
      body: {
        name: "V0.2 Auth Integration",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        email: TEST_EMAIL,
      },
    });

    expect(user).not.toBeNull();

    const account = await prisma.account.findFirst({
      where: {
        userId: user!.id,
      },
    });

    expect(account).not.toBeNull();
    expect(account!.password).toMatch(/^\$argon2id\$v=19\$/);
    expect(account!.password).toContain("m=19456,t=2,p=1");
    expect(account!.password).not.toContain(TEST_PASSWORD);

    const sessionCount = await prisma.session.count({
      where: {
        userId: user!.id,
      },
    });

    expect(sessionCount).toBe(0);
  });

  it("does not create another user for an exact duplicate sign-up", async () => {
    await auth.api.signUpEmail({
      body: {
        name: "Duplicate Sign Up",
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });

    const userCount = await prisma.user.count({
      where: {
        email: TEST_EMAIL,
      },
    });

    expect(userCount).toBe(1);
  });

  it("rejects an incorrect password without creating a session", async () => {
    await expect(
      auth.api.signInEmail({
        body: {
          email: TEST_EMAIL,
          password: WRONG_PASSWORD,
        },
      }),
    ).rejects.toBeTruthy();

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: TEST_EMAIL,
      },
    });

    const sessionCount = await prisma.session.count({
      where: {
        userId: user.id,
      },
    });

    expect(sessionCount).toBe(0);
  });

  it("signs in with the correct password and resolves the resulting session cookie", async () => {
    const {
      headers: responseHeaders,
      response,
    } = await auth.api.signInEmail({
      returnHeaders: true,
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });

    expect(response.user.email).toBe(TEST_EMAIL);

    const setCookies = responseHeaders.getSetCookie();

    expect(
      setCookies.some((cookie) =>
        cookie.startsWith("better-auth.session_token="),
      ),
    ).toBe(true);

    const cookieHeader = cookieHeaderFrom(responseHeaders);

    const resolvedSession = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieHeader,
      }),
    });

    expect(resolvedSession).not.toBeNull();
    expect(resolvedSession!.user.email).toBe(TEST_EMAIL);
    expect(resolvedSession!.session.userId).toBe(response.user.id);

    const storedSessions = await prisma.session.count({
      where: {
        userId: response.user.id,
      },
    });

    expect(storedSessions).toBeGreaterThan(0);
  });

  it("does not permit email casing to create a second identity", async () => {
    await auth.api.signUpEmail({
      body: {
        name: "Case Variant",
        email: TEST_EMAIL_UPPER,
        password: TEST_PASSWORD,
      },
    });

    const identities = await prisma.user.findMany({
      where: {
        email: {
          in: [TEST_EMAIL, TEST_EMAIL_UPPER],
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    expect(identities).toHaveLength(1);
  });
});
