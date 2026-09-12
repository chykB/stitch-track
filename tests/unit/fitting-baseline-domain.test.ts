import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AgreementResolution,
} from "../../src/agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../src/agreement/domain/agreement-version";
import {
  findHistoricalApprovedFittingBaseline,
  type AgreementHistoryEntry,
} from "../../src/fitting/domain/fitting-baseline";

function version(
  revisionNumber: number,
  createdAt: string,
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
      revisionNumber === 1
        ? null
        : `agreement-${revisionNumber - 1}`,
    createdAt:
      new Date(createdAt),
  };
}

function resolution(
  agreementVersionId: string,
  outcome:
    "APPROVED" |
    "REJECTED" |
    "WITHDRAWN",
  occurredAt: string,
): AgreementResolution {
  return {
    id:
      `resolution-${agreementVersionId}`,
    businessId:
      "business-1",
    agreementVersionId,
    outcome,
    occurredAt:
      new Date(occurredAt),
    clientNameSnapshot:
      outcome === "WITHDRAWN"
        ? null
        : "Ada Okafor",
    clientDecisionChannel:
      outcome === "WITHDRAWN"
        ? null
        : "WHATSAPP",
    evidenceNote:
      "Recorded.",
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(occurredAt),
  };
}

describe(
  "historical fitting baseline",
  () => {
    const occurredAt =
      new Date(
        "2026-09-12T10:00:00.000Z",
      );

    it(
      "selects the highest revision approved by the fitting time",
      () => {
        const history:
          readonly AgreementHistoryEntry[] = [
            {
              version:
                version(
                  1,
                  "2026-09-08T09:00:00.000Z",
                ),
              resolution:
                resolution(
                  "agreement-1",
                  "APPROVED",
                  "2026-09-08T10:00:00.000Z",
                ),
            },
            {
              version:
                version(
                  2,
                  "2026-09-10T09:00:00.000Z",
                ),
              resolution:
                resolution(
                  "agreement-2",
                  "APPROVED",
                  "2026-09-10T10:00:00.000Z",
                ),
            },
          ];

        expect(
          findHistoricalApprovedFittingBaseline(
            history,
            occurredAt,
          )?.id,
        ).toBe(
          "agreement-2",
        );
      },
    );

    it(
      "does not skip a newer unresolved revision to reuse an older approval",
      () => {
        const history:
          readonly AgreementHistoryEntry[] = [
            {
              version:
                version(
                  1,
                  "2026-09-08T09:00:00.000Z",
                ),
              resolution:
                resolution(
                  "agreement-1",
                  "APPROVED",
                  "2026-09-08T10:00:00.000Z",
                ),
            },
            {
              version:
                version(
                  2,
                  "2026-09-10T09:00:00.000Z",
                ),
              resolution: null,
            },
          ];

        expect(
          findHistoricalApprovedFittingBaseline(
            history,
            occurredAt,
          ),
        ).toBeNull();
      },
    );

    it.each([
      "REJECTED",
      "WITHDRAWN",
    ] as const)(
      "does not skip a newer %s revision",
      (outcome) => {
        const history:
          readonly AgreementHistoryEntry[] = [
            {
              version:
                version(
                  1,
                  "2026-09-08T09:00:00.000Z",
                ),
              resolution:
                resolution(
                  "agreement-1",
                  "APPROVED",
                  "2026-09-08T10:00:00.000Z",
                ),
            },
            {
              version:
                version(
                  2,
                  "2026-09-10T09:00:00.000Z",
                ),
              resolution:
                resolution(
                  "agreement-2",
                  outcome,
                  "2026-09-10T10:00:00.000Z",
                ),
            },
          ];

        expect(
          findHistoricalApprovedFittingBaseline(
            history,
            occurredAt,
          ),
        ).toBeNull();
      },
    );

    it(
      "rejects an approval that occurred after the fitting",
      () => {
        const history:
          readonly AgreementHistoryEntry[] = [
            {
              version:
                version(
                  1,
                  "2026-09-10T09:00:00.000Z",
                ),
              resolution:
                resolution(
                  "agreement-1",
                  "APPROVED",
                  "2026-09-12T11:00:00.000Z",
                ),
            },
          ];

        expect(
          findHistoricalApprovedFittingBaseline(
            history,
            occurredAt,
          ),
        ).toBeNull();
      },
    );

    it(
      "ignores agreement versions created after the fitting",
      () => {
        const history:
          readonly AgreementHistoryEntry[] = [
            {
              version:
                version(
                  1,
                  "2026-09-08T09:00:00.000Z",
                ),
              resolution:
                resolution(
                  "agreement-1",
                  "APPROVED",
                  "2026-09-08T10:00:00.000Z",
                ),
            },
            {
              version:
                version(
                  2,
                  "2026-09-12T11:00:00.000Z",
                ),
              resolution:
                resolution(
                  "agreement-2",
                  "APPROVED",
                  "2026-09-12T11:30:00.000Z",
                ),
            },
          ];

        expect(
          findHistoricalApprovedFittingBaseline(
            history,
            occurredAt,
          )?.id,
        ).toBe(
          "agreement-1",
        );
      },
    );

    it(
      "returns null when no agreement existed by the fitting time",
      () => {
        expect(
          findHistoricalApprovedFittingBaseline(
            [
              {
                version:
                  version(
                    1,
                    "2026-09-12T11:00:00.000Z",
                  ),
                resolution: null,
              },
            ],
            occurredAt,
          ),
        ).toBeNull();
      },
    );
  },
);
