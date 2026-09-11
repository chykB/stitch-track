import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  issueChangeProposalDecisionPortalGrantForCurrentTenant,
} from "../../src/change-control/composition/issue-change-proposal-decision-portal-grant";
import {
  issueChangeProposalDecisionPortalGrantAction,
} from "../../src/change-control/presentation/actions/issue-change-proposal-decision-portal-grant-action";
import type {
  IssueClientPortalGrantActionState,
} from "../../src/change-control/presentation/client-portal-grant-action-state";

vi.mock(
  "../../src/change-control/composition/issue-change-proposal-decision-portal-grant",
  () => ({
    issueChangeProposalDecisionPortalGrantForCurrentTenant:
      vi.fn(),
  }),
);

const BUSINESS_ID =
  "11111111-1111-4111-8111-111111111111";

const GARMENT_ID =
  "22222222-2222-4222-8222-222222222222";

const CHANGE_REQUEST_ID =
  "33333333-3333-4333-8333-333333333333";

const PROPOSAL_ID =
  "44444444-4444-4444-8444-444444444444";

const GRANT_ID =
  "55555555-5555-4555-8555-555555555555";

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
    issueChangeProposalDecisionPortalGrantForCurrentTenant,
  );

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe(
  "issueChangeProposalDecisionPortalGrantAction",
  () => {
    it(
      "derives expiry on the server and returns the one-time decision portal path",
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
            "decision-secret-token",
          purpose:
            "DECIDE_CHANGE_PROPOSAL",
          changeProposalVersionId:
            PROPOSAL_ID,
          expiresAt:
            new Date(
              "2026-09-18T20:00:00.000Z",
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
          "168",
        );

        const result =
          await issueChangeProposalDecisionPortalGrantAction(
            BUSINESS_ID,
            GARMENT_ID,
            CHANGE_REQUEST_ID,
            PROPOSAL_ID,
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
            changeRequestId:
              CHANGE_REQUEST_ID,
            changeProposalVersionId:
              PROPOSAL_ID,
            expiresAt:
              new Date(
                "2026-09-18T20:00:00.000Z",
              ),
          },
        );

        expect(result).toEqual({
          status:
            "success",
          message:
            "Client proposal-decision link created. Copy it now because StitchTrack will not be able to show this exact link again.",
          issues: [],
          grant: {
            id:
              GRANT_ID,
            purpose:
              "DECIDE_CHANGE_PROPOSAL",
            changeProposalVersionId:
              PROPOSAL_ID,
            portalPath:
              "/portal/change-decision/decision-secret-token",
            expiresAt:
              "2026-09-18T20:00:00.000Z",
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
      "ignores browser-supplied authority identifiers",
      async () => {
        mockedIssue.mockResolvedValue({
          clientPortalGrantId:
            GRANT_ID,
          rawToken:
            "safe-token",
          purpose:
            "DECIDE_CHANGE_PROPOSAL",
          changeProposalVersionId:
            PROPOSAL_ID,
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
          "changeRequestId",
          "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        );

        formData.set(
          "changeProposalVersionId",
          "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        );

        formData.set(
          "tokenHash",
          "browser-controlled-hash",
        );

        await issueChangeProposalDecisionPortalGrantAction(
          BUSINESS_ID,
          GARMENT_ID,
          CHANGE_REQUEST_ID,
          PROPOSAL_ID,
          INITIAL_STATE,
          formData,
        );

        expect(
          mockedIssue,
        ).toHaveBeenCalledWith(
          BUSINESS_ID,
          expect.objectContaining({
            garmentId:
              GARMENT_ID,
            changeRequestId:
              CHANGE_REQUEST_ID,
            changeProposalVersionId:
              PROPOSAL_ID,
          }),
        );

        expect(
          mockedIssue.mock.calls[0][1],
        ).not.toHaveProperty(
          "tokenHash",
        );
      },
    );

    it(
      "rejects unsupported validity windows before issuing a decision grant",
      async () => {
        const formData =
          new FormData();

        formData.set(
          "validForHours",
          "48",
        );

        const result =
          await issueChangeProposalDecisionPortalGrantAction(
            BUSINESS_ID,
            GARMENT_ID,
            CHANGE_REQUEST_ID,
            PROPOSAL_ID,
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
