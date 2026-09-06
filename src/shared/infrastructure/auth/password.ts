import {
  hash,
  verify,
  type Options,
} from "@node-rs/argon2";

export const ARGON2_PASSWORD_POLICY = {
  algorithm: 2, // Argon2id
  version: 1, // Argon2 version 19 (0x13)
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} satisfies Options;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_PASSWORD_POLICY);
}

export async function verifyPassword({
  hash: encodedHash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  return verify(encodedHash, password, ARGON2_PASSWORD_POLICY);
}
