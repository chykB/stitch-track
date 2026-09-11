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
  "@/change-control/composition/close-change-request",
  () => ({
    closeChangeRequestForCurrentTenant:
      vi.fn(),
  }),
);

import {
  closeChangeRequestForCurrentTenant,
} from "@/change-control/composition/close-change-request";
import {
  closeChangeRequestAction,
} from "@/change-control/presentation/actions/close-change-request-action";
import type {
  CloseChangeRequestActionState,
} from "@/change-control/presentation/close-change-request-action-state";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const GARMENT_A_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const GARMENT_B_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const CHANGE_REQUEST_A_ID =
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const CHANGE_REQUEST_B_ID =
  "ffffffff-ffff-4fff-8fff-ffffffffffff";

const CLOSURE_ID =
  "11111111-1111-4111-8111-111111111111";

const MEMBERSHIP_ID =
  "22222222-2222-4222-8222-222222222222";

const OCCURRED_AT =
  new Date(
    "2026-09-10T19:20:00.000Z",
  );

const INITIAL_STATE:
  CloseChangeRequestActionState = {
    status: "idle",
    message: null,
    issues: [],
    closure: null,
  };

function validFormData(
  outcome:
    "WITHDRAWN" |
    "IMPOSSIBLE" =
      "WITHDRAWN",
): FormData {
  const formData =
    new FormData();

  formData.set(
    "businessId",
    BUSINESS_B_ID,
  );

  formData.set(
    "garmentId",
    GARMENT_B_ID,
  );

  formData.set(
    "changeRequestId",
    CHANGE_REQUEST_B_ID,
  );

  formData.set(
    "outcome",
    outcome,
  );

  formData.set(
    "reason",
    "  Client no longer wants the change.  ",
  );

  formData.set(
    "occurredAt",
    OCCURRED_AT.toISOString(),
  );

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "closeChangeRequestAction",
  () => {
    it(
      "uses bound identifiers and validated closure evidence",
      async () => {
        vi.mocked(
          closeChangeRequestForCurrentTenant,
        ).mockResolvedValue({
          id:
            CLOSURE_ID,
          businessId:
            BUSINESS_A_ID,
          changeRequestId:
            CHANGE_REQUEST_A_ID,
          outcome:
            "WITHDRAWN",
          reason:
            "Client no longer wants the change.",
          occurredAt:
            OCCURRED_AT,
          recordedByMembershipId:
            MEMBERSHIP_ID,
          createdAt:
            new Date(),
        });

        const result =
          await closeChangeRequestAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            INITIAL_STATE,
            validFormData(),
          );

        expect(
          closeChangeRequestForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            changeRequestId:
              CHANGE_REQUEST_A_ID,
            outcome:
              "WITHDRAWN",
            reason:
              "Client no longer wants the change.",
            occurredAt:
              OCCURRED_AT,
          },
        );

        expect(result).toEqual({
          status: "success",
          message:
            "Change request closed successfully.",
          issues: [],
          closure: {
            id:
              CLOSURE_ID,
            changeRequestId:
              CHANGE_REQUEST_A_ID,
            outcome:
              "WITHDRAWN",
            occurredAt:
              OCCURRED_AT.toISOString(),
          },
        });
      },
    );

    it(
      "accepts IMPOSSIBLE as the only other terminal closure outcome",
      async () => {
        vi.mocked(
          closeChangeRequestForCurrentTenant,
        ).mockResolvedValue({
          id:
            CLOSURE_ID,
          businessId:
            BUSINESS_A_ID,
          changeRequestId:
            CHANGE_REQUEST_A_ID,
          outcome:
            "IMPOSSIBLE",
          reason:
            "Requested construction cannot be completed safely.",
          occurredAt:
            OCCURRED_AT,
          recordedByMembershipId:
            MEMBERSHIP_ID,
          createdAt:
            new Date(),
        });

        const formData =
          validFormData(
            "IMPOSSIBLE",
          );

        formData.set(
          "reason",
          "  Requested construction cannot be completed safely.  ",
        );

        const result =
          await closeChangeRequestAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          closeChangeRequestForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            changeRequestId:
              CHANGE_REQUEST_A_ID,
            outcome:
              "IMPOSSIBLE",
            reason:
              "Requested construction cannot be completed safely.",
            occurredAt:
              OCCURRED_AT,
          },
        );

        expect(result.closure)
          .toMatchObject({
            outcome:
              "IMPOSSIBLE",
          });
      },
    );

    it(
      "rejects non-closure outcomes before mutation",
      async () => {
        const formData =
          validFormData();

        formData.set(
          "outcome",
          "APPROVED",
        );

        const result =
          await closeChangeRequestAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          closeChangeRequestForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(result.status)
          .toBe("error");

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "outcome",
          ),
        ).toBe(true);
      },
    );

    it(
      "ignores protected lifecycle fields supplied through FormData",
      async () => {
        vi.mocked(
          closeChangeRequestForCurrentTenant,
        ).mockResolvedValue({
          id:
            CLOSURE_ID,
          businessId:
            BUSINESS_A_ID,
          changeRequestId:
            CHANGE_REQUEST_A_ID,
          outcome:
            "WITHDRAWN",
          reason:
            "Client no longer wants the change.",
          occurredAt:
            OCCURRED_AT,
          recordedByMembershipId:
            MEMBERSHIP_ID,
          createdAt:
            new Date(),
        });

        const formData =
          validFormData();

        formData.set(
          "recordedByMembershipId",
          "33333333-3333-4333-8333-333333333333",
        );

        formData.set(
          "portalGrantId",
          "44444444-4444-4444-8444-444444444444",
        );

        await closeChangeRequestAction(
          BUSINESS_A_ID,
          GARMENT_A_ID,
          CHANGE_REQUEST_A_ID,
          INITIAL_STATE,
          formData,
        );

        const [
          ,
          request,
        ] = vi.mocked(
          closeChangeRequestForCurrentTenant,
        ).mock.calls[0];

        expect(request)
          .not.toHaveProperty(
            "recordedByMembershipId",
          );

        expect(request)
          .not.toHaveProperty(
            "portalGrantId",
          );
      },
    );

    it(
      "returns a safe CONFLICT response without leaking lifecycle details",
      async () => {
        vi.mocked(
          closeChangeRequestForCurrentTenant,
        ).mockRejectedValue(
          new ApplicationError(
            "CONFLICT",
            "Secret closure lifecycle detail.",
          ),
        );

        const result =
          await closeChangeRequestAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            INITIAL_STATE,
            validFormData(),
          );

        expect(result).toEqual({
          status: "error",
          message:
            "The request conflicts with the current state.",
          issues: [],
          closure:
            null,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret closure lifecycle detail.",
        );
      },
    );
  },
);
