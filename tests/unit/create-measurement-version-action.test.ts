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
  "@/measurement/composition/create-measurement-version",
  () => ({
    createMeasurementVersionForCurrentTenant:
      vi.fn(),
  }),
);

import {
  createMeasurementVersionForCurrentTenant,
} from "@/measurement/composition/create-measurement-version";
import {
  createMeasurementVersionAction,
} from "@/measurement/presentation/actions/create-measurement-version-action";
import type {
  CreateMeasurementVersionActionState,
} from "@/measurement/presentation/create-measurement-version-action-state";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const CLIENT_A_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const CLIENT_B_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const VERSION_ID =
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const ENTRY_ID =
  "ffffffff-ffff-4fff-8fff-ffffffffffff";

const MEASURED_AT =
  new Date(
    "2026-09-08T00:00:00.000Z",
  );

const INITIAL_STATE:
  CreateMeasurementVersionActionState = {
    status: "idle",
    message: null,
    issues: [],
    measurementVersion: null,
  };

function validFormData(): FormData {
  const formData =
    new FormData();

  formData.set(
    "measuredAt",
    "2026-09-08",
  );

  formData.set(
    "unit",
    "CENTIMETER",
  );

  formData.set(
    "note",
    "  Before cutting  ",
  );

  formData.append(
    "measurementLabel",
    " Waist ",
  );

  formData.append(
    "measurementValue",
    "080.500",
  );

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "createMeasurementVersionAction",
  () => {
    it(
      "uses bound Business and Client identifiers instead of forged form values",
      async () => {
        vi.mocked(
          createMeasurementVersionForCurrentTenant,
        ).mockResolvedValue({
          id: VERSION_ID,
          businessId:
            BUSINESS_A_ID,
          clientId:
            CLIENT_A_ID,
          measuredAt:
            MEASURED_AT,
          unit:
            "CENTIMETER",
          note:
            "Before cutting",
          entries: [
            {
              id:
                ENTRY_ID,
              businessId:
                BUSINESS_A_ID,
              measurementVersionId:
                VERSION_ID,
              label:
                "Waist",
              normalizedKey:
                "waist",
              value:
                "80.5",
              createdAt:
                new Date(),
            },
          ],
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
          "clientId",
          CLIENT_B_ID,
        );

        const result =
          await createMeasurementVersionAction(
            BUSINESS_A_ID,
            CLIENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createMeasurementVersionForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            clientId:
              CLIENT_A_ID,
            measuredAt:
              MEASURED_AT,
            unit:
              "CENTIMETER",
            note:
              "Before cutting",
            entries: [
              {
                label:
                  "Waist",
                value:
                  "080.500",
              },
            ],
          },
        );

        expect(result).toEqual({
          status:
            "success",
          message:
            "Measurements recorded successfully.",
          issues: [],
          measurementVersion: {
            id:
              VERSION_ID,
            clientId:
              CLIENT_A_ID,
            measuredAt:
              MEASURED_AT
                .toISOString(),
            unit:
              "CENTIMETER",
            entryCount: 1,
          },
        });
      },
    );

    it(
      "rejects duplicate normalized measurement names before mutation",
      async () => {
        const formData =
          validFormData();

        formData.append(
          "measurementLabel",
          " waist ",
        );

        formData.append(
          "measurementValue",
          "81",
        );

        const result =
          await createMeasurementVersionAction(
            BUSINESS_A_ID,
            CLIENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createMeasurementVersionForCurrentTenant,
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
              issue.message ===
              "Measurement names must be unique.",
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects an impossible calendar date before mutation",
      async () => {
        const formData =
          validFormData();

        formData.set(
          "measuredAt",
          "2026-02-31",
        );

        const result =
          await createMeasurementVersionAction(
            BUSINESS_A_ID,
            CLIENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createMeasurementVersionForCurrentTenant,
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
              "measuredAt",
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects measurement precision beyond the persistence boundary",
      async () => {
        const formData =
          validFormData();

        formData.set(
          "measurementValue",
          "123456789012345678901234567890123456",
        );

        const result =
          await createMeasurementVersionAction(
            BUSINESS_A_ID,
            CLIENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          createMeasurementVersionForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(result.status)
          .toBe("error");

        expect(
          result.issues.some(
            (issue) =>
              issue.message ===
              "Measurement value exceeds supported precision.",
          ),
        ).toBe(true);
      },
    );

    it(
      "returns a safe NOT_FOUND response for an unavailable Client",
      async () => {
        vi.mocked(
          createMeasurementVersionForCurrentTenant,
        ).mockRejectedValue(
          new ApplicationError(
            "NOT_FOUND",
            "Secret foreign Client detail.",
          ),
        );

        const result =
          await createMeasurementVersionAction(
            BUSINESS_A_ID,
            CLIENT_A_ID,
            INITIAL_STATE,
            validFormData(),
          );

        expect(result).toEqual({
          status:
            "error",
          message:
            "The requested resource was not found.",
          issues: [],
          measurementVersion:
            null,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret foreign Client detail.",
        );
      },
    );
  },
);
