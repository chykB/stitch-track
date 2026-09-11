import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AgreementVersion,
} from "../../src/agreement/domain/agreement-version";

import type {
  ChangeProposalDecision,
} from "../../src/change-control/domain/change-proposal-decision";
import type {
  ChangeProposalVersion,
} from "../../src/change-control/domain/change-proposal-version";
import {
  assertChangeRequestActive,
  deriveChangeRequestState,
  normalizeChangeRequestClosureDetails,
  type ChangeRequestClosure,
} from "../../src/change-control/domain/change-request-lifecycle";

const REQUEST_CREATED_AT =
  new Date(
    "2026-09-09T10:00:00.000Z",
  );

const CLOSURE_TIME =
  new Date(
    "2026-09-09T13:00:00.000Z",
  );

const NOW =
  new Date(
    "2026-09-09T14:00:00.000Z",
  );

function proposal():
  ChangeProposalVersion {
  return {
    id:
      "proposal-1",
    businessId:
      "business-1",
    changeRequestId:
      "change-request-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    baselineAgreementVersionId:
      "agreement-1",
    revisionNumber:
      1,
    supersedesChangeProposalVersionId:
      null,
    measurementVersionId:
      null,
    designSummary:
      "Long sleeve gown",
    fabricDescription:
      null,
    quantity:
      1,
    priceAmount:
      "90000",
    currency:
      "NGN",
    deliveryDate:
      "2026-10-20",
    note:
      null,
    styleReferenceIds: [],
    rationale:
      "Client requested sleeves.",
    createdByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T11:00:00.000Z",
      ),
  };
}

function appliedAgreement():
  AgreementVersion {
  return {
    id:
      "agreement-2",
    businessId:
      "business-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    revisionNumber:
      2,
    measurementVersionId:
      null,
    designSummary:
      "Long sleeve gown",
    fabricDescription:
      null,
    quantity:
      1,
    priceAmount:
      "90000",
    currency:
      "NGN",
    deliveryDate:
      "2026-10-20",
    note:
      null,
    styleReferenceIds: [],
    supersedesAgreementVersionId:
      "agreement-1",
    createdAt:
      new Date(
        "2026-09-09T12:30:00.000Z",
      ),
  };
}

function decision(
  outcome:
    "APPROVED" |
    "REJECTED",
  proposalId =
    "proposal-1",
): ChangeProposalDecision {
  return {
    id:
      "decision-1",
    businessId:
      "business-1",
    changeProposalVersionId:
      proposalId,
    outcome,
    occurredAt:
      new Date(
        "2026-09-09T12:00:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    decisionSource:
      "BUSINESS_RECORDED",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote:
      "Client decision recorded.",
    recordedByMembershipId:
      "membership-1",
    portalGrantId:
      null,
    createdAt:
      new Date(
        "2026-09-09T12:01:00.000Z",
      ),
  };
}

function closure(
  outcome:
    "WITHDRAWN" |
    "IMPOSSIBLE",
): ChangeRequestClosure {
  return {
    id:
      "closure-1",
    businessId:
      "business-1",
    changeRequestId:
      "change-request-1",
    outcome,
    reason:
      "Cannot proceed.",
    occurredAt:
      CLOSURE_TIME,
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T13:01:00.000Z",
      ),
  };
}

describe(
  "change request lifecycle domain",
  () => {
    it(
      "normalizes an immutable withdrawal closure",
      () => {
        expect(
          normalizeChangeRequestClosureDetails({
            outcome:
              "WITHDRAWN",
            reason:
              "  Client   cancelled request ",
            occurredAt:
              CLOSURE_TIME,
            requestCreatedAt:
              REQUEST_CREATED_AT,
            now:
              NOW,
          }),
        ).toEqual({
          outcome:
            "WITHDRAWN",
          reason:
            "Client cancelled request",
          occurredAt:
            CLOSURE_TIME,
        });
      },
    );

    it(
      "normalizes an impossible closure",
      () => {
        expect(
          normalizeChangeRequestClosureDetails({
            outcome:
              "IMPOSSIBLE",
            reason:
              "Fabric cannot support alteration.",
            occurredAt:
              CLOSURE_TIME,
            requestCreatedAt:
              REQUEST_CREATED_AT,
            now:
              NOW,
          }).outcome,
        ).toBe(
          "IMPOSSIBLE",
        );
      },
    );

    it(
      "rejects unsupported closure outcomes",
      () => {
        expect(() =>
          normalizeChangeRequestClosureDetails({
            outcome:
              "APPROVED",
            reason:
              "Invalid.",
            occurredAt:
              CLOSURE_TIME,
            requestCreatedAt:
              REQUEST_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "closure outcome is invalid",
        );
      },
    );

    it(
      "requires a closure reason",
      () => {
        expect(() =>
          normalizeChangeRequestClosureDetails({
            outcome:
              "WITHDRAWN",
            reason:
              "   ",
            occurredAt:
              CLOSURE_TIME,
            requestCreatedAt:
              REQUEST_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "closure reason is required",
        );
      },
    );

    it(
      "rejects closure before request creation",
      () => {
        expect(() =>
          normalizeChangeRequestClosureDetails({
            outcome:
              "WITHDRAWN",
            reason:
              "Cancelled.",
            occurredAt:
              new Date(
                "2026-09-09T09:59:59.999Z",
              ),
            requestCreatedAt:
              REQUEST_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "cannot be before the change request was created",
        );
      },
    );

    it(
      "rejects closure in the future",
      () => {
        expect(() =>
          normalizeChangeRequestClosureDetails({
            outcome:
              "IMPOSSIBLE",
            reason:
              "Cannot fulfil.",
            occurredAt:
              new Date(
                "2026-09-09T14:00:00.001Z",
              ),
            requestCreatedAt:
              REQUEST_CREATED_AT,
            now:
              NOW,
          }),
        ).toThrow(
          "cannot be in the future",
        );
      },
    );

    it(
      "derives OPEN for a new request",
      () => {
        expect(
          deriveChangeRequestState(
            null,
            null,
            null,
          ),
        ).toBe(
          "OPEN",
        );
      },
    );

    it(
      "derives AWAITING_CLIENT for a pending proposal",
      () => {
        expect(
          deriveChangeRequestState(
            proposal(),
            null,
            null,
          ),
        ).toBe(
          "AWAITING_CLIENT",
        );
      },
    );

    it(
      "returns OPEN after the latest proposal is rejected",
      () => {
        expect(
          deriveChangeRequestState(
            proposal(),
            decision(
              "REJECTED",
            ),
            null,
          ),
        ).toBe(
          "OPEN",
        );
      },
    );

    it(
      "derives APPLIED after approval",
      () => {
        expect(
          deriveChangeRequestState(
            proposal(),
            decision(
              "APPROVED",
            ),
            null,
            appliedAgreement(),
          ),
        ).toBe(
          "APPLIED",
        );
      },
    );

    it(
      "rejects an applied agreement whose terms differ from the approved proposal",
      () => {
        expect(() =>
          deriveChangeRequestState(
            proposal(),
            decision(
              "APPROVED",
            ),
            null,
            {
              ...appliedAgreement(),
              priceAmount:
                "91000",
            },
          ),
        ).toThrow(
          "does not match the approved change proposal",
        );
      },
    );

    it(
      "accepts the same exact style-reference set regardless of storage order",
      () => {
        const approvedProposal = {
          ...proposal(),
          styleReferenceIds: [
            "style-2",
            "style-1",
          ],
        };

        const appliedAgreementVersion = {
          ...appliedAgreement(),
          styleReferenceIds: [
            "style-1",
            "style-2",
          ],
        };

        expect(
          deriveChangeRequestState(
            approvedProposal,
            {
              ...decision(
                "APPROVED",
              ),
              changeProposalVersionId:
                approvedProposal.id,
            },
            null,
            appliedAgreementVersion,
          ),
        ).toBe(
          "APPLIED",
        );
      },
    );

    it(
      "rejects an approved decision without an applied agreement version",
      () => {
        expect(() =>
          deriveChangeRequestState(
            proposal(),
            decision(
              "APPROVED",
            ),
            null,
            null,
          ),
        ).toThrow(
          "approved change proposal requires an applied agreement version",
        );
      },
    );

    it(
      "rejects an applied agreement version after proposal rejection",
      () => {
        expect(() =>
          deriveChangeRequestState(
            proposal(),
            decision(
              "REJECTED",
            ),
            null,
            appliedAgreement(),
          ),
        ).toThrow(
          "rejected change proposal cannot have an applied agreement version",
        );
      },
    );

    it.each([
      "WITHDRAWN",
      "IMPOSSIBLE",
    ] as const)(
      "derives %s from closure evidence",
      (outcome) => {
        expect(
          deriveChangeRequestState(
            proposal(),
            decision(
              "REJECTED",
            ),
            closure(
              outcome,
            ),
          ),
        ).toBe(
          outcome,
        );
      },
    );

    it(
      "rejects contradictory approval and closure evidence",
      () => {
        expect(() =>
          deriveChangeRequestState(
            proposal(),
            decision(
              "APPROVED",
            ),
            closure(
              "WITHDRAWN",
            ),
          ),
        ).toThrow(
          "cannot also be closed",
        );
      },
    );

    it(
      "rejects a decision without a proposal",
      () => {
        expect(() =>
          deriveChangeRequestState(
            null,
            decision(
              "REJECTED",
            ),
            null,
          ),
        ).toThrow(
          "decision requires a proposal",
        );
      },
    );

    it(
      "rejects a decision for a different proposal",
      () => {
        expect(() =>
          deriveChangeRequestState(
            proposal(),
            decision(
              "REJECTED",
              "proposal-other",
            ),
            null,
          ),
        ).toThrow(
          "does not belong to the latest proposal",
        );
      },
    );

    it.each([
      "APPLIED",
      "WITHDRAWN",
      "IMPOSSIBLE",
    ] as const)(
      "rejects mutations when request state is %s",
      (state) => {
        expect(() =>
          assertChangeRequestActive(
            state,
          ),
        ).toThrow(
          "change request is already terminal",
        );
      },
    );

    it.each([
      "OPEN",
      "AWAITING_CLIENT",
    ] as const)(
      "allows active state %s",
      (state) => {
        expect(() =>
          assertChangeRequestActive(
            state,
          ),
        ).not.toThrow();
      },
    );
  },
);
