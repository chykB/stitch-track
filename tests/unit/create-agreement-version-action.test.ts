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
  "@/agreement/composition/create-agreement-version",
  () => ({
    createAgreementVersionForCurrentTenant:
      vi.fn(),
  }),
);

import {
  createAgreementVersionForCurrentTenant,
} from "@/agreement/composition/create-agreement-version";
import {
  createAgreementVersionAction,
} from "@/agreement/presentation/actions/create-agreement-version-action";
import type {
  CreateAgreementVersionActionState,
} from "@/agreement/presentation/create-agreement-version-action-state";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const GARMENT_A_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const GARMENT_B_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const AGREEMENT_ID =
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const CLIENT_ID =
  "11111111-1111-4111-8111-111111111111";

const ORDER_ID =
  "22222222-2222-4222-8222-222222222222";

const MEASUREMENT_ID =
  "33333333-3333-4333-8333-333333333333";

const STYLE_ONE_ID =
  "44444444-4444-4444-8444-444444444444";

const STYLE_TWO_ID =
  "55555555-5555-4555-8555-555555555555";

const INITIAL_STATE:
  CreateAgreementVersionActionState = {
    status: "idle",
    message: null,
    issues: [],
    agreementVersion: null,
  };

function validFormData():
  FormData {
  const formData =
    new FormData();

  formData.set(
    "measurementVersionId",
    MEASUREMENT_ID,
  );

  formData.set(
    "designSummary",
    "  Fitted evening gown  ",
  );

  formData.set(
    "fabricDescription",
    "  Client Ankara  ",
  );

  formData.set(
    "quantity",
    "2",
  );

  formData.set(
    "priceAmount",
    "80000.5000",
  );

  formData.set(
    "currency",
    "ngn",
  );

  formData.set(
    "deliveryDate",
    "2026-10-15",
  );

  formData.set(
    "note",
    "  Client requested lining  ",
  );

  formData.append(
    "styleReferenceId",
    STYLE_ONE_ID,
  );

  formData.append(
    "styleReferenceId",
    STYLE_TWO_ID,
  );

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "createAgreementVersionAction",
  () => {
    it(
      "uses bound Business and Garment identifiers and validated agreement input",
      async () => {
        vi.mocked(
          createAgreementVersionForCurrentTenant,
        ).mockResolvedValue({
          id:
            AGREEMENT_ID,
          businessId:
            BUSINESS_A_ID,
          clientId:
            CLIENT_ID,
          orderId:
            ORDER_ID,
          garmentId:
            GARMENT_A_ID,
          revisionNumber:
            1,
          measurementVersionId:
            MEASUREMENT_ID,
          styleReferenceIds: [
            STYLE_ONE_ID,
            STYLE_TWO_ID,
          ],
          designSummary:
            "Fitted evening gown",
          fabricDescription:
            "Client Ankara",
          quantity:
            2,
          priceAmount:
            "80000.5",
          currency:
            "NGN",
          deliveryDate:
            "2026-10-15",
          note:
            "Client requested lining",
          supersedesAgreementVersionId:
            null,
          createdAt:
            new Date(),
        });

        const formData =
          validFormData();

        formData.set(
          "businessId",
          BUSINESS_B_ID,
        );

        formData.set(
          "garmentId",
          GARMENT_B_ID,
        );

        formData.set(
          "revisionNumber",
          "999",
        );

        formData.set(
          "clientId",
          CLIENT_ID,
        );

        formData.set(
          "orderId",
          ORDER_ID,
        );

        const result =
          await createAgreementVersionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createAgreementVersionForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            measurementVersionId:
              MEASUREMENT_ID,
            designSummary:
              "Fitted evening gown",
            fabricDescription:
              "Client Ankara",
            quantity:
              2,
            priceAmount:
              "80000.5000",
            currency:
              "NGN",
            deliveryDate:
              "2026-10-15",
            note:
              "Client requested lining",
            styleReferenceIds: [
              STYLE_ONE_ID,
              STYLE_TWO_ID,
            ],
          },
        );

        expect(
          result.status,
        ).toBe("success");

        expect(
          result.agreementVersion
            ?.revisionNumber,
        ).toBe(1);
      },
    );

    it(
      "rejects invalid commercial input before mutation",
      async () => {
        const formData =
          validFormData();

        formData.set(
          "quantity",
          "0",
        );

        formData.set(
          "priceAmount",
          "80000.12345",
        );

        formData.set(
          "deliveryDate",
          "2026-02-31",
        );

        const result =
          await createAgreementVersionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createAgreementVersionForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(
          result.status,
        ).toBe("error");

        expect(
          result.message,
        ).toBe(
          "The submitted input is invalid.",
        );

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "quantity",
          ),
        ).toBe(true);

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "priceAmount",
          ),
        ).toBe(true);

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "deliveryDate",
          ),
        ).toBe(true);
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
          await createAgreementVersionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createAgreementVersionForCurrentTenant,
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
      "returns a safe CONFLICT response without leaking lifecycle details",
      async () => {
        vi.mocked(
          createAgreementVersionForCurrentTenant,
        ).mockRejectedValue(
          new ApplicationError(
            "CONFLICT",
            "Secret pending revision detail.",
          ),
        );

        const result =
          await createAgreementVersionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            validFormData(),
          );

        expect(result).toEqual({
          status: "error",
          message:
            "The request conflicts with the current state.",
          issues: [],
          agreementVersion:
            null,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret pending revision detail.",
        );
      },
    );
  },
);
