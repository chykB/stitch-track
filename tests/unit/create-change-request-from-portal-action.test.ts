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
  "@/change-control/composition/create-change-request-from-portal",
  () => ({
    createChangeRequestFromPublicPortal:
      vi.fn(),
  }),
);

import {
  createChangeRequestFromPublicPortal,
} from "@/change-control/composition/create-change-request-from-portal";
import {
  createChangeRequestFromPortalAction,
} from "@/change-control/presentation/actions/create-change-request-from-portal-action";
import type {
  PortalCreateChangeRequestActionState,
} from "@/change-control/presentation/portal-create-change-request-action-state";

const INITIAL_STATE:
  PortalCreateChangeRequestActionState = {
    status:
      "idle",
    message:
      null,
    issues: [],
    submitted:
      false,
  };

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "createChangeRequestFromPortalAction",
  () => {
    it(
      "passes only the route-bound token and submitted description to the portal composition",
      async () => {
        vi.mocked(
          createChangeRequestFromPublicPortal,
        ).mockResolvedValue({
          id:
            "request-internal-id",
          businessId:
            "business-internal-id",
          clientId:
            "client-internal-id",
          orderId:
            "order-internal-id",
          garmentId:
            "garment-internal-id",
          baselineAgreementVersionId:
            "agreement-internal-id",
          requestedBy:
            "CLIENT",
          origin:
            "CLIENT_PORTAL",
          requestChannel:
            "PORTAL",
          description:
            "Add long sleeves.",
          requestedAt:
            new Date(),
          recordedByMembershipId:
            null,
          createdAt:
            new Date(),
        });

        const formData =
          new FormData();

        formData.set(
          "description",
          "  Add long sleeves.  ",
        );

        formData.set(
          "businessId",
          "browser-business-id",
        );

        formData.set(
          "garmentId",
          "browser-garment-id",
        );

        formData.set(
          "tokenHash",
          "browser-token-hash",
        );

        const result =
          await createChangeRequestFromPortalAction(
            "route-raw-token",
            INITIAL_STATE,
            formData,
          );

        expect(
          createChangeRequestFromPublicPortal,
        ).toHaveBeenCalledWith({
          rawToken:
            "route-raw-token",
          description:
            "Add long sleeves.",
        });

        expect(result).toEqual({
          status:
            "success",
          message:
            "Your change request was submitted successfully.",
          issues: [],
          submitted:
            true,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "request-internal-id",
        );
      },
    );

    it(
      "rejects an empty description before portal mutation",
      async () => {
        const formData =
          new FormData();

        formData.set(
          "description",
          "   ",
        );

        const result =
          await createChangeRequestFromPortalAction(
            "route-raw-token",
            INITIAL_STATE,
            formData,
          );

        expect(
          createChangeRequestFromPublicPortal,
        ).not.toHaveBeenCalled();

        expect(
          result.status,
        ).toBe(
          "error",
        );

        expect(
          result.issues,
        ).toEqual([
          expect.objectContaining({
            path:
              "description",
            message:
              "Change description is required.",
          }),
        ]);
      },
    );

    it.each([
      "NOT_FOUND",
      "CONFLICT",
    ] as const)(
      "collapses %s capability failures to one unavailable response",
      async (code) => {
        vi.mocked(
          createChangeRequestFromPublicPortal,
        ).mockRejectedValue(
          new ApplicationError(
            code,
            "Secret workflow state.",
          ),
        );

        const formData =
          new FormData();

        formData.set(
          "description",
          "Add sleeves.",
        );

        const result =
          await createChangeRequestFromPortalAction(
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
          submitted:
            false,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret workflow state",
        );
      },
    );
  },
);
