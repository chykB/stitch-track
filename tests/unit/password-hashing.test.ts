import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
} from "../../src/shared/infrastructure/auth/password";

describe("Argon2id password hashing", () => {
  it("creates an Argon2id version 19 hash using the configured work factors", async () => {
    const password = "correct horse battery staple";

    const encodedHash = await hashPassword(password);

    expect(encodedHash).toMatch(/^\$argon2id\$v=19\$/);
    expect(encodedHash).toContain("m=19456,t=2,p=1");
  });

  it("verifies the correct password", async () => {
    const password = "correct horse battery staple";
    const encodedHash = await hashPassword(password);

    await expect(
      verifyPassword({
        hash: encodedHash,
        password,
      }),
    ).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const encodedHash = await hashPassword(
      "correct horse battery staple",
    );

    await expect(
      verifyPassword({
        hash: encodedHash,
        password: "incorrect horse battery staple",
      }),
    ).resolves.toBe(false);
  });

  it("uses a unique salt for repeated hashing of the same password", async () => {
    const password = "correct horse battery staple";

    const firstHash = await hashPassword(password);
    const secondHash = await hashPassword(password);

    expect(firstHash).not.toBe(secondHash);
  });

  it("does not contain the plaintext password in the encoded hash", async () => {
    const password = "correct horse battery staple";

    const encodedHash = await hashPassword(password);

    expect(encodedHash).not.toContain(password);
  });
});
