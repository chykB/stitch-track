import {
  Buffer,
} from "node:buffer";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  nodeClientPortalTokenService,
} from "../../src/change-control/infrastructure/node-client-portal-token-service";

describe(
  "node client portal token service",
  () => {
    it(
      "issues a 256-bit URL-safe random token and stores only its SHA-256 hash material",
      () => {
        const token =
          nodeClientPortalTokenService
            .issueToken();

        expect(
          token.rawToken,
        ).toMatch(
          /^[A-Za-z0-9_-]+$/,
        );

        expect(
          Buffer.from(
            token.rawToken,
            "base64url",
          ),
        ).toHaveLength(32);

        expect(
          token.tokenHash,
        ).toMatch(
          /^[a-f0-9]{64}$/,
        );

        expect(
          token.tokenHash,
        ).toBe(
          nodeClientPortalTokenService
            .hashToken(
              token.rawToken,
            ),
        );

        expect(
          token.tokenHash,
        ).not.toContain(
          token.rawToken,
        );
      },
    );

    it(
      "hashes the same raw token deterministically",
      () => {
        const rawToken =
          "client-portal-test-token";

        expect(
          nodeClientPortalTokenService
            .hashToken(
              rawToken,
            ),
        ).toBe(
          nodeClientPortalTokenService
            .hashToken(
              rawToken,
            ),
        );
      },
    );

    it(
      "issues independent token values",
      () => {
        const first =
          nodeClientPortalTokenService
            .issueToken();

        const second =
          nodeClientPortalTokenService
            .issueToken();

        expect(
          first.rawToken,
        ).not.toBe(
          second.rawToken,
        );

        expect(
          first.tokenHash,
        ).not.toBe(
          second.tokenHash,
        );
      },
    );
  },
);
