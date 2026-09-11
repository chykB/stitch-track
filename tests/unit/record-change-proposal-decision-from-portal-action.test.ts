import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ApplicationError,
} from "@/shared/application/errors/application-error";

vi.mock(
  "@/change-control/composition/record-change-proposal-decision-from-portal",
  () => ({
    recordChangeProposalDecisionFromPublicPortal:
      vi.fn(),
  }),
);

import {
  recordChangeProposalDecisionFromPublicPortal,
} from "@/change-control/composition/record-change-proposal-decision-from-portal";
import {
  recordChangeProposalDecisionFromPortalAction,
} from "@/change-control/presentation/actions/record-change-proposal-decision-from-portal-action";
import type {
  PortalChangeProposalDecisionActionState,
} from "@/change-control/presentation/portal-change-proposal-decision-action-state";

const INITIAL_STATE:
  PortalChangeProposalDecisionActionState = {
    status:
      "idle",
    message:
      null,
    issues: [],
    decision:
      null,
  };

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "recordChangeProposalDecisionFromPortalAction",
  () => {
    it.each([
      "APPROVED",
      "REJECTED",
    ] as const)(
      "submits only %s and the optional note with the route-bound capability",
      async (outcome) => {
        vi.mocked(
          recordChangeProposalDecisionFromPublicPortal,
        ).mockResolvedValue({
          decisionId:
            "internal-decision-id",
          outcome,
          occurredAt:
            new Date(),
          appliedAgreementVersionId:
            outcome ===
              "APPROVED"
              ? "internal-agreement-id"
              : null,
        });

        const formData =
          new FormData();

        formData.set(
          "outcome",
          outcome,
        );

        formData.set(
          "clientNote",
          "  Please keep the cuff simple.  ",
        );

        formData.set(
          "proposalId",
          "browser-proposal-id",
        );

        formData.set(
          "membershipId",
          "browser-membership-id",
        );

        const result =
          await recordChangeProposalDecisionFromPortalAction(
            "route-raw-token",
            INITIAL_STATE,
            formData,
          );

        expect(
          recordChangeProposalDecisionFromPublicPortal,
        ).toHaveBeenCalledWith({
          rawToken:
            "route-raw-token",
          outcome,
          clientNote:
            "Please keep the cuff simple.",
        });

        expect(
          result.decision,
        ).toBe(
          outcome,
        );

        const serialized =
          JSON.stringify(
            result,
          );

        expect(
          serialized,
        ).not.toContain(
          "internal-decision-id",
        );

        expect(
          serialized,
        ).not.toContain(
          "internal-agreement-id",
        );
      },
    );

    it(
      "rejects an invalid outcome before portal mutation",
      async () => {
        const formData =
          new FormData();

        formData.set(
          "outcome",
          "MAYBE",
        );

        formData.set(
          "clientNote",
          "",
        );

        const result =
          await recordChangeProposalDecisionFromPortalAction(
            "route-raw-token",
            INITIAL_STATE,
            formData,
          );

        expect(
          recordChangeProposalDecisionFromPublicPortal,
        ).not.toHaveBeenCalled();

        expect(
          result.status,
        ).toBe(
          "error",
        );

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "outcome",
          ),
        ).toBe(
          true,
        );
      },
    );

    it.each([
      "NOT_FOUND",
      "CONFLICT",
    ] as const)(
      "collapses %s capability failures to one unavailable response",
      async (code) => {
        vi.mocked(
          recordChangeProposalDecisionFromPublicPortal,
        ).mockRejectedValue(
          new ApplicationError(
            code,
            "Secret proposal state.",
          ),
        );

        const formData =
          new FormData();

        formData.set(
          "outcome",
          "APPROVED",
        );

        formData.set(
          "clientNote",
          "",
        );

        const result =
          await recordChangeProposalDecisionFromPortalAction(
            "route-raw-token",
            INITIAL_STATE,
            formData,
          );

        expect(result).toEqual({
          status:
            "error",
          message:
            "This portal link is unavailable.",
          issues: [],
          decision:
            null,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret proposal state",
        );
      },
    );
  },
);
