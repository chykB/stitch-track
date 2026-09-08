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
  "@/style-reference/composition/create-style-reference",
  () => ({
    createStyleReferenceForCurrentTenant:
      vi.fn(),
  }),
);

import {
  createStyleReferenceForCurrentTenant,
} from "@/style-reference/composition/create-style-reference";
import {
  createStyleReferenceAction,
} from "@/style-reference/presentation/actions/create-style-reference-action";
import type {
  CreateStyleReferenceActionState,
} from "@/style-reference/presentation/create-style-reference-action-state";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const GARMENT_A_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const GARMENT_B_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const STYLE_REFERENCE_ID =
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const INITIAL_STATE:
  CreateStyleReferenceActionState = {
    status: "idle",
    message: null,
    issues: [],
    styleReference: null,
  };

function validFormData(): FormData {
  const formData =
    new FormData();

  formData.set(
    "sourceUrl",
    "  https://example.com/styles/front.jpg  ",
  );

  formData.set(
    "label",
    "  Front view  ",
  );

  formData.set(
    "note",
    "  Use neckline  ",
  );

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "createStyleReferenceAction",
  () => {
    it(
      "uses bound Business and Garment identifiers instead of forged form values",
      async () => {
        vi.mocked(
          createStyleReferenceForCurrentTenant,
        ).mockResolvedValue({
          id:
            STYLE_REFERENCE_ID,
          businessId:
            BUSINESS_A_ID,
          garmentId:
            GARMENT_A_ID,
          sourceUrl:
            "https://example.com/styles/front.jpg",
          label:
            "Front view",
          note:
            "Use neckline",
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

        const result =
          await createStyleReferenceAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createStyleReferenceForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            sourceUrl:
              "https://example.com/styles/front.jpg",
            label:
              "Front view",
            note:
              "Use neckline",
          },
        );

        expect(result).toEqual({
          status:
            "success",
          message:
            "Style reference added successfully.",
          issues: [],
          styleReference: {
            id:
              STYLE_REFERENCE_ID,
            garmentId:
              GARMENT_A_ID,
            sourceUrl:
              "https://example.com/styles/front.jpg",
            label:
              "Front view",
          },
        });
      },
    );

    it(
      "rejects a non-web URL before mutation",
      async () => {
        const formData =
          validFormData();

        formData.set(
          "sourceUrl",
          "ftp://example.com/style.jpg",
        );

        const result =
          await createStyleReferenceAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createStyleReferenceForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(result.status)
          .toBe("error");

        expect(result.message)
          .toBe(
            "The submitted input is invalid.",
          );

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "sourceUrl",
          ),
        ).toBe(true);
      },
    );

    it(
      "returns a safe NOT_FOUND response for an unavailable Garment",
      async () => {
        vi.mocked(
          createStyleReferenceForCurrentTenant,
        ).mockRejectedValue(
          new ApplicationError(
            "NOT_FOUND",
            "Secret foreign Garment detail.",
          ),
        );

        const result =
          await createStyleReferenceAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            INITIAL_STATE,
            validFormData(),
          );

        expect(result).toEqual({
          status:
            "error",
          message:
            "The requested resource was not found.",
          issues: [],
          styleReference:
            null,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret foreign Garment detail.",
        );
      },
    );
  },
);
