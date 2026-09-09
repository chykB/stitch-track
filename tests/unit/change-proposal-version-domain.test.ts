import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateNextChangeProposalRevision,
  normalizeChangeProposalVersionDetails,
  type ChangeProposalVersion,
} from "../../src/change-control/domain/change-proposal-version";

function proposal(
  revisionNumber = 1,
): ChangeProposalVersion {
  return {
    id:
      `proposal-${revisionNumber}`,
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
    revisionNumber,
    supersedesChangeProposalVersionId:
      revisionNumber === 1
        ? null
        : `proposal-${revisionNumber - 1}`,
    measurementVersionId:
      "measurement-2",
    designSummary:
      "Fitted gown with long sleeves",
    fabricDescription:
      "Client supplied fabric",
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
    styleReferenceIds: [
      "style-1",
    ],
    rationale:
      "Sleeve change affects price and delivery.",
    createdByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T12:00:00.000Z",
      ),
  };
}

describe(
  "change proposal version domain",
  () => {
    it(
      "normalizes complete proposed agreement terms and rationale",
      () => {
        expect(
          normalizeChangeProposalVersionDetails({
            measurementVersionId:
              " measurement-2 ",
            designSummary:
              "  Fitted gown   with long sleeves ",
            fabricDescription:
              " Client supplied fabric ",
            quantity:
              1,
            priceAmount:
              "00090000.5000",
            currency:
              "ngn",
            baselineCurrency:
              "NGN",
            deliveryDate:
              "2026-10-20",
            note:
              " Revised sleeve detail ",
            styleReferenceIds: [
              " style-1 ",
              "style-2",
            ],
            rationale:
              "  Sleeve change affects   price and delivery. ",
          }),
        ).toEqual({
          measurementVersionId:
            "measurement-2",
          designSummary:
            "Fitted gown with long sleeves",
          fabricDescription:
            "Client supplied fabric",
          quantity:
            1,
          priceAmount:
            "90000.5",
          currency:
            "NGN",
          deliveryDate:
            "2026-10-20",
          note:
            "Revised sleeve detail",
          styleReferenceIds: [
            "style-1",
            "style-2",
          ],
          rationale:
            "Sleeve change affects price and delivery.",
        });
      },
    );

    it(
      "requires proposal currency to match the approved baseline",
      () => {
        expect(() =>
          normalizeChangeProposalVersionDetails({
            designSummary:
              "Long sleeve gown",
            quantity:
              1,
            priceAmount:
              "90000",
            currency:
              "USD",
            baselineCurrency:
              "NGN",
            deliveryDate:
              "2026-10-20",
            styleReferenceIds: [],
            rationale:
              "Requested sleeve change",
          }),
        ).toThrow(
          "currency must match the approved baseline",
        );
      },
    );

    it(
      "requires a rationale",
      () => {
        expect(() =>
          normalizeChangeProposalVersionDetails({
            designSummary:
              "Long sleeve gown",
            quantity:
              1,
            priceAmount:
              "90000",
            currency:
              "NGN",
            baselineCurrency:
              "NGN",
            deliveryDate:
              "2026-10-20",
            styleReferenceIds: [],
            rationale:
              "   ",
          }),
        ).toThrow(
          "Change proposal rationale is required",
        );
      },
    );

    it(
      "inherits agreement money precision validation",
      () => {
        expect(() =>
          normalizeChangeProposalVersionDetails({
            designSummary:
              "Long sleeve gown",
            quantity:
              1,
            priceAmount:
              "90000.00001",
            currency:
              "NGN",
            baselineCurrency:
              "NGN",
            deliveryDate:
              "2026-10-20",
            styleReferenceIds: [],
            rationale:
              "Requested sleeve change",
          }),
        ).toThrow();
      },
    );

    it(
      "starts proposal revision numbering at one",
      () => {
        expect(
          calculateNextChangeProposalRevision(
            null,
            null,
          ),
        ).toEqual({
          revisionNumber:
            1,
          supersedesChangeProposalVersionId:
            null,
        });
      },
    );

    it(
      "creates the next revision only after rejection",
      () => {
        expect(
          calculateNextChangeProposalRevision(
            proposal(2),
            "REJECTED",
          ),
        ).toEqual({
          revisionNumber:
            3,
          supersedesChangeProposalVersionId:
            "proposal-2",
        });
      },
    );

    it(
      "rejects another proposal while the latest proposal is pending",
      () => {
        expect(() =>
          calculateNextChangeProposalRevision(
            proposal(1),
            null,
          ),
        ).toThrow(
          "still awaiting a client decision",
        );
      },
    );

    it(
      "rejects superseding an approved proposal",
      () => {
        expect(() =>
          calculateNextChangeProposalRevision(
            proposal(1),
            "APPROVED",
          ),
        ).toThrow(
          "approved change proposal cannot be superseded",
        );
      },
    );
  },
);
