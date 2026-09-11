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
  "@/change-control/composition/create-change-proposal-version",
  () => ({
    createChangeProposalVersionForCurrentTenant:
      vi.fn(),
  }),
);

import {
  createChangeProposalVersionForCurrentTenant,
} from "@/change-control/composition/create-change-proposal-version";
import {
  createChangeProposalVersionAction,
} from "@/change-control/presentation/actions/create-change-proposal-version-action";
import type {
  CreateChangeProposalVersionActionState,
} from "@/change-control/presentation/create-change-proposal-version-action-state";

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

const CLIENT_ID =
  "11111111-1111-4111-8111-111111111111";

const ORDER_ID =
  "22222222-2222-4222-8222-222222222222";

const BASELINE_ID =
  "33333333-3333-4333-8333-333333333333";

const PROPOSAL_ID =
  "44444444-4444-4444-8444-444444444444";

const MEMBERSHIP_ID =
  "55555555-5555-4555-8555-555555555555";

const MEASUREMENT_ID =
  "66666666-6666-4666-8666-666666666666";

const STYLE_ONE_ID =
  "77777777-7777-4777-8777-777777777777";

const STYLE_TWO_ID =
  "88888888-8888-4888-8888-888888888888";

const INITIAL_STATE:
  CreateChangeProposalVersionActionState = {
    status: "idle",
    message: null,
    issues: [],
    proposal: null,
  };

function validFormData():
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
    "changeRequestId",
    CHANGE_REQUEST_B_ID,
  );

  formData.set(
    "measurementVersionId",
    MEASUREMENT_ID,
  );

  formData.set(
    "designSummary",
    "  Fitted gown with long sleeves.  ",
  );

  formData.set(
    "fabricDescription",
    "  Client supplied Ankara.  ",
  );

  formData.set(
    "quantity",
    "1",
  );

  formData.set(
    "priceAmount",
    "90000.0000",
  );

  formData.set(
    "currency",
    "ngn",
  );

  formData.set(
    "deliveryDate",
    "2026-10-23",
  );

  formData.set(
    "note",
    "  Includes sleeve adjustment.  ",
  );

  formData.append(
    "styleReferenceId",
    STYLE_ONE_ID,
  );

  formData.append(
    "styleReferenceId",
    STYLE_TWO_ID,
  );

  formData.set(
    "rationale",
    "  Client requested sleeves after approval.  ",
  );

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "createChangeProposalVersionAction",
  () => {
    it(
      "uses bound lifecycle identifiers and validated complete proposal terms",
      async () => {
        vi.mocked(
          createChangeProposalVersionForCurrentTenant,
        ).mockResolvedValue({
          id:
            PROPOSAL_ID,
          businessId:
            BUSINESS_A_ID,
          changeRequestId:
            CHANGE_REQUEST_A_ID,
          clientId:
            CLIENT_ID,
          orderId:
            ORDER_ID,
          garmentId:
            GARMENT_A_ID,
          baselineAgreementVersionId:
            BASELINE_ID,
          revisionNumber:
            1,
          supersedesChangeProposalVersionId:
            null,
          createdByMembershipId:
            MEMBERSHIP_ID,
          measurementVersionId:
            MEASUREMENT_ID,
          designSummary:
            "Fitted gown with long sleeves.",
          fabricDescription:
            "Client supplied Ankara.",
          quantity:
            1,
          priceAmount:
            "90000",
          currency:
            "NGN",
          deliveryDate:
            "2026-10-23",
          note:
            "Includes sleeve adjustment.",
          styleReferenceIds: [
            STYLE_ONE_ID,
            STYLE_TWO_ID,
          ],
          rationale:
            "Client requested sleeves after approval.",
          createdAt:
            new Date(),
        });

        const result =
          await createChangeProposalVersionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            INITIAL_STATE,
            validFormData(),
          );

        expect(
          createChangeProposalVersionForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            changeRequestId:
              CHANGE_REQUEST_A_ID,
            measurementVersionId:
              MEASUREMENT_ID,
            designSummary:
              "Fitted gown with long sleeves.",
            fabricDescription:
              "Client supplied Ankara.",
            quantity:
              1,
            priceAmount:
              "90000.0000",
            currency:
              "NGN",
            deliveryDate:
              "2026-10-23",
            note:
              "Includes sleeve adjustment.",
            styleReferenceIds: [
              STYLE_ONE_ID,
              STYLE_TWO_ID,
            ],
            rationale:
              "Client requested sleeves after approval.",
          },
        );

        expect(result).toEqual({
          status: "success",
          message:
            "Change proposal created successfully.",
          issues: [],
          proposal: {
            id:
              PROPOSAL_ID,
            changeRequestId:
              CHANGE_REQUEST_A_ID,
            revisionNumber:
              1,
            designSummary:
              "Fitted gown with long sleeves.",
            priceAmount:
              "90000",
            currency:
              "NGN",
            deliveryDate:
              "2026-10-23",
          },
        });
      },
    );

    it(
      "does not accept protected lifecycle fields from FormData",
      async () => {
        vi.mocked(
          createChangeProposalVersionForCurrentTenant,
        ).mockResolvedValue({
          id:
            PROPOSAL_ID,
          businessId:
            BUSINESS_A_ID,
          changeRequestId:
            CHANGE_REQUEST_A_ID,
          clientId:
            CLIENT_ID,
          orderId:
            ORDER_ID,
          garmentId:
            GARMENT_A_ID,
          baselineAgreementVersionId:
            BASELINE_ID,
          revisionNumber:
            1,
          supersedesChangeProposalVersionId:
            null,
          createdByMembershipId:
            MEMBERSHIP_ID,
          measurementVersionId:
            MEASUREMENT_ID,
          designSummary:
            "Fitted gown with long sleeves.",
          fabricDescription:
            "Client supplied Ankara.",
          quantity:
            1,
          priceAmount:
            "90000",
          currency:
            "NGN",
          deliveryDate:
            "2026-10-23",
          note:
            "Includes sleeve adjustment.",
          styleReferenceIds: [
            STYLE_ONE_ID,
            STYLE_TWO_ID,
          ],
          rationale:
            "Client requested sleeves after approval.",
          createdAt:
            new Date(),
        });

        const formData =
          validFormData();

        formData.set(
          "baselineAgreementVersionId",
          "99999999-9999-4999-8999-999999999999",
        );

        formData.set(
          "revisionNumber",
          "999",
        );

        formData.set(
          "supersedesChangeProposalVersionId",
          "99999999-9999-4999-8999-999999999999",
        );

        formData.set(
          "createdByMembershipId",
          "99999999-9999-4999-8999-999999999999",
        );

        await createChangeProposalVersionAction(
          BUSINESS_A_ID,
          GARMENT_A_ID,
          CHANGE_REQUEST_A_ID,
          INITIAL_STATE,
          formData,
        );

        expect(
          createChangeProposalVersionForCurrentTenant,
        ).toHaveBeenCalledTimes(
          1,
        );

        const [
          ,
          request,
        ] = vi.mocked(
          createChangeProposalVersionForCurrentTenant,
        ).mock.calls[0];

        expect(request)
          .not.toHaveProperty(
            "baselineAgreementVersionId",
          );

        expect(request)
          .not.toHaveProperty(
            "revisionNumber",
          );

        expect(request)
          .not.toHaveProperty(
            "supersedesChangeProposalVersionId",
          );

        expect(request)
          .not.toHaveProperty(
            "createdByMembershipId",
          );
      },
    );

    it(
      "rejects duplicate style references before mutation",
      async () => {
        const formData =
          validFormData();

        formData.delete(
          "styleReferenceId",
        );

        formData.append(
          "styleReferenceId",
          STYLE_ONE_ID,
        );

        formData.append(
          "styleReferenceId",
          STYLE_ONE_ID,
        );

        const result =
          await createChangeProposalVersionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createChangeProposalVersionForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "styleReferenceIds",
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects an invalid proposal amount before mutation",
      async () => {
        const formData =
          validFormData();

        formData.set(
          "priceAmount",
          "0",
        );

        const result =
          await createChangeProposalVersionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createChangeProposalVersionForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "priceAmount",
          ),
        ).toBe(true);
      },
    );

    it(
      "returns a safe CONFLICT response without leaking lifecycle details",
      async () => {
        vi.mocked(
          createChangeProposalVersionForCurrentTenant,
        ).mockRejectedValue(
          new ApplicationError(
            "CONFLICT",
            "Secret proposal revision detail.",
          ),
        );

        const result =
          await createChangeProposalVersionAction(
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
          proposal:
            null,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret proposal revision detail.",
        );
      },
    );
  },
);
