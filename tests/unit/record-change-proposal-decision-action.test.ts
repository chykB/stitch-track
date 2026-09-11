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
  "@/change-control/composition/record-change-proposal-approval",
  () => ({
    recordChangeProposalApprovalForCurrentTenant:
      vi.fn(),
  }),
);

vi.mock(
  "@/change-control/composition/record-change-proposal-rejection",
  () => ({
    recordChangeProposalRejectionForCurrentTenant:
      vi.fn(),
  }),
);

import {
  recordChangeProposalApprovalForCurrentTenant,
} from "@/change-control/composition/record-change-proposal-approval";
import {
  recordChangeProposalRejectionForCurrentTenant,
} from "@/change-control/composition/record-change-proposal-rejection";
import {
  recordChangeProposalDecisionAction,
} from "@/change-control/presentation/actions/record-change-proposal-decision-action";
import type {
  RecordChangeProposalDecisionActionState,
} from "@/change-control/presentation/record-change-proposal-decision-action-state";

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

const PROPOSAL_A_ID =
  "11111111-1111-4111-8111-111111111111";

const PROPOSAL_B_ID =
  "22222222-2222-4222-8222-222222222222";

const DECISION_ID =
  "33333333-3333-4333-8333-333333333333";

const CLIENT_ID =
  "44444444-4444-4444-8444-444444444444";

const ORDER_ID =
  "55555555-5555-4555-8555-555555555555";

const BASELINE_ID =
  "66666666-6666-4666-8666-666666666666";

const APPLIED_AGREEMENT_ID =
  "77777777-7777-4777-8777-777777777777";

const AGREEMENT_RESOLUTION_ID =
  "88888888-8888-4888-8888-888888888888";

const MEMBERSHIP_ID =
  "99999999-9999-4999-8999-999999999999";

const OCCURRED_AT =
  new Date(
    "2026-09-10T19:00:00.000Z",
  );

const INITIAL_STATE:
  RecordChangeProposalDecisionActionState = {
    status: "idle",
    message: null,
    issues: [],
    decision: null,
  };

function validFormData(
  outcome:
    "APPROVED" |
    "REJECTED",
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
    "changeProposalVersionId",
    PROPOSAL_B_ID,
  );

  formData.set(
    "outcome",
    outcome,
  );

  formData.set(
    "occurredAt",
    OCCURRED_AT.toISOString(),
  );

  formData.set(
    "clientDecisionChannel",
    "WHATSAPP",
  );

  formData.set(
    "evidenceNote",
    "  Client confirmed the decision.  ",
  );

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe(
  "recordChangeProposalDecisionAction",
  () => {
    it(
      "dispatches APPROVED only to the atomic approval path using bound identifiers",
      async () => {
        vi.mocked(
          recordChangeProposalApprovalForCurrentTenant,
        ).mockResolvedValue({
          decision: {
            id:
              DECISION_ID,
            businessId:
              BUSINESS_A_ID,
            changeProposalVersionId:
              PROPOSAL_A_ID,
            outcome:
              "APPROVED",
            occurredAt:
              OCCURRED_AT,
            clientNameSnapshot:
              "Ada Okafor",
            decisionSource:
              "BUSINESS_RECORDED",
            clientDecisionChannel:
              "WHATSAPP",
            evidenceNote:
              "Client confirmed the decision.",
            recordedByMembershipId:
              MEMBERSHIP_ID,
            portalGrantId:
              null,
            createdAt:
              new Date(),
          },
          agreementVersion: {
            id:
              APPLIED_AGREEMENT_ID,
            businessId:
              BUSINESS_A_ID,
            clientId:
              CLIENT_ID,
            orderId:
              ORDER_ID,
            garmentId:
              GARMENT_A_ID,
            revisionNumber:
              2,
            supersedesAgreementVersionId:
              BASELINE_ID,
            measurementVersionId:
              null,
            designSummary:
              "Approved amended gown",
            fabricDescription:
              null,
            quantity:
              1,
            priceAmount:
              "90000",
            currency:
              "NGN",
            deliveryDate:
              "2026-10-23",
            note:
              null,
            styleReferenceIds: [],
            createdAt:
              new Date(),
          },
          agreementResolution: {
            id:
              AGREEMENT_RESOLUTION_ID,
            businessId:
              BUSINESS_A_ID,
            agreementVersionId:
              APPLIED_AGREEMENT_ID,
            outcome:
              "APPROVED",
            occurredAt:
              new Date(
                "2026-09-10T19:00:01.000Z",
              ),
            clientNameSnapshot:
              "Ada Okafor",
            clientDecisionChannel:
              "WHATSAPP",
            evidenceNote:
              "Client confirmed the decision.",
            recordedByMembershipId:
              MEMBERSHIP_ID,
            createdAt:
              new Date(),
          },
        });

        const result =
          await recordChangeProposalDecisionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            PROPOSAL_A_ID,
            INITIAL_STATE,
            validFormData(
              "APPROVED",
            ),
          );

        expect(
          recordChangeProposalApprovalForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            changeRequestId:
              CHANGE_REQUEST_A_ID,
            changeProposalVersionId:
              PROPOSAL_A_ID,
            occurredAt:
              OCCURRED_AT,
            clientDecisionChannel:
              "WHATSAPP",
            evidenceNote:
              "Client confirmed the decision.",
          },
        );

        expect(
          recordChangeProposalRejectionForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(result).toEqual({
          status: "success",
          message:
            "Change proposal approved and applied successfully.",
          issues: [],
          decision: {
            id:
              DECISION_ID,
            changeProposalVersionId:
              PROPOSAL_A_ID,
            outcome:
              "APPROVED",
            occurredAt:
              OCCURRED_AT.toISOString(),
            appliedAgreementVersionId:
              APPLIED_AGREEMENT_ID,
          },
        });
      },
    );

    it(
      "dispatches REJECTED only to the rejection path",
      async () => {
        vi.mocked(
          recordChangeProposalRejectionForCurrentTenant,
        ).mockResolvedValue({
          id:
            DECISION_ID,
          businessId:
            BUSINESS_A_ID,
          changeProposalVersionId:
            PROPOSAL_A_ID,
          outcome:
            "REJECTED",
          occurredAt:
            OCCURRED_AT,
          clientNameSnapshot:
            "Ada Okafor",
          decisionSource:
            "BUSINESS_RECORDED",
          clientDecisionChannel:
            "PHONE",
          evidenceNote:
            "Client rejected the proposal.",
          recordedByMembershipId:
            MEMBERSHIP_ID,
          portalGrantId:
            null,
          createdAt:
            new Date(),
        });

        const formData =
          validFormData(
            "REJECTED",
          );

        formData.set(
          "clientDecisionChannel",
          "PHONE",
        );

        formData.set(
          "evidenceNote",
          "  Client rejected the proposal.  ",
        );

        const result =
          await recordChangeProposalDecisionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            PROPOSAL_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          recordChangeProposalRejectionForCurrentTenant,
        ).toHaveBeenCalledWith(
          BUSINESS_A_ID,
          {
            garmentId:
              GARMENT_A_ID,
            changeRequestId:
              CHANGE_REQUEST_A_ID,
            changeProposalVersionId:
              PROPOSAL_A_ID,
            occurredAt:
              OCCURRED_AT,
            clientDecisionChannel:
              "PHONE",
            evidenceNote:
              "Client rejected the proposal.",
          },
        );

        expect(
          recordChangeProposalApprovalForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(
          result.decision,
        ).toEqual({
          id:
            DECISION_ID,
          changeProposalVersionId:
            PROPOSAL_A_ID,
          outcome:
            "REJECTED",
          occurredAt:
            OCCURRED_AT.toISOString(),
          appliedAgreementVersionId:
            null,
        });
      },
    );

    it(
      "rejects PORTAL as a staff decision channel before mutation",
      async () => {
        const formData =
          validFormData(
            "APPROVED",
          );

        formData.set(
          "clientDecisionChannel",
          "PORTAL",
        );

        const result =
          await recordChangeProposalDecisionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            PROPOSAL_A_ID,
            INITIAL_STATE,
            formData,
          );

        expect(
          recordChangeProposalApprovalForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(
          recordChangeProposalRejectionForCurrentTenant,
        ).not.toHaveBeenCalled();

        expect(result.status)
          .toBe("error");

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
      "ignores protected provenance fields supplied through FormData",
      async () => {
        vi.mocked(
          recordChangeProposalRejectionForCurrentTenant,
        ).mockResolvedValue({
          id:
            DECISION_ID,
          businessId:
            BUSINESS_A_ID,
          changeProposalVersionId:
            PROPOSAL_A_ID,
          outcome:
            "REJECTED",
          occurredAt:
            OCCURRED_AT,
          clientNameSnapshot:
            "Ada Okafor",
          decisionSource:
            "BUSINESS_RECORDED",
          clientDecisionChannel:
            "WHATSAPP",
          evidenceNote:
            "Client confirmed the decision.",
          recordedByMembershipId:
            MEMBERSHIP_ID,
          portalGrantId:
            null,
          createdAt:
            new Date(),
        });

        const formData =
          validFormData(
            "REJECTED",
          );

        formData.set(
          "decisionSource",
          "CLIENT_PORTAL",
        );

        formData.set(
          "portalGrantId",
          "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        );

        formData.set(
          "recordedByMembershipId",
          "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        );

        formData.set(
          "clientNameSnapshot",
          "Forged Client",
        );

        await recordChangeProposalDecisionAction(
          BUSINESS_A_ID,
          GARMENT_A_ID,
          CHANGE_REQUEST_A_ID,
          PROPOSAL_A_ID,
          INITIAL_STATE,
          formData,
        );

        const [
          ,
          request,
        ] = vi.mocked(
          recordChangeProposalRejectionForCurrentTenant,
        ).mock.calls[0];

        expect(request)
          .not.toHaveProperty(
            "decisionSource",
          );

        expect(request)
          .not.toHaveProperty(
            "portalGrantId",
          );

        expect(request)
          .not.toHaveProperty(
            "recordedByMembershipId",
          );

        expect(request)
          .not.toHaveProperty(
            "clientNameSnapshot",
          );
      },
    );

    it(
      "returns a safe CONFLICT response without leaking lifecycle details",
      async () => {
        vi.mocked(
          recordChangeProposalApprovalForCurrentTenant,
        ).mockRejectedValue(
          new ApplicationError(
            "CONFLICT",
            "Secret approval transaction detail.",
          ),
        );

        const result =
          await recordChangeProposalDecisionAction(
            BUSINESS_A_ID,
            GARMENT_A_ID,
            CHANGE_REQUEST_A_ID,
            PROPOSAL_A_ID,
            INITIAL_STATE,
            validFormData(
              "APPROVED",
            ),
          );

        expect(result).toEqual({
          status: "error",
          message:
            "The request conflicts with the current state.",
          issues: [],
          decision:
            null,
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          "Secret approval transaction detail.",
        );
      },
    );
  },
);
