import {
  createHash,
  randomBytes,
} from "node:crypto";

import type {
  ClientPortalTokenService,
} from "../application/ports/client-portal-token-service";

const CLIENT_PORTAL_TOKEN_BYTES =
  32;

export const nodeClientPortalTokenService:
  ClientPortalTokenService = {
    issueToken() {
      const rawToken =
        randomBytes(
          CLIENT_PORTAL_TOKEN_BYTES,
        ).toString("base64url");

      return {
        rawToken,
        tokenHash:
          this.hashToken(
            rawToken,
          ),
      };
    },

    hashToken(
      rawToken: string,
    ) {
      return createHash(
        "sha256",
      )
        .update(
          rawToken,
          "utf8",
        )
        .digest("hex");
    },
  };
