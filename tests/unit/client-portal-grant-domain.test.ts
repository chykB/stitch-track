import {
  describe,
  expect,
  it,
} from "vitest";

import {
  assertClientPortalGrantUsable,
  normalizeClientPortalGrantDetails,
  type ClientPortalGrant,
} from "../../src/change-control/domain/client-portal-grant";

const CREATED_AT =
  new Date(
    "2026-09-10T10:00:00.000Z",
  );

const EXPIRES_AT =
  new Date(
    "2026-09-11T10:00:00.000Z",
  );

const ACTIVE_TIME =
  new Date(
    "2026-09-10T12:00:00.000Z",
  );

const PROPOSAL_ID =
  "11111111-1111-4111-8111-111111111111";

function activeGrant(
  overrides:
    Partial<ClientPortalGrant> =
      {},
): ClientPortalGrant {
  return {
    id:
      "22222222-2222-4222-8222-222222222222",
    businessId:
      "33333333-3333-4333-8333-333333333333",
    clientId:
      "44444444-4444-4444-8444-444444444444",
    orderId:
      "55555555-5555-4555-8555-555555555555",
    garmentId:
      "66666666-6666-4666-8666-666666666666",
    changeProposalVersionId:
      null,
    purpose:
      "REQUEST_CHANGE",
    tokenHash:
      "portal-token-hash",
    expiresAt:
      EXPIRES_AT,
    consumedAt:
      null,
    revokedAt:
      null,
    createdByMembershipId:
      "77777777-7777-4777-8777-777777777777",
    createdAt:
      CREATED_AT,
    ...overrides,
  };
}

describe(
  "client portal grant domain",
  () => {
    it(
      "normalizes a REQUEST_CHANGE grant without a proposal target",
      () => {
        expect(
          normalizeClientPortalGrantDetails({
            purpose:
              "REQUEST_CHANGE",
            changeProposalVersionId:
              null,
            tokenHash:
              "  portal-token-hash  ",
            expiresAt:
              EXPIRES_AT,
            createdAt:
              CREATED_AT,
          }),
        ).toEqual({
          purpose:
            "REQUEST_CHANGE",
          changeProposalVersionId:
            null,
          tokenHash:
            "portal-token-hash",
          expiresAt:
            EXPIRES_AT,
          consumedAt:
            null,
          revokedAt:
            null,
        });
      },
    );

    it(
      "normalizes a DECIDE_CHANGE_PROPOSAL grant with its proposal target",
      () => {
        expect(
          normalizeClientPortalGrantDetails({
            purpose:
              "DECIDE_CHANGE_PROPOSAL",
            changeProposalVersionId:
              PROPOSAL_ID,
            tokenHash:
              "decision-token-hash",
            expiresAt:
              EXPIRES_AT,
            createdAt:
              CREATED_AT,
          }),
        ).toMatchObject({
          purpose:
            "DECIDE_CHANGE_PROPOSAL",
          changeProposalVersionId:
            PROPOSAL_ID,
        });
      },
    );

    it(
      "rejects a REQUEST_CHANGE grant that targets a proposal",
      () => {
        expect(() =>
          normalizeClientPortalGrantDetails({
            purpose:
              "REQUEST_CHANGE",
            changeProposalVersionId:
              PROPOSAL_ID,
            tokenHash:
              "request-token-hash",
            expiresAt:
              EXPIRES_AT,
            createdAt:
              CREATED_AT,
          }),
        ).toThrow(
          "REQUEST_CHANGE grant cannot target a change proposal.",
        );
      },
    );

    it(
      "requires a proposal target for DECIDE_CHANGE_PROPOSAL",
      () => {
        expect(() =>
          normalizeClientPortalGrantDetails({
            purpose:
              "DECIDE_CHANGE_PROPOSAL",
            changeProposalVersionId:
              null,
            tokenHash:
              "decision-token-hash",
            expiresAt:
              EXPIRES_AT,
            createdAt:
              CREATED_AT,
          }),
        ).toThrow(
          "DECIDE_CHANGE_PROPOSAL grant must target a change proposal.",
        );
      },
    );

    it(
      "requires a non-empty token hash",
      () => {
        expect(() =>
          normalizeClientPortalGrantDetails({
            purpose:
              "REQUEST_CHANGE",
            tokenHash:
              "   ",
            expiresAt:
              EXPIRES_AT,
            createdAt:
              CREATED_AT,
          }),
        ).toThrow(
          "client portal grant token hash is required.",
        );
      },
    );

    it(
      "requires expiry after creation",
      () => {
        expect(() =>
          normalizeClientPortalGrantDetails({
            purpose:
              "REQUEST_CHANGE",
            tokenHash:
              "request-token-hash",
            expiresAt:
              CREATED_AT,
            createdAt:
              CREATED_AT,
          }),
        ).toThrow(
          "client portal grant must expire after creation.",
        );
      },
    );

    it(
      "rejects consumption outside the validity window",
      () => {
        expect(() =>
          normalizeClientPortalGrantDetails({
            purpose:
              "REQUEST_CHANGE",
            tokenHash:
              "request-token-hash",
            expiresAt:
              EXPIRES_AT,
            consumedAt:
              new Date(
                "2026-09-11T10:00:01.000Z",
              ),
            createdAt:
              CREATED_AT,
          }),
        ).toThrow(
          "client portal grant consumption time is outside its validity window.",
        );
      },
    );

    it(
      "rejects a grant that is both consumed and revoked",
      () => {
        expect(() =>
          normalizeClientPortalGrantDetails({
            purpose:
              "REQUEST_CHANGE",
            tokenHash:
              "request-token-hash",
            expiresAt:
              EXPIRES_AT,
            consumedAt:
              ACTIVE_TIME,
            revokedAt:
              ACTIVE_TIME,
            createdAt:
              CREATED_AT,
          }),
        ).toThrow(
          "client portal grant cannot be both consumed and revoked.",
        );
      },
    );

    it(
      "accepts an active grant for its intended purpose",
      () => {
        expect(() =>
          assertClientPortalGrantUsable(
            activeGrant(),
            "REQUEST_CHANGE",
            ACTIVE_TIME,
          ),
        ).not.toThrow();
      },
    );

    it(
      "rejects a grant used for the wrong purpose",
      () => {
        expect(() =>
          assertClientPortalGrantUsable(
            activeGrant(),
            "DECIDE_CHANGE_PROPOSAL",
            ACTIVE_TIME,
          ),
        ).toThrow(
          "client portal grant has the wrong purpose.",
        );
      },
    );

    it(
      "rejects a consumed grant",
      () => {
        expect(() =>
          assertClientPortalGrantUsable(
            activeGrant({
              consumedAt:
                ACTIVE_TIME,
            }),
            "REQUEST_CHANGE",
            ACTIVE_TIME,
          ),
        ).toThrow(
          "client portal grant has already been consumed.",
        );
      },
    );

    it(
      "rejects a revoked grant",
      () => {
        expect(() =>
          assertClientPortalGrantUsable(
            activeGrant({
              revokedAt:
                ACTIVE_TIME,
            }),
            "REQUEST_CHANGE",
            ACTIVE_TIME,
          ),
        ).toThrow(
          "client portal grant has been revoked.",
        );
      },
    );

    it(
      "treats the exact expiry instant as expired",
      () => {
        expect(() =>
          assertClientPortalGrantUsable(
            activeGrant(),
            "REQUEST_CHANGE",
            EXPIRES_AT,
          ),
        ).toThrow(
          "client portal grant has expired.",
        );
      },
    );
  },
);
