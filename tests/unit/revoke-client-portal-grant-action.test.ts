import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  revokeClientPortalGrantForCurrentTenant,
} from "../../src/change-control/composition/revoke-client-portal-grant";
import {
  revokeClientPortalGrantAction,
} from "../../src/change-control/presentation/actions/revoke-client-portal-grant-action";
import type {
  RevokeClientPortalGrantActionState,
} from "../../src/change-control/presentation/client-portal-grant-action-state";

vi.mock(
  "../../src/change-control/composition/revoke-client-portal-grant",
  () => ({
    revokeClientPortalGrantForCurrentTenant:
      vi.fn(),
  }),
);

const BUSINESS_ID =
  "11111111-1111-4111-8111-111111111111";

const GARMENT_ID =
  "22222222-2222-4222-8222-222222222222";

const GRANT_ID =
  "33333333-3333-4333-8333-333333333333";

const PROPOSAL_ID =
  "44444444-4444-4444-8444-444444444444";

const INITIAL_STATE:
  RevokeClientPortalGrantActionState = {
    status:
      "idle",
    message:
      null,
    issues: [],
    grant:
      null,
  };

const mockedRevoke =
  vi.mocked(
    revokeClientPortalGrantForCurrentTenant,
  );

afterEach(() => {
  vi.clearAllMocks();
});

describe(
  "revokeClientPortalGrantAction",
  () => {
    it(
      "revokes the server-bound portal grant",
      async () => {
        mockedRevoke.mockResolvedValue({
          clientPortalGrantId:
            GRANT_ID,
          purpose:
            "DECIDE_CHANGE_PROPOSAL",
          changeProposalVersionId:
            PROPOSAL_ID,
          revokedAt:
            new Date(
              "2026-09-11T20:30:00.000Z",
            ),
        });

        const result =
          await revokeClientPortalGrantAction(
            BUSINESS_ID,
            GARMENT_ID,
            GRANT_ID,
            INITIAL_STATE,
            new FormData(),
          );

        expect(
          mockedRevoke,
        ).toHaveBeenCalledWith(
          BUSINESS_ID,
          {
            garmentId:
              GARMENT_ID,
            clientPortalGrantId:
              GRANT_ID,
          },
        );

        expect(result).toEqual({
          status:
            "success",
          message:
            "Client portal link revoked successfully.",
          issues: [],
          grant: {
            id:
              GRANT_ID,
            purpose:
              "DECIDE_CHANGE_PROPOSAL",
            changeProposalVersionId:
              PROPOSAL_ID,
            revokedAt:
              "2026-09-11T20:30:00.000Z",
          },
        });

        expect(
          Object.keys(
            result.grant ?? {},
          ),
        ).not.toContain(
          "tokenHash",
        );

        expect(
          Object.keys(
            result.grant ?? {},
          ),
        ).not.toContain(
          "rawToken",
        );
      },
    );

    it(
      "ignores every authority field supplied in FormData",
      async () => {
        mockedRevoke.mockResolvedValue({
          clientPortalGrantId:
            GRANT_ID,
          purpose:
            "REQUEST_CHANGE",
          changeProposalVersionId:
            null,
          revokedAt:
            new Date(
              "2026-09-11T20:30:00.000Z",
            ),
        });

        const formData =
          new FormData();

        formData.set(
          "businessId",
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        );

        formData.set(
          "garmentId",
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        );

        formData.set(
          "clientPortalGrantId",
          "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        );

        formData.set(
          "tokenHash",
          "browser-controlled-hash",
        );

        await revokeClientPortalGrantAction(
          BUSINESS_ID,
          GARMENT_ID,
          GRANT_ID,
          INITIAL_STATE,
          formData,
        );

        expect(
          mockedRevoke,
        ).toHaveBeenCalledWith(
          BUSINESS_ID,
          {
            garmentId:
              GARMENT_ID,
            clientPortalGrantId:
              GRANT_ID,
          },
        );
      },
    );

    it(
      "rejects invalid server-bound identifiers before calling the composition",
      async () => {
        const result =
          await revokeClientPortalGrantAction(
            "not-a-business-id",
            GARMENT_ID,
            GRANT_ID,
            INITIAL_STATE,
            new FormData(),
          );

        expect(
          result.status,
        ).toBe(
          "error",
        );

        expect(
          result.grant,
        ).toBeNull();

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "businessId",
          ),
        ).toBe(
          true,
        );

        expect(
          mockedRevoke,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
