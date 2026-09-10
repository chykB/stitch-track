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
  "@/change-control/composition/create-change-request",
  () => ({
    createChangeRequestForCurrentTenant:
      vi.fn(),
  }),
);

import {
  createChangeRequestForCurrentTenant,
} from "@/change-control/composition/create-change-request";
import {
  createChangeRequestAction,
} from "@/change-control/presentation/actions/create-change-request-action";
import type {
  CreateChangeRequestActionState,
} from "@/change-control/presentation/create-change-request-action-state";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const GARMENT_A_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const GARMENT_B_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const CLIENT_ID =
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const ORDER_ID =
  "ffffffff-ffff-4fff-8fff-ffffffffffff";

const AGREEMENT_ID =
  "11111111-1111-4111-8111-111111111111";

const CHANGE_REQUEST_ID =
  "22222222-2222-4222-8222-222222222222";

const MEMBERSHIP_ID =
  "33333333-3333-4333-8333-333333333333";

const INITIAL_STATE:
  CreateChangeRequestActionState = {
    status: "idle",
    message: null,
    issues: [],
    changeRequest: null,
  };

const REQUESTED_AT =
  new Date(
    "2026-09-10T18:00:00.000Z",
  );

function validClientFormData():
  FormData {
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
    "requestedBy",
    "CLIENT",
  );

  formData.set(
    "requestChannel",
    "WHATSAPP",
  );

  formData.set(
    "description",
    "  Add long sleeves to the gown.  ",
  );

  formData.set(
    "requestedAt",
    REQUESTED_AT.toISOString(),
  );

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "createChangeRequestAction",
  () => {
    it(
      "uses bound identifiers and validated Business-recorded request evidence",
      async () => {
        vi.mocked(
          createChangeRequestForCurrentTenant,
        ).mockResolvedValue({
          id:
            CHANGE_REQUEST_ID,
          businessId:
            BUSINESS_A_ID,
          clientId:
            CLIENT_ID,
          orderId:
            ORDER_ID,
          garmentId:
            GARMENT_A_ID,
          baselineAgreementVersionId:
            AGREEMENT_ID,
          requestedBy:
            "CLIENT",
          origin:
            "BUSINESS_RECORDED",
          requestChannel:
            "WHATSAPP",
          description:
            "Add long sleeves to the gown.",
          requestedAt:
            REQUESTED_AT,
          recordedByMembershipId:
            MEMBERSHIP_ID,
          createdAt:
            new Date(),
        });

        const result =
          await createChangeRequestAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            validClientFormData(),
          );

        expect(
          createChangeRequestForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            requestedBy:
              "CLIENT",
            requestChannel:
              "WHATSAPP",
            description:
              "Add long sleeves to the gown.",
            requestedAt:
              REQUESTED_AT,
          },
        );

        expect(result).toEqual({
          status: "success",
          message:
            "Change request recorded successfully.",
          issues: [],
          changeRequest: {
            id:
              CHANGE_REQUEST_ID,
            garmentId:
              GARMENT_A_ID,
            requestedBy:
              "CLIENT",
            requestChannel:
              "WHATSAPP",
            description:
              "Add long sleeves to the gown.",
            requestedAt:
              REQUESTED_AT.toISOString(),
          },
        });
      },
    );

    it(
      "accepts a Business-requested change only without a client channel",
      async () => {
        vi.mocked(
          createChangeRequestForCurrentTenant,
        ).mockResolvedValue({
          id:
            CHANGE_REQUEST_ID,
          businessId:
            BUSINESS_A_ID,
          clientId:
            CLIENT_ID,
          orderId:
            ORDER_ID,
          garmentId:
            GARMENT_A_ID,
          baselineAgreementVersionId:
            AGREEMENT_ID,
          requestedBy:
            "BUSINESS",
          origin:
            "BUSINESS_RECORDED",
          requestChannel:
            null,
          description:
            "Correct construction detail.",
          requestedAt:
            REQUESTED_AT,
          recordedByMembershipId:
            MEMBERSHIP_ID,
          createdAt:
            new Date(),
        });

        const formData =
          validClientFormData();

        formData.set(
          "requestedBy",
          "BUSINESS",
        );

        formData.set(
          "requestChannel",
          "",
        );

        formData.set(
          "description",
          "Correct construction detail.",
        );

        const result =
          await createChangeRequestAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createChangeRequestForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            requestedBy:
              "BUSINESS",
            requestChannel:
              null,
            description:
              "Correct construction detail.",
            requestedAt:
              REQUESTED_AT,
          },
        );

        expect(result.status)
          .toBe("success");
      },
    );

    it(
      "rejects PORTAL as a Business action channel before mutation",
      async () => {
        const formData =
          validClientFormData();

        formData.set(
          "requestChannel",
          "PORTAL",
        );

        const result =
          await createChangeRequestAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createChangeRequestForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(result.status)
          .toBe("error");

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "requestChannel",
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects a client channel for a Business-requested change before mutation",
      async () => {
        const formData =
          validClientFormData();

        formData.set(
          "requestedBy",
          "BUSINESS",
        );

        formData.set(
          "requestChannel",
          "PHONE",
        );

        const result =
          await createChangeRequestAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createChangeRequestForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "requestChannel",
          ),
        ).toBe(true);
      },
    );

    it(
      "returns a safe CONFLICT response without leaking lifecycle details",
      async () => {
        vi.mocked(
          createChangeRequestForCurrentTenant,
        ).mockRejectedValue(
          new ApplicationError(
            "CONFLICT",
            "Secret active request detail.",
          ),
        );

        const result =
          await createChangeRequestAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            validClientFormData(),
          );

        expect(result).toEqual({
          status: "error",
          message:
            "The request conflicts with the current state.",
          issues: [],
          changeRequest:
            null,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret active request detail.",
        );
      },
    );
  },
);
