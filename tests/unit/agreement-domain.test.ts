import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateNextAgreementRevision,
  normalizeAgreementDeliveryDate,
  normalizeAgreementPriceAmount,
  normalizeAgreementVersionDetails,
  type AgreementVersion,
} from "../../src/agreement/domain/agreement-version";
import {
  normalizeAgreementResolutionDetails,
} from "../../src/agreement/domain/agreement-resolution";

function agreementVersion(
  revisionNumber = 1,
): AgreementVersion {
  return {
    id:
      `agreement-${revisionNumber}`,
    businessId:
      "business-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    revisionNumber,
    measurementVersionId:
      null,
    designSummary:
      "Fitted gown",
    fabricDescription:
      null,
    quantity:
      1,
    priceAmount:
      "80000",
    currency:
      "NGN",
    deliveryDate:
      "2026-10-15",
    note:
      null,
    styleReferenceIds: [],
    supersedesAgreementVersionId:
      null,
    createdAt:
      new Date(
        "2026-09-08T10:00:00.000Z",
      ),
  };
}

describe(
  "agreement version domain",
  () => {
    it(
      "normalizes agreement details without floating-point money",
      () => {
        expect(
          normalizeAgreementVersionDetails({
            designSummary:
              "  Fitted   evening gown ",
            fabricDescription:
              "  Client fabric ",
            quantity:
              2,
            priceAmount:
              "00080000.5000",
            currency:
              "ngn",
            deliveryDate:
              "2026-10-15",
            note:
              "  Include lining ",
            measurementVersionId:
              " measurement-1 ",
            styleReferenceIds: [
              " reference-1 ",
              "reference-2",
            ],
          }),
        ).toEqual({
          designSummary:
            "Fitted evening gown",
          fabricDescription:
            "Client fabric",
          quantity:
            2,
          priceAmount:
            "80000.5",
          currency:
            "NGN",
          deliveryDate:
            "2026-10-15",
          note:
            "Include lining",
          measurementVersionId:
            "measurement-1",
          styleReferenceIds: [
            "reference-1",
            "reference-2",
          ],
        });
      },
    );

    it.each([
      "0",
      "0.0000",
      "-1",
      "1.00001",
      "1000000000000000",
      "not-money",
    ])(
      "rejects unsupported agreement price %s",
      (value) => {
        expect(() =>
          normalizeAgreementPriceAmount(
            value,
          ),
        ).toThrow();
      },
    );

    it(
      "accepts the maximum supported agreement price",
      () => {
        expect(
          normalizeAgreementPriceAmount(
            "999999999999999.9999",
          ),
        ).toBe(
          "999999999999999.9999",
        );
      },
    );

    it.each([
      "2026-02-31",
      "2026-13-01",
      "08-09-2026",
      "",
    ])(
      "rejects invalid calendar delivery date %s",
      (value) => {
        expect(() =>
          normalizeAgreementDeliveryDate(
            value,
          ),
        ).toThrow();
      },
    );

    it(
      "rejects duplicate style references",
      () => {
        expect(() =>
          normalizeAgreementVersionDetails({
            designSummary:
              "Gown",
            quantity:
              1,
            priceAmount:
              "80000",
            currency:
              "NGN",
            deliveryDate:
              "2026-10-15",
            styleReferenceIds: [
              "reference-1",
              " reference-1 ",
            ],
          }),
        ).toThrow(
          "Style references must be unique",
        );
      },
    );

    it(
      "starts the first agreement at revision one",
      () => {
        expect(
          calculateNextAgreementRevision(
            null,
            null,
          ),
        ).toEqual({
          revisionNumber:
            1,
          supersedesAgreementVersionId:
            null,
        });
      },
    );

    it.each([
      "REJECTED",
      "WITHDRAWN",
    ] as const)(
      "allows a new revision after %s",
      (outcome) => {
        expect(
          calculateNextAgreementRevision(
            agreementVersion(2),
            outcome,
          ),
        ).toEqual({
          revisionNumber:
            3,
          supersedesAgreementVersionId:
            "agreement-2",
        });
      },
    );

    it(
      "rejects a new revision while latest agreement is pending",
      () => {
        expect(() =>
          calculateNextAgreementRevision(
            agreementVersion(),
            null,
          ),
        ).toThrow(
          "must be resolved",
        );
      },
    );

    it(
      "rejects a new ordinary revision after approval",
      () => {
        expect(() =>
          calculateNextAgreementRevision(
            agreementVersion(),
            "APPROVED",
          ),
        ).toThrow(
          "approved agreement cannot be superseded",
        );
      },
    );
  },
);

describe(
  "agreement resolution domain",
  () => {
    const agreementCreatedAt =
      new Date(
        "2026-09-08T10:00:00.000Z",
      );

    const now =
      new Date(
        "2026-09-08T12:00:00.000Z",
      );

    it(
      "reserves PORTAL for the controlled portal workflow",
      () => {
        expect(() =>
          normalizeAgreementResolutionDetails({
            outcome:
              "APPROVED",
            occurredAt:
              new Date(
                "2026-09-08T11:00:00.000Z",
              ),
            clientNameSnapshot:
              "Ada Okafor",
            clientDecisionChannel:
              "PORTAL",
            evidenceNote:
              "Portal approval.",
            agreementCreatedAt,
            now,
          }),
        ).toThrow(
          "Client decision channel is invalid.",
        );
      },
    );

    it.each([
      "APPROVED",
      "REJECTED",
    ] as const)(
      "normalizes %s client evidence",
      (outcome) => {
        const result =
          normalizeAgreementResolutionDetails({
            outcome,
            occurredAt:
              new Date(
                "2026-09-08T11:00:00.000Z",
              ),
            clientNameSnapshot:
              "  Ada   Okafor ",
            clientDecisionChannel:
              "WHATSAPP",
            evidenceNote:
              " Confirmed by message. ",
            agreementCreatedAt,
            now,
          });

        expect(result)
          .toMatchObject({
            outcome,
            clientNameSnapshot:
              "Ada Okafor",
            clientDecisionChannel:
              "WHATSAPP",
            evidenceNote:
              "Confirmed by message.",
          });
      },
    );

    it(
      "allows Business withdrawal without client evidence",
      () => {
        expect(
          normalizeAgreementResolutionDetails({
            outcome:
              "WITHDRAWN",
            occurredAt:
              new Date(
                "2026-09-08T11:00:00.000Z",
              ),
            evidenceNote:
              "Wrong delivery date.",
            agreementCreatedAt,
            now,
          }),
        ).toMatchObject({
          outcome:
            "WITHDRAWN",
          clientNameSnapshot:
            null,
          clientDecisionChannel:
            null,
        });
      },
    );

    it(
      "rejects client decision without client name",
      () => {
        expect(() =>
          normalizeAgreementResolutionDetails({
            outcome:
              "APPROVED",
            occurredAt:
              new Date(
                "2026-09-08T11:00:00.000Z",
              ),
            clientDecisionChannel:
              "WHATSAPP",
            evidenceNote:
              "Confirmed.",
            agreementCreatedAt,
            now,
          }),
        ).toThrow(
          "Client name snapshot is required",
        );
      },
    );

    it(
      "rejects client decision without communication channel",
      () => {
        expect(() =>
          normalizeAgreementResolutionDetails({
            outcome:
              "REJECTED",
            occurredAt:
              new Date(
                "2026-09-08T11:00:00.000Z",
              ),
            clientNameSnapshot:
              "Ada Okafor",
            evidenceNote:
              "Declined.",
            agreementCreatedAt,
            now,
          }),
        ).toThrow(
          "Client decision channel is required",
        );
      },
    );

    it(
      "rejects client evidence on Business withdrawal",
      () => {
        expect(() =>
          normalizeAgreementResolutionDetails({
            outcome:
              "WITHDRAWN",
            occurredAt:
              new Date(
                "2026-09-08T11:00:00.000Z",
              ),
            clientNameSnapshot:
              "Ada Okafor",
            evidenceNote:
              "Wrong price.",
            agreementCreatedAt,
            now,
          }),
        ).toThrow(
          "cannot contain client decision evidence",
        );
      },
    );

    it(
      "rejects an empty evidence note",
      () => {
        expect(() =>
          normalizeAgreementResolutionDetails({
            outcome:
              "WITHDRAWN",
            occurredAt:
              new Date(
                "2026-09-08T11:00:00.000Z",
              ),
            evidenceNote:
              "   ",
            agreementCreatedAt,
            now,
          }),
        ).toThrow(
          "evidence note is required",
        );
      },
    );

    it(
      "rejects resolution before agreement creation",
      () => {
        expect(() =>
          normalizeAgreementResolutionDetails({
            outcome:
              "WITHDRAWN",
            occurredAt:
              new Date(
                "2026-09-08T09:59:59.000Z",
              ),
            evidenceNote:
              "Incorrect proposal.",
            agreementCreatedAt,
            now,
          }),
        ).toThrow(
          "cannot occur before",
        );
      },
    );

    it(
      "rejects resolution in the future",
      () => {
        expect(() =>
          normalizeAgreementResolutionDetails({
            outcome:
              "WITHDRAWN",
            occurredAt:
              new Date(
                "2026-09-08T12:00:01.000Z",
              ),
            evidenceNote:
              "Incorrect proposal.",
            agreementCreatedAt,
            now,
          }),
        ).toThrow(
          "cannot occur in the future",
        );
      },
    );
  },
);
