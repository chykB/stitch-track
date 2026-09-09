import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AgreementResolution,
} from "../../src/agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../src/agreement/domain/agreement-version";
import type {
  ChangeControlLifecycleRepository,
  ChangeControlLifecycleSession,
} from "../../src/change-control/application/ports/change-control-lifecycle-repository";
import {
  recordChangeProposalApprovalForTenant,
} from "../../src/change-control/application/use-cases/record-change-proposal-approval";
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
  ClientRepository,
} from "../../src/client/application/ports/client-repository";
import type {
  GarmentRepository,
} from "../../src/garment/application/ports/garment-repository";
import type {
  OrderRepository,
} from "../../src/order/application/ports/order-repository";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const NOW =
  new Date(
    "2026-09-09T15:00:00.000Z",
  );

const TENANT: TenantContext = {
  userId: "user-1",
  businessId: "business-1",
  membershipId: "membership-1",
  role: "OWNER",
};

const CLIENT = {
  id: "client-1",
  businessId: "business-1",
  name: "Ada Okafor",
  phone: "08050000001",
  email: null,
  createdAt:
    new Date(
      "2026-09-01T10:00:00.000Z",
    ),
};

const ORDER = {
  id: "order-1",
  businessId: "business-1",
  clientId: "client-1",
  createdAt:
    new Date(
      "2026-09-01T10:01:00.000Z",
    ),
};

const GARMENT = {
  id: "garment-1",
  businessId: "business-1",
  orderId: "order-1",
  name: "Emerald Gown",
  createdAt:
    new Date(
      "2026-09-01T10:02:00.000Z",
    ),
};

const AGREEMENT:
  AgreementVersion = {
    id: "agreement-1",
    businessId: "business-1",
    clientId: "client-1",
    orderId: "order-1",
    garmentId: "garment-1",
    revisionNumber: 1,
    measurementVersionId: null,
    designSummary:
      "Fitted gown",
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

const BASELINE_RESOLUTION:
  AgreementResolution = {
    id: "resolution-1",
    businessId: "business-1",
    agreementVersionId:
      "agreement-1",
    outcome: "APPROVED",
    occurredAt:
      new Date(
        "2026-09-09T11:00:00.000Z",
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
        "2026-09-09T11:01:00.000Z",
      ),
  };

const CHANGE_REQUEST:
  ChangeRequest = {
    id: "change-request-1",
    businessId: "business-1",
    clientId: "client-1",
    orderId: "order-1",
    garmentId: "garment-1",
    baselineAgreementVersionId:
      "agreement-1",
    requestedBy: "CLIENT",
    origin: "BUSINESS_RECORDED",
    requestChannel:
      "WHATSAPP",
    description: "Add sleeves",
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
    measurementVersionId:
      "measurement-2",
    designSummary:
      "Long sleeve gown",
    fabricDescription:
      "Client supplied fabric",
    quantity: 1,
    priceAmount: "90000",
    currency: "NGN",
    deliveryDate:
      "2026-10-20",
    note:
      "Approved change",
    styleReferenceIds: [
      "style-2",
    ],
    rationale:
      "Sleeves affect price.",
    createdByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T13:00:00.000Z",
      ),
  };

function existingDecision():
  ChangeProposalDecision {
  return {
    id: "decision-existing",
    businessId: "business-1",
    changeProposalVersionId:
      "proposal-1",
    outcome: "REJECTED",
    occurredAt:
      new Date(
        "2026-09-09T14:00:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    decisionSource:
      "BUSINESS_RECORDED",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote:
      "Already rejected.",
    recordedByMembershipId:
      "membership-1",
    portalGrantId: null,
    createdAt:
      new Date(
        "2026-09-09T14:01:00.000Z",
      ),
  };
}

function closure():
  ChangeRequestClosure {
  return {
    id: "closure-1",
    businessId: "business-1",
    changeRequestId:
      "change-request-1",
    outcome: "WITHDRAWN",
    reason: "Cancelled.",
    occurredAt:
      new Date(
        "2026-09-09T14:00:00.000Z",
      ),
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T14:01:00.000Z",
      ),
  };
}

function dependencies(
  options: {
    latestAgreement?:
      AgreementVersion | null;
    activeRequest?:
      ChangeRequest | null;
    latestProposal?:
      ChangeProposalVersion | null;
    existingDecision?:
      ChangeProposalDecision | null;
    closure?:
      ChangeRequestClosure | null;
    baselineResolution?:
      AgreementResolution | null;
  } = {},
) {
  const {
    latestAgreement =
      AGREEMENT,
    activeRequest =
      CHANGE_REQUEST,
    latestProposal =
      PROPOSAL,
    existingDecision:
      currentDecision =
        null,
    closure:
      currentClosure =
        null,
    baselineResolution =
      BASELINE_RESOLUTION,
  } = options;

  const clientRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          CLIENT,
        ),
  } as unknown as ClientRepository;

  const orderRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          ORDER,
        ),
  } as unknown as OrderRepository;

  const garmentRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          GARMENT,
        ),
  } as unknown as GarmentRepository;

  const session:
    ChangeControlLifecycleSession = {
      findLatestAgreementVersion:
        vi.fn()
          .mockResolvedValue(
            latestAgreement,
          ),

      findAgreementResolutionForVersion:
        vi.fn()
          .mockResolvedValue(
            baselineResolution,
          ),

      findActiveChangeRequest:
        vi.fn()
          .mockResolvedValue(
            activeRequest,
          ),

      findLatestProposalForRequest:
        vi.fn()
          .mockResolvedValue(
            latestProposal,
          ),

      findDecisionForProposal:
        vi.fn()
          .mockResolvedValue(
            currentDecision,
          ),

      findClosureForRequest:
        vi.fn()
          .mockResolvedValue(
            currentClosure,
          ),

      createChangeRequest:
        vi.fn(),

      createChangeProposalVersion:
        vi.fn(),

      createChangeProposalDecision:
        vi.fn(
          async (data) => ({
            id: "decision-new",
            createdAt: NOW,
            ...data,
          }),
        ),

      createAppliedAgreementVersion:
        vi.fn(
          async (data) => ({
            id: "agreement-2",
            createdAt: NOW,
            ...data,
          }),
        ),

      createAppliedAgreementResolution:
        vi.fn(
          async (data) => ({
            id:
              "resolution-2",
            createdAt: NOW,
            ...data,
          }),
        ),
      createChangeRequestClosure:
        vi.fn(),

    };

  const lifecycleRepository = {
    withGarmentLifecycle:
      vi.fn(
        async (
          _scope,
          operation,
        ) =>
          operation(
            session,
          ),
      ),
  } as unknown as
    ChangeControlLifecycleRepository;

  return {
    clientRepository,
    orderRepository,
    garmentRepository,
    lifecycleRepository,
    session,
  };
}

const REQUEST = {
  garmentId: "garment-1",
  changeRequestId:
    "change-request-1",
  changeProposalVersionId:
    "proposal-1",
  occurredAt:
    new Date(
      "2026-09-09T14:00:00.000Z",
    ),
  clientDecisionChannel:
    "WHATSAPP",
  evidenceNote:
    "Client approved the revised terms.",
} as const;

describe(
  "recordChangeProposalApprovalForTenant",
  () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(
        NOW,
      );
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it(
      "atomically models approval as decision plus amended approved agreement",
      async () => {
        const deps =
          dependencies();

        const result =
          await recordChangeProposalApprovalForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          );

        expect(
          result.decision,
        ).toMatchObject({
          outcome: "APPROVED",
          decisionSource:
            "BUSINESS_RECORDED",
          recordedByMembershipId:
            "membership-1",
          portalGrantId: null,
        });

        expect(
          result.agreementVersion,
        ).toMatchObject({
          id: "agreement-2",
          revisionNumber: 2,
          supersedesAgreementVersionId:
            "agreement-1",
          measurementVersionId:
            "measurement-2",
          designSummary:
            "Long sleeve gown",
          fabricDescription:
            "Client supplied fabric",
          priceAmount:
            "90000",
          currency: "NGN",
          deliveryDate:
            "2026-10-20",
          styleReferenceIds: [
            "style-2",
          ],
        });

        expect(
          result.agreementResolution,
        ).toMatchObject({
          agreementVersionId:
            "agreement-2",
          outcome: "APPROVED",
          clientNameSnapshot:
            "Ada Okafor",
          clientDecisionChannel:
            "WHATSAPP",
          recordedByMembershipId:
            "membership-1",
        });
      },
    );

    it(
      "does not use the client decision time as the generated agreement resolution time",
      async () => {
        const deps =
          dependencies();

        const result =
          await recordChangeProposalApprovalForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          );

        expect(
          result.decision
            .occurredAt,
        ).toEqual(
          REQUEST.occurredAt,
        );

        expect(
          result.agreementResolution
            .occurredAt,
        ).toEqual(
          NOW,
        );
      },
    );

    it(
      "rejects PORTAL as an authenticated Business-recorded channel",
      async () => {
        const deps =
          dependencies();

        await expect(
          recordChangeProposalApprovalForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              ...REQUEST,
              clientDecisionChannel:
                "PORTAL",
            },
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );

    it(
      "rejects an already decided proposal",
      async () => {
        const deps =
          dependencies({
            existingDecision:
              existingDecision(),
          });

        await expect(
          recordChangeProposalApprovalForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });

        expect(
          deps.session
            .createAppliedAgreementVersion,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a closed request",
      async () => {
        const deps =
          dependencies({
            closure:
              closure(),
          });

        await expect(
          recordChangeProposalApprovalForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );

    it(
      "rejects when the approved baseline is no longer current",
      async () => {
        const deps =
          dependencies({
            latestAgreement: {
              ...AGREEMENT,
              id: "agreement-2",
              revisionNumber: 2,
              supersedesAgreementVersionId:
                "agreement-1",
            },
          });

        await expect(
          recordChangeProposalApprovalForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );

    it(
      "rejects a baseline that is no longer approved",
      async () => {
        const deps =
          dependencies({
            baselineResolution: {
              ...BASELINE_RESOLUTION,
              outcome: "REJECTED",
            },
          });

        await expect(
          recordChangeProposalApprovalForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );

    it(
      "rejects a stale proposal identifier",
      async () => {
        const deps =
          dependencies();

        await expect(
          recordChangeProposalApprovalForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              ...REQUEST,
              changeProposalVersionId:
                "proposal-old",
            },
          ),
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      },
    );

    it(
      "does not create an agreement resolution if amended agreement creation fails",
      async () => {
        const deps =
          dependencies();

        (
          deps.session
            .createAppliedAgreementVersion as ReturnType<
              typeof vi.fn
            >
        ).mockRejectedValue(
          new Error(
            "Persistence failure",
          ),
        );

        await expect(
          recordChangeProposalApprovalForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });

        expect(
          deps.session
            .createAppliedAgreementResolution,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
