import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AgreementVersion,
} from "../../src/agreement/domain/agreement-version";
import {
  calculateAppliedAgreementRevision,
} from "../../src/change-control/domain/applied-change";
import type {
  ChangeProposalVersion,
} from "../../src/change-control/domain/change-proposal-version";

const AGREEMENT:
  AgreementVersion = {
    id: "agreement-1",
    businessId: "business-1",
    clientId: "client-1",
    orderId: "order-1",
    garmentId: "garment-1",
    revisionNumber: 1,
    measurementVersionId: null,
    designSummary: "Fitted gown",
    fabricDescription: null,
    quantity: 1,
    priceAmount: "80000",
    currency: "NGN",
    deliveryDate:
      "2026-10-15",
    note: null,
    styleReferenceIds: [],
    supersedesAgreementVersionId:
      null,
    createdAt:
      new Date(
        "2026-09-09T10:00:00.000Z",
      ),
  };

const PROPOSAL:
  ChangeProposalVersion = {
    id: "proposal-1",
    businessId: "business-1",
    changeRequestId:
      "change-request-1",
    clientId: "client-1",
    orderId: "order-1",
    garmentId: "garment-1",
    baselineAgreementVersionId:
      "agreement-1",
    revisionNumber: 1,
    supersedesChangeProposalVersionId:
      null,
    measurementVersionId: null,
    designSummary:
      "Long sleeve gown",
    fabricDescription: null,
    quantity: 1,
    priceAmount: "90000",
    currency: "NGN",
    deliveryDate:
      "2026-10-20",
    note: null,
    styleReferenceIds: [],
    rationale:
      "Sleeves affect price.",
    createdByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T13:00:00.000Z",
      ),
  };

describe(
  "applied change domain",
  () => {
    it(
      "creates the next agreement revision from an approved baseline",
      () => {
        expect(
          calculateAppliedAgreementRevision(
            AGREEMENT,
            "APPROVED",
            PROPOSAL,
          ),
        ).toEqual({
          revisionNumber: 2,
          supersedesAgreementVersionId:
            "agreement-1",
        });
      },
    );

    it.each([
      null,
      "REJECTED",
      "WITHDRAWN",
    ] as const)(
      "rejects baseline resolution %s",
      (outcome) => {
        expect(() =>
          calculateAppliedAgreementRevision(
            AGREEMENT,
            outcome,
            PROPOSAL,
          ),
        ).toThrow(
          "Only an approved agreement can be amended",
        );
      },
    );

    it(
      "rejects a proposal for another baseline",
      () => {
        expect(() =>
          calculateAppliedAgreementRevision(
            AGREEMENT,
            "APPROVED",
            {
              ...PROPOSAL,
              baselineAgreementVersionId:
                "agreement-other",
            },
          ),
        ).toThrow(
          "does not belong to the current agreement baseline",
        );
      },
    );

    it(
      "rejects a mismatched ownership chain",
      () => {
        expect(() =>
          calculateAppliedAgreementRevision(
            AGREEMENT,
            "APPROVED",
            {
              ...PROPOSAL,
              garmentId:
                "garment-other",
            },
          ),
        ).toThrow(
          "does not match the current agreement ownership chain",
        );
      },
    );
  },
);
