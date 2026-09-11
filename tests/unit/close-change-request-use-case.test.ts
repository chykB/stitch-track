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
  closeChangeRequestForTenant,
} from "../../src/change-control/application/use-cases/close-change-request";
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

function decision(
  outcome:
    "APPROVED" |
    "REJECTED",
): ChangeProposalDecision {
  return {
    id: "decision-1",
    businessId:
      "business-1",
    changeProposalVersionId:
      "proposal-1",
    outcome,
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
      "Client decision.",
    recordedByMembershipId:
      "membership-1",
    portalGrantId: null,
    createdAt:
      new Date(
        "2026-09-09T14:01:00.000Z",
      ),
  };
}

function existingClosure():
  ChangeRequestClosure {
  return {
    id: "closure-existing",
    businessId:
      "business-1",
    changeRequestId:
      "change-request-1",
    outcome: "WITHDRAWN",
    reason: "Already closed.",
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
    activeRequest?:
      ChangeRequest | null;
    latestProposal?:
      ChangeProposalVersion | null;
    latestDecision?:
      ChangeProposalDecision | null;
    closure?:
      ChangeRequestClosure | null;
  } = {},
) {
  const {
    activeRequest =
      CHANGE_REQUEST,
    latestProposal =
      null,
    latestDecision =
      null,
    closure =
      null,
  } = options;

  const clientRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          CLIENT,
        ),
  } as unknown as
    ClientRepository;

  const orderRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          ORDER,
        ),
  } as unknown as
    OrderRepository;

  const garmentRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          GARMENT,
        ),
  } as unknown as
    GarmentRepository;

  const session:
    ChangeControlLifecycleSession = {
      findLatestAgreementVersion:
        vi.fn()
          .mockResolvedValue(
            AGREEMENT,
          ),

      findAgreementResolutionForVersion:
        vi.fn()
          .mockResolvedValue(
            null as
              AgreementResolution |
              null,
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
            latestDecision,
          ),

      findClosureForRequest:
        vi.fn()
          .mockResolvedValue(
            closure,
          ),

      createChangeRequest:
        vi.fn(),

      createChangeProposalVersion:
        vi.fn(),

      createChangeProposalDecision:
        vi.fn(),

      createAppliedAgreementVersion:
        vi.fn(),

      createAppliedAgreementResolution:
        vi.fn(),

      createChangeRequestClosure:
        vi.fn(
          async (data) => ({
            id: "closure-new",
            createdAt: NOW,
            ...data,
          }),
        ),

      findClientPortalGrantById:
        vi.fn(),
      createClientPortalGrant:
        vi.fn(),
      consumeClientPortalGrant:
        vi.fn(),
      revokeClientPortalGrant:
        vi.fn(),

      revokeOtherRequestChangeGrants:
        vi.fn(),
      revokeOtherDecisionGrantsForProposal:
        vi.fn(),
      revokeDecisionGrantsForRequest:
        vi.fn(),

      releaseActiveChangeRequest:
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
  outcome: "WITHDRAWN",
  reason:
    "Client no longer wants the change.",
  occurredAt:
    new Date(
      "2026-09-09T14:00:00.000Z",
    ),
} as const;

describe(
  "closeChangeRequestForTenant",
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
      "closes a new request as withdrawn",
      async () => {
        const deps =
          dependencies();

        const result =
          await closeChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          );

        expect(
          result,
        ).toMatchObject({
          id: "closure-new",
          outcome: "WITHDRAWN",
          changeRequestId:
            "change-request-1",
          recordedByMembershipId:
            "membership-1",
        });

        expect(
          deps.session
            .releaseActiveChangeRequest,
        ).toHaveBeenCalledWith(
          "change-request-1",
        );
      },
    );

    it(
      "closes a request as impossible",
      async () => {
        const deps =
          dependencies();

        const result =
          await closeChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              ...REQUEST,
              outcome:
                "IMPOSSIBLE",
              reason:
                "The fabric cannot support the requested alteration.",
            },
          );

        expect(
          result.outcome,
        ).toBe(
          "IMPOSSIBLE",
        );
      },
    );

    it(
      "allows closure while a proposal is awaiting the client",
      async () => {
        const deps =
          dependencies({
            latestProposal:
              PROPOSAL,
          });

        await expect(
          closeChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).resolves.toMatchObject({
          outcome:
            "WITHDRAWN",
        });
      },
    );

    it(
      "allows closure after the latest proposal was rejected",
      async () => {
        const deps =
          dependencies({
            latestProposal:
              PROPOSAL,
            latestDecision:
              decision(
                "REJECTED",
              ),
          });

        await expect(
          closeChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).resolves.toMatchObject({
          outcome:
            "WITHDRAWN",
        });
      },
    );

    it(
      "rejects closure after approval",
      async () => {
        const deps =
          dependencies({
            latestProposal:
              PROPOSAL,
            latestDecision:
              decision(
                "APPROVED",
              ),
          });

        await expect(
          closeChangeRequestForTenant(
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
            .createChangeRequestClosure,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a second closure",
      async () => {
        const deps =
          dependencies({
            closure:
              existingClosure(),
          });

        await expect(
          closeChangeRequestForTenant(
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
      "returns NOT_FOUND for an inactive or inaccessible request",
      async () => {
        const deps =
          dependencies({
            activeRequest:
              null,
          });

        await expect(
          closeChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      },
    );

    it(
      "rejects an invalid closure timestamp",
      async () => {
        const deps =
          dependencies();

        await expect(
          closeChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              ...REQUEST,
              occurredAt:
                new Date(
                  "2026-09-09T12:00:00.000Z",
                ),
            },
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );

    it(
      "revokes outstanding decision portal grants when the ChangeRequest closes",
      async () => {
        const deps =
          dependencies({
            latestProposal:
              PROPOSAL,
          });

        await closeChangeRequestForTenant(
          deps.clientRepository,
          deps.orderRepository,
          deps.garmentRepository,
          deps.lifecycleRepository,
          TENANT,
          REQUEST,
        );

        expect(
          deps.session
            .revokeDecisionGrantsForRequest,
        ).toHaveBeenCalledWith(
          "change-request-1",
          NOW,
        );
      },
    );

  },
);
