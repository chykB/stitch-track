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
  "@/agreement/composition/record-agreement-resolution",
  () => ({
    recordAgreementResolutionForCurrentTenant:
      vi.fn(),
  }),
);

import {
  recordAgreementResolutionForCurrentTenant,
} from "@/agreement/composition/record-agreement-resolution";
import {
  recordAgreementResolutionAction,
} from "@/agreement/presentation/actions/record-agreement-resolution-action";
import type {
  RecordAgreementResolutionActionState,
} from "@/agreement/presentation/record-agreement-resolution-action-state";

const BUSINESS_A_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const BUSINESS_B_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const GARMENT_A_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const GARMENT_B_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const AGREEMENT_A_ID =
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const AGREEMENT_B_ID =
  "ffffffff-ffff-4fff-8fff-ffffffffffff";

const RESOLUTION_ID =
  "11111111-1111-4111-8111-111111111111";

const MEMBERSHIP_ID =
  "22222222-2222-4222-8222-222222222222";

const INITIAL_STATE:
  RecordAgreementResolutionActionState = {
    status: "idle",
    message: null,
    issues: [],
    resolution: null,
  };

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "recordAgreementResolutionAction",
  () => {
    it(
      "uses bound identifiers and validated client-decision evidence",
      async () => {
        const occurredAt =
          new Date(
            "2026-09-08T18:00:00.000Z",
          );

        vi.mocked(
          recordAgreementResolutionForCurrentTenant,
        ).mockResolvedValue({
          id:
            RESOLUTION_ID,
          businessId:
            BUSINESS_A_ID,
          agreementVersionId:
            AGREEMENT_A_ID,
          outcome:
            "APPROVED",
          occurredAt,
          clientNameSnapshot:
            "Ada Okafor",
          clientDecisionChannel:
            "WHATSAPP",
          evidenceNote:
            "Client approved.",
          recordedByMembershipId:
            MEMBERSHIP_ID,
          createdAt:
            new Date(),
        });

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
          "agreementVersionId",
          AGREEMENT_B_ID,
        );

        formData.set(
          "outcome",
          "APPROVED",
        );

        formData.set(
          "occurredAt",
          occurredAt.toISOString(),
        );

        formData.set(
          "clientDecisionChannel",
          "WHATSAPP",
        );

        formData.set(
          "evidenceNote",
          "  Client approved.  ",
        );

        const result =
          await recordAgreementResolutionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            AGREEMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          recordAgreementResolutionForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            agreementVersionId:
              AGREEMENT_A_ID,
            outcome:
              "APPROVED",
            occurredAt,
            clientDecisionChannel:
              "WHATSAPP",
            evidenceNote:
              "Client approved.",
          },
        );

        expect(
          result.resolution,
        ).toEqual({
          id:
            RESOLUTION_ID,
          agreementVersionId:
            AGREEMENT_A_ID,
          outcome:
            "APPROVED",
          occurredAt:
            occurredAt.toISOString(),
        });
      },
    );

    it(
      "requires a decision channel for approval before mutation",
      async () => {
        const formData =
          new FormData();

        formData.set(
          "outcome",
          "APPROVED",
        );

        formData.set(
          "occurredAt",
          new Date().toISOString(),
        );

        formData.set(
          "clientDecisionChannel",
          "",
        );

        formData.set(
          "evidenceNote",
          "Client approved.",
        );

        const result =
          await recordAgreementResolutionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            AGREEMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          recordAgreementResolutionForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(
          result.status,
        ).toBe("error");

        expect(
          result.issues.some(
            (issue) =>
              issue.path ===
              "clientDecisionChannel",
          ),
        ).toBe(true);
      },
    );

    it(
      "accepts withdrawal only without client decision evidence",
      async () => {
        const occurredAt =
          new Date(
            "2026-09-08T18:00:00.000Z",
          );

        vi.mocked(
          recordAgreementResolutionForCurrentTenant,
        ).mockResolvedValue({
          id:
            RESOLUTION_ID,
          businessId:
            BUSINESS_A_ID,
          agreementVersionId:
            AGREEMENT_A_ID,
          outcome:
            "WITHDRAWN",
          occurredAt,
          clientNameSnapshot:
            null,
          clientDecisionChannel:
            null,
          evidenceNote:
            "Business withdrew draft.",
          recordedByMembershipId:
            MEMBERSHIP_ID,
          createdAt:
            new Date(),
        });

        const formData =
          new FormData();

        formData.set(
          "outcome",
          "WITHDRAWN",
        );

        formData.set(
          "occurredAt",
          occurredAt.toISOString(),
        );

        formData.set(
          "clientDecisionChannel",
          "",
        );

        formData.set(
          "evidenceNote",
          "Business withdrew draft.",
        );

        const result =
          await recordAgreementResolutionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            AGREEMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          recordAgreementResolutionForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            agreementVersionId:
              AGREEMENT_A_ID,
            outcome:
              "WITHDRAWN",
            occurredAt,
            clientDecisionChannel:
              null,
            evidenceNote:
              "Business withdrew draft.",
          },
        );

        expect(
          result.status,
        ).toBe("success");
      },
    );

    it(
      "returns a safe CONFLICT response for an already-resolved agreement",
      async () => {
        vi.mocked(
          recordAgreementResolutionForCurrentTenant,
        ).mockRejectedValue(
          new ApplicationError(
            "CONFLICT",
            "Secret resolution detail.",
          ),
        );

        const formData =
          new FormData();

        formData.set(
          "outcome",
          "REJECTED",
        );

        formData.set(
          "occurredAt",
          new Date().toISOString(),
        );

        formData.set(
          "clientDecisionChannel",
          "PHONE",
        );

        formData.set(
          "evidenceNote",
          "Client rejected.",
        );

        const result =
          await recordAgreementResolutionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            AGREEMENT_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(result).toEqual({
          status: "error",
          message:
            "The request conflicts with the current state.",
          issues: [],
          resolution: null,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret resolution detail.",
        );
      },
    );
  },
);
