import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "../database/prisma";
import {
  hashPassword,
  verifyPassword,
} from "../infrastructure/auth/password";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export const auth = betterAuth({
  baseURL: requireEnvironmentVariable("BETTER_AUTH_URL"),
  secret: requireEnvironmentVariable("BETTER_AUTH_SECRET"),

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,

    // StitchTrack V0.2 does not yet provide MFA.
    minPasswordLength: 15,

    // Better Auth supports 128 and this leaves ample room for passphrases.
    maxPasswordLength: 128,

    // Require an explicit sign-in after registration.
    // This also gives Better Auth stronger duplicate-sign-up
    // enumeration protection than the default auto-sign-in flow.
    autoSignIn: false,

    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },

  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});
