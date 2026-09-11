import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  issueRequestChangePortalGrantForCurrentTenant,
} from "../../src/change-control/composition/issue-request-change-portal-grant";
import {
  issueRequestChangePortalGrantAction,
} from "../../src/change-control/presentation/actions/issue-request-change-portal-grant-action";
import type {
  IssueClientPortalGrantActionState,
} from "../../src/change-control/presentation/client-portal-grant-action-state";

vi.mock(
  "../../src/change-control/composition/issue-request-change-portal-grant",
  () => ({
    issueRequestChangePortalGrantForCurrentTenant:
      vi.fn(),
  }),
);

const BUSINESS_ID =
  "11111111-1111-4111-8111-111111111111";

const GARMENT_ID =
  "22222222-2222-4222-8222-222222222222";

const GRANT_ID =
  "33333333-3333-4333-8333-333333333333";

const INITIAL_STATE:
  IssueClientPortalGrantActionState = {
    status:
      "idle",
    message:
      null,
    issues: [],
    grant:
      null,
  };

const mockedIssue =
  vi.mocked(
    issueRequestChangePortalGrantForCurrentTenant,
  );

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe(
  "issueRequestChangePortalGrantAction",
  () => {
    it(
      "derives expiry on the server and returns the one-time portal path",
      async () => {
        vi.useFakeTimers();

        vi.setSystemTime(
          new Date(
            "2026-09-11T20:00:00.000Z",
          ),
        );

        mockedIssue.mockResolvedValue({
          clientPortalGrantId:
            GRANT_ID,
          rawToken:
            "secret-capability-token",
          purpose:
            "REQUEST_CHANGE",
          changeProposalVersionId:
            null,
          expiresAt:
            new Date(
              "2026-09-14T20:00:00.000Z",
            ),
          createdAt:
            new Date(
              "2026-09-11T20:00:00.000Z",
            ),
        });

        const formData =
          new FormData();

        formData.set(
          "validForHours",
          "72",
        );

        const result =
          await issueRequestChangePortalGrantAction(
            BUSINESS_ID,
            GARMENT_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          mockedIssue,
        ).toHaveBeenCalledWith(
          BUSINESS_ID,
          {
            garmentId:
              GARMENT_ID,
            expiresAt:
              new Date(
                "2026-09-14T20:00:00.000Z",
              ),
          },
        );

        expect(result).toEqual({
          status:
            "success",
          message:
            "Client change-request link created. Copy it now because StitchTrack will not be able to show this exact link again.",
          issues: [],
          grant: {
            id:
              GRANT_ID,
            purpose:
              "REQUEST_CHANGE",
            changeProposalVersionId:
              null,
            portalPath:
              "/portal/change-request/secret-capability-token",
            expiresAt:
              "2026-09-14T20:00:00.000Z",
            createdAt:
              "2026-09-11T20:00:00.000Z",
          },
        });

        expect(
          Object.keys(
            result.grant ?? {},
          ),
        ).not.toContain(
          "rawToken",
        );

        expect(
          Object.keys(
            result.grant ?? {},
          ),
        ).not.toContain(
          "tokenHash",
        );
      },
    );

    it(
      "ignores authority-bearing fields supplied by the browser",
      async () => {
        mockedIssue.mockResolvedValue({
          clientPortalGrantId:
            GRANT_ID,
          rawToken:
            "safe-token",
          purpose:
            "REQUEST_CHANGE",
          changeProposalVersionId:
            null,
          expiresAt:
            new Date(
              "2026-09-12T20:00:00.000Z",
            ),
          createdAt:
            new Date(
              "2026-09-11T20:00:00.000Z",
            ),
        });

        const formData =
          new FormData();

        formData.set(
          "validForHours",
          "24",
        );

        formData.set(
          "businessId",
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        );

        formData.set(
          "garmentId",
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        );

        formData.set(
          "tokenHash",
          "browser-controlled-hash",
        );

        formData.set(
          "createdByMembershipId",
          "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        );

        await issueRequestChangePortalGrantAction(
          BUSINESS_ID,
          GARMENT_ID,
          INITIAL_STATE,
          formData,
        );

        expect(
          mockedIssue,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          mockedIssue.mock.calls[0][0],
        ).toBe(
          BUSINESS_ID,
        );

        expect(
          mockedIssue.mock.calls[0][1]
            .garmentId,
        ).toBe(
          GARMENT_ID,
        );

        expect(
          mockedIssue.mock.calls[0][1],
        ).not.toHaveProperty(
          "tokenHash",
        );

        expect(
          mockedIssue.mock.calls[0][1],
        ).not.toHaveProperty(
          "createdByMembershipId",
        );
      },
    );

    it(
      "rejects unsupported validity windows before issuing a grant",
      async () => {
        const formData =
          new FormData();

        formData.set(
          "validForHours",
          "999",
        );

        const result =
          await issueRequestChangePortalGrantAction(
            BUSINESS_ID,
            GARMENT_ID,
            INITIAL_STATE,
            formData,
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
              "validForHours",
          ),
        ).toBe(
          true,
        );

        expect(
          mockedIssue,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
