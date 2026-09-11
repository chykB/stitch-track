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
import type {
  ClientPortalTokenService,
} from "../../src/change-control/application/ports/client-portal-token-service";
import {
  issueChangeProposalDecisionPortalGrantForTenant,
} from "../../src/change-control/application/use-cases/issue-change-proposal-decision-portal-grant";
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
    "2026-09-10T21:00:00.000Z",
  );

const EXPIRES_AT =
  new Date(
    "2026-09-11T21:00:00.000Z",
  );

const TENANT: TenantContext = {
  userId:
    "user-1",
  businessId:
    "business-1",
  membershipId:
    "membership-1",
  role:
    "OWNER",
};

const CLIENT = {
  id:
    "client-1",
  businessId:
    "business-1",
  name:
    "Ada Okafor",
  phone:
    "08050000001",
  email:
    null,
  createdAt:
    new Date(
      "2026-09-01T10:00:00.000Z",
    ),
};

const ORDER = {
  id:
    "order-1",
  businessId:
    "business-1",
  clientId:
    "client-1",
  createdAt:
    new Date(
      "2026-09-01T10:01:00.000Z",
    ),
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
      "2026-09-01T10:02:00.000Z",
    ),
};

const AGREEMENT:
  AgreementVersion = {
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
    styleReferenceIds:
      [],
    supersedesAgreementVersionId:
      null,
    createdAt:
      new Date(
        "2026-09-09T10:00:00.000Z",
      ),
  };

const BASELINE_RESOLUTION:
  AgreementResolution = {
    id:
      "resolution-1",
    businessId:
      "business-1",
    agreementVersionId:
      "agreement-1",
    outcome:
      "APPROVED",
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
    id:
      "change-request-1",
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

const PROPOSAL:
  ChangeProposalVersion = {
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
      "measurement-2",
    designSummary:
      "Long sleeve gown",
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
      "Proposal note",
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

const EXISTING_DECISION:
  ChangeProposalDecision = {
    id:
      "decision-1",
    businessId:
      "business-1",
    changeProposalVersionId:
      "proposal-1",
    outcome:
      "REJECTED",
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
    portalGrantId:
      null,
    createdAt:
      new Date(
        "2026-09-09T14:01:00.000Z",
      ),
  };

const CLOSURE:
  ChangeRequestClosure = {
    id:
      "closure-1",
    businessId:
      "business-1",
    changeRequestId:
      "change-request-1",
    outcome:
      "WITHDRAWN",
    reason:
      "Cancelled.",
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

function dependencies(
  options: {
    latestAgreement?:
      AgreementVersion | null;
    baselineResolution?:
      AgreementResolution | null;
    activeRequest?:
      ChangeRequest | null;
    latestProposal?:
      ChangeProposalVersion | null;
    existingDecision?:
      ChangeProposalDecision | null;
    closure?:
      ChangeRequestClosure | null;
  } = {},
) {
  const {
    latestAgreement =
      AGREEMENT,
    baselineResolution =
      BASELINE_RESOLUTION,
    activeRequest =
      CHANGE_REQUEST,
    latestProposal =
      PROPOSAL,
    existingDecision =
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
            existingDecision,
          ),

      findClosureForRequest:
        vi.fn()
          .mockResolvedValue(
            closure,
          ),

      findClientPortalGrantById:
        vi.fn(),

      createClientPortalGrant:
        vi.fn(
          async (data) => ({
            id:
              "portal-grant-1",
            consumedAt:
              null,
            revokedAt:
              null,
            ...data,
          }),
        ),

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
    findClientPortalGrantByTokenHash:
      vi.fn(),
  } as unknown as
    ChangeControlLifecycleRepository;

  const tokenService = {
    issueToken:
      vi.fn()
        .mockReturnValue({
          rawToken:
            "raw-decision-token",
          tokenHash:
            "hashed-decision-token",
        }),

    hashToken:
      vi.fn(),
  } as unknown as
    ClientPortalTokenService;

  return {
    clientRepository,
    orderRepository,
    garmentRepository,
    lifecycleRepository,
    tokenService,
    session,
  };
}

const REQUEST = {
  garmentId:
    "garment-1",
  changeRequestId:
    "change-request-1",
  changeProposalVersionId:
    "proposal-1",
  expiresAt:
    EXPIRES_AT,
};

describe(
  "issueChangeProposalDecisionPortalGrantForTenant",
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
      "issues one DECIDE_CHANGE_PROPOSAL capability for the latest pending proposal",
      async () => {
        const deps =
          dependencies();

        const result =
          await issueChangeProposalDecisionPortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            REQUEST,
          );

        expect(
          deps.session
            .createClientPortalGrant,
        ).toHaveBeenCalledWith({
          businessId:
            TENANT.businessId,
          clientId:
            CLIENT.id,
          orderId:
            ORDER.id,
          garmentId:
            GARMENT.id,
          changeProposalVersionId:
            PROPOSAL.id,
          purpose:
            "DECIDE_CHANGE_PROPOSAL",
          tokenHash:
            "hashed-decision-token",
          expiresAt:
            EXPIRES_AT,
          createdByMembershipId:
            TENANT.membershipId,
          createdAt:
            NOW,
        });

        expect(result).toEqual({
          clientPortalGrantId:
            "portal-grant-1",
          rawToken:
            "raw-decision-token",
          purpose:
            "DECIDE_CHANGE_PROPOSAL",
          changeProposalVersionId:
            PROPOSAL.id,
          expiresAt:
            EXPIRES_AT,
          createdAt:
            NOW,
        });

        expect(
          result,
        ).not.toHaveProperty(
          "tokenHash",
        );
      },
    );

    it(
      "refuses issuance when the requested ChangeRequest is not active",
      async () => {
        const deps =
          dependencies({
            activeRequest:
              null,
          });

        await expect(
          issueChangeProposalDecisionPortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.tokenService
            .issueToken,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "refuses issuance when the approved baseline is no longer current",
      async () => {
        const deps =
          dependencies({
            latestAgreement: {
              ...AGREEMENT,
              id:
                "agreement-2",
              revisionNumber:
                2,
              supersedesAgreementVersionId:
                AGREEMENT.id,
            },
          });

        await expect(
          issueChangeProposalDecisionPortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.tokenService
            .issueToken,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "refuses issuance when the requested proposal is no longer the latest",
      async () => {
        const deps =
          dependencies({
            latestProposal: {
              ...PROPOSAL,
              id:
                "proposal-2",
              revisionNumber:
                2,
              supersedesChangeProposalVersionId:
                PROPOSAL.id,
            },
          });

        await expect(
          issueChangeProposalDecisionPortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.tokenService
            .issueToken,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "refuses issuance after the proposal already has a decision",
      async () => {
        const deps =
          dependencies({
            existingDecision:
              EXISTING_DECISION,
          });

        await expect(
          issueChangeProposalDecisionPortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.tokenService
            .issueToken,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "refuses issuance after the ChangeRequest has been closed",
      async () => {
        const deps =
          dependencies({
            closure:
              CLOSURE,
          });

        await expect(
          issueChangeProposalDecisionPortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .createClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an expiry that is not later than the issuance time",
      async () => {
        const deps =
          dependencies();

        await expect(
          issueChangeProposalDecisionPortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            {
              ...REQUEST,
              expiresAt:
                NOW,
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .createClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
