import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AgreementResolutionRepository,
} from "../../src/agreement/application/ports/agreement-resolution-repository";
import type {
  AgreementVersionRepository,
} from "../../src/agreement/application/ports/agreement-version-repository";
import type {
  AgreementResolution,
} from "../../src/agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../src/agreement/domain/agreement-version";
import type {
  ChangeControlHistoryRepository,
} from "../../src/change-control/application/ports/change-control-history-repository";
import {
  getChangeControlHistoryForTenant,
} from "../../src/change-control/application/use-cases/get-change-control-history";
import type {
  ChangeProposalDecision,
} from "../../src/change-control/domain/change-proposal-decision";
import type {
  ChangeProposalVersion,
} from "../../src/change-control/domain/change-proposal-version";
import type {
  ChangeRequest,
} from "../../src/change-control/domain/change-request";
import type {
  ChangeRequestClosure,
} from "../../src/change-control/domain/change-request-lifecycle";
import type {
  GarmentRepository,
} from "../../src/garment/application/ports/garment-repository";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const TENANT:
  TenantContext = {
    userId:
      "user-1",
    businessId:
      "business-1",
    membershipId:
      "membership-1",
    role:
      "OWNER",
  };

const GARMENT = {
  id:
    "garment-1",
  businessId:
    "business-1",
  orderId:
    "order-1",
  name:
    "Emerald Gown",
  createdAt:
    new Date(
      "2026-09-01T10:00:00.000Z",
    ),
};

function agreement(
  revisionNumber: number,
): AgreementVersion {
  if (
    revisionNumber === 1
  ) {
    return {
      id:
        "agreement-1",
      businessId:
        "business-1",
      clientId:
        "client-1",
      orderId:
        "order-1",
      garmentId:
        "garment-1",
      revisionNumber:
        1,
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
          "2026-09-09T10:00:00.000Z",
        ),
    };
  }

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
        "2026-09-09T15:00:00.000Z",
      ),
  };
}

function resolution(
  versionId: string,
): AgreementResolution {
  return {
    id:
      `resolution-${versionId}`,
    businessId:
      "business-1",
    agreementVersionId:
      versionId,
    outcome:
      "APPROVED",
    occurredAt:
      new Date(
        versionId ===
          "agreement-1"
          ? "2026-09-09T11:00:00.000Z"
          : "2026-09-09T15:01:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote:
      "Approved.",
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        versionId ===
          "agreement-1"
          ? "2026-09-09T11:01:00.000Z"
          : "2026-09-09T15:02:00.000Z",
      ),
  };
}

function changeRequest(
  id =
    "change-request-1",
): ChangeRequest {
  return {
    id,
    businessId:
      "business-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    baselineAgreementVersionId:
      "agreement-1",
    requestedBy:
      "CLIENT",
    origin:
      "BUSINESS_RECORDED",
    requestChannel:
      "WHATSAPP",
    description:
      "Add sleeves",
    requestedAt:
      new Date(
        "2026-09-09T12:00:00.000Z",
      ),
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T12:01:00.000Z",
      ),
  };
}

function proposal(
  revisionNumber: number,
  requestId =
    "change-request-1",
): ChangeProposalVersion {
  return {
    id:
      `proposal-${revisionNumber}`,
    businessId:
      "business-1",
    changeRequestId:
      requestId,
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
      null,
    designSummary:
      revisionNumber === 1
        ? "Short sleeve gown"
        : "Long sleeve gown",
    fabricDescription:
      null,
    quantity:
      1,
    priceAmount:
      revisionNumber === 1
        ? "85000"
        : "90000",
    currency:
      "NGN",
    deliveryDate:
      revisionNumber === 1
        ? "2026-10-18"
        : "2026-10-20",
    note:
      null,
    styleReferenceIds: [],
    rationale:
      "Requested design change.",
    createdByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        revisionNumber === 1
          ? "2026-09-09T13:00:00.000Z"
          : "2026-09-09T14:00:00.000Z",
      ),
  };
}

function decision(
  proposalId: string,
  outcome:
    "APPROVED" |
    "REJECTED",
): ChangeProposalDecision {
  return {
    id:
      `decision-${proposalId}`,
    businessId:
      "business-1",
    changeProposalVersionId:
      proposalId,
    outcome,
    occurredAt:
      new Date(
        outcome === "REJECTED"
          ? "2026-09-09T13:30:00.000Z"
          : "2026-09-09T14:30:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    decisionSource:
      "BUSINESS_RECORDED",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote:
      "Client decision.",
    recordedByMembershipId:
      "membership-1",
    portalGrantId:
      null,
    createdAt:
      new Date(
        outcome === "REJECTED"
          ? "2026-09-09T13:31:00.000Z"
          : "2026-09-09T14:31:00.000Z",
      ),
  };
}

function dependencies(
  options: {
    garment?:
      typeof GARMENT | null;
    requests?:
      readonly ChangeRequest[];
    proposals?:
      readonly ChangeProposalVersion[];
    decisions?:
      Readonly<
        Record<
          string,
          ChangeProposalDecision | null
        >
      >;
    closure?:
      ChangeRequestClosure | null;
    versions?:
      readonly AgreementVersion[];
  } = {},
) {
  const {
    garment =
      GARMENT,
    requests = [
      changeRequest(),
    ],
    proposals = [
      proposal(2),
      proposal(1),
    ],
    decisions = {
      "proposal-1":
        decision(
          "proposal-1",
          "REJECTED",
        ),
      "proposal-2":
        decision(
          "proposal-2",
          "APPROVED",
        ),
    },
    closure =
      null,
    versions = [
      agreement(2),
      agreement(1),
    ],
  } = options;

  const garmentRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          garment,
        ),
  } as unknown as
    GarmentRepository;

  const agreementVersionRepository = {
    findById:
      vi.fn(),
    listForGarment:
      vi.fn()
        .mockResolvedValue(
          versions,
        ),
  } as unknown as
    AgreementVersionRepository;

  const agreementResolutionRepository = {
    findForVersion:
      vi.fn(
        async ({
          agreementVersionId,
        }) =>
          resolution(
            agreementVersionId,
          ),
      ),
  } as unknown as
    AgreementResolutionRepository;

  const historyRepository = {
    listRequestsForGarment:
      vi.fn()
        .mockResolvedValue(
          requests,
        ),

    listProposalsForRequest:
      vi.fn()
        .mockResolvedValue(
          proposals,
        ),

    findDecisionForProposal:
      vi.fn(
        async ({
          changeProposalVersionId,
        }) =>
          decisions[
            changeProposalVersionId
          ] ?? null,
      ),

    findClosureForRequest:
      vi.fn()
        .mockResolvedValue(
          closure,
        ),
  } as unknown as
    ChangeControlHistoryRepository;

  return {
    garmentRepository,
    agreementVersionRepository,
    agreementResolutionRepository,
    historyRepository,
  };
}

describe(
  "getChangeControlHistoryForTenant",
  () => {
    it(
      "returns ordered proposal history and proves the applied amended agreement",
      async () => {
        const deps =
          dependencies();

        const result =
          await getChangeControlHistoryForTenant(
            deps.garmentRepository,
            deps.agreementVersionRepository,
            deps.agreementResolutionRepository,
            deps.historyRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          );

        expect(
          result
            .currentApprovedBaseline
            ?.version.id,
        ).toBe(
          "agreement-2",
        );

        expect(
          result.requests,
        ).toHaveLength(
          1,
        );

        expect(
          result.requests[0]
            .proposals.map(
              (entry) =>
                entry.proposal
                  .revisionNumber,
            ),
        ).toEqual([
          1,
          2,
        ]);

        expect(
          result.requests[0]
            .state,
        ).toBe(
          "APPLIED",
        );

        expect(
          result.requests[0]
            .baseline
            .version.id,
        ).toBe(
          "agreement-1",
        );

        expect(
          result.requests[0]
            .appliedAgreement
            ?.version.id,
        ).toBe(
          "agreement-2",
        );
      },
    );

    it(
      "does not attribute a later amended agreement to a rejected historical request",
      async () => {
        const rejectedProposal =
          proposal(1);

        const deps =
          dependencies({
            proposals: [
              rejectedProposal,
            ],
            decisions: {
              "proposal-1":
                decision(
                  "proposal-1",
                  "REJECTED",
                ),
            },
          });

        const result =
          await getChangeControlHistoryForTenant(
            deps.garmentRepository,
            deps.agreementVersionRepository,
            deps.agreementResolutionRepository,
            deps.historyRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          );

        expect(
          result.requests[0]
            .state,
        ).toBe(
          "OPEN",
        );

        expect(
          result.requests[0]
            .appliedAgreement,
        ).toBeNull();
      },
    );

    it(
      "returns AWAITING_CLIENT for a pending latest proposal",
      async () => {
        const deps =
          dependencies({
            proposals: [
              proposal(1),
            ],
            decisions: {},
            versions: [
              agreement(1),
            ],
          });

        const result =
          await getChangeControlHistoryForTenant(
            deps.garmentRepository,
            deps.agreementVersionRepository,
            deps.agreementResolutionRepository,
            deps.historyRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          );

        expect(
          result.requests[0]
            .state,
        ).toBe(
          "AWAITING_CLIENT",
        );
      },
    );

    it(
      "returns the current approved baseline with empty change history",
      async () => {
        const deps =
          dependencies({
            requests: [],
            proposals: [],
            decisions: {},
            versions: [
              agreement(1),
            ],
          });

        const result =
          await getChangeControlHistoryForTenant(
            deps.garmentRepository,
            deps.agreementVersionRepository,
            deps.agreementResolutionRepository,
            deps.historyRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          );

        expect(
          result.requests,
        ).toEqual([]);

        expect(
          result
            .currentApprovedBaseline
            ?.version.id,
        ).toBe(
          "agreement-1",
        );

        expect(
          deps.historyRepository
            .listProposalsForRequest,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns NOT_FOUND before reading history for an inaccessible garment",
      async () => {
        const deps =
          dependencies({
            garment:
              null,
          });

        await expect(
          getChangeControlHistoryForTenant(
            deps.garmentRepository,
            deps.agreementVersionRepository,
            deps.agreementResolutionRepository,
            deps.historyRepository,
            TENANT,
            {
              garmentId:
                "garment-foreign",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.agreementVersionRepository
            .listForGarment,
        ).not.toHaveBeenCalled();

        expect(
          deps.historyRepository
            .listRequestsForGarment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects foreign history returned by a repository",
      async () => {
        const deps =
          dependencies({
            requests: [
              {
                ...changeRequest(),
                businessId:
                  "business-other",
              },
            ],
          });

        await expect(
          getChangeControlHistoryForTenant(
            deps.garmentRepository,
            deps.agreementVersionRepository,
            deps.agreementResolutionRepository,
            deps.historyRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });
      },
    );

    it(
      "rejects a later proposal when the preceding proposal was still pending",
      async () => {
        const deps =
          dependencies({
            decisions: {
              "proposal-1":
                null,
              "proposal-2":
                null,
            },
            versions: [
              agreement(1),
            ],
          });

        await expect(
          getChangeControlHistoryForTenant(
            deps.garmentRepository,
            deps.agreementVersionRepository,
            deps.agreementResolutionRepository,
            deps.historyRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });
      },
    );

    it(
      "rejects a later proposal when the preceding proposal was approved",
      async () => {
        const deps =
          dependencies({
            decisions: {
              "proposal-1":
                decision(
                  "proposal-1",
                  "APPROVED",
                ),
              "proposal-2":
                null,
            },
            versions: [
              agreement(1),
            ],
          });

        await expect(
          getChangeControlHistoryForTenant(
            deps.garmentRepository,
            deps.agreementVersionRepository,
            deps.agreementResolutionRepository,
            deps.historyRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });
      },
    );

    it(
      "rejects an approved decision without its exact amended agreement",
      async () => {
        const approvedProposal =
          proposal(2);

        const deps =
          dependencies({
            proposals: [
              proposal(1),
              approvedProposal,
            ],
            versions: [
              agreement(1),
              {
                ...agreement(2),
                priceAmount:
                  "91000",
              },
            ],
          });

        await expect(
          getChangeControlHistoryForTenant(
            deps.garmentRepository,
            deps.agreementVersionRepository,
            deps.agreementResolutionRepository,
            deps.historyRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });
      },
    );
  },
);
