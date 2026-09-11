import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ChangeControlLifecycleRepository,
  ChangeControlLifecycleSession,
} from "../../src/change-control/application/ports/change-control-lifecycle-repository";
import type {
  ClientPortalTokenService,
} from "../../src/change-control/application/ports/client-portal-token-service";
import {
  recordChangeProposalDecisionFromPortal,
} from "../../src/change-control/application/use-cases/record-change-proposal-decision-from-portal";
import type {
  ClientPortalGrant,
} from "../../src/change-control/domain/client-portal-grant";
import type {
  ChangeProposalVersion,
} from "../../src/change-control/domain/change-proposal-version";
import type {
  ClientRepository,
} from "../../src/client/application/ports/client-repository";

const NOW =
  new Date(
    "2026-09-10T21:30:00.000Z",
  );

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

const AGREEMENT = {
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

const BASELINE_RESOLUTION = {
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

const CHANGE_REQUEST = {
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
      "2026-09-10T21:00:00.000Z",
    ),
};

function grant(
  overrides:
    Partial<ClientPortalGrant> = {},
): ClientPortalGrant {
  return {
    id:
      "portal-grant-1",
    businessId:
      "business-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    purpose:
      "DECIDE_CHANGE_PROPOSAL",
    changeProposalVersionId:
      "proposal-1",
    tokenHash:
      "hashed-token",
    expiresAt:
      new Date(
        "2026-09-11T21:30:00.000Z",
      ),
    consumedAt:
      null,
    revokedAt:
      null,
    createdByMembershipId:
      "grant-creator-membership",
    createdAt:
      new Date(
        "2026-09-10T21:05:00.000Z",
      ),
    ...overrides,
  };
}

function dependencies(
  options: {
    discoveredGrant?:
      ClientPortalGrant | null;
    lockedGrant?:
      ClientPortalGrant | null;
    clientFound?:
      boolean;
    activeRequest?:
      typeof CHANGE_REQUEST | null;
    latestAgreement?:
      typeof AGREEMENT | null;
    baselineResolution?:
      typeof BASELINE_RESOLUTION | null;
    latestProposal?:
      typeof PROPOSAL | null;
    existingDecision?:
      object | null;
    closure?:
      object | null;
  } = {},
) {
  const discoveredGrant =
    options.discoveredGrant ===
      undefined
      ? grant()
      : options.discoveredGrant;

  const lockedGrant =
    options.lockedGrant ===
      undefined
      ? discoveredGrant
      : options.lockedGrant;

  const clientRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          options.clientFound ===
            false
            ? null
            : CLIENT,
        ),
  } as unknown as
    ClientRepository;

  const session = {
    findLatestAgreementVersion:
      vi.fn()
        .mockResolvedValue(
          options.latestAgreement ===
            undefined
            ? AGREEMENT
            : options.latestAgreement,
        ),

    findAgreementResolutionForVersion:
      vi.fn()
        .mockResolvedValue(
          options.baselineResolution ===
            undefined
            ? BASELINE_RESOLUTION
            : options.baselineResolution,
        ),

    findActiveChangeRequest:
      vi.fn()
        .mockResolvedValue(
          options.activeRequest ===
            undefined
            ? CHANGE_REQUEST
            : options.activeRequest,
        ),

    findLatestProposalForRequest:
      vi.fn()
        .mockResolvedValue(
          options.latestProposal ===
            undefined
            ? PROPOSAL
            : options.latestProposal,
        ),

    findDecisionForProposal:
      vi.fn()
        .mockResolvedValue(
          options.existingDecision ??
            null,
        ),

    findClosureForRequest:
      vi.fn()
        .mockResolvedValue(
          options.closure ??
            null,
        ),

    findClientPortalGrantById:
      vi.fn()
        .mockResolvedValue(
          lockedGrant,
        ),

    createClientPortalGrant:
      vi.fn(),

    consumeClientPortalGrant:
      vi.fn(
        async (
          _grantId,
          consumedAt,
        ) => ({
          ...lockedGrant,
          consumedAt,
        }),
      ),

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
      vi.fn(
        async (data) => ({
          id:
            "decision-new",
          createdAt:
            NOW,
          ...data,
        }),
      ),

    createAppliedAgreementVersion:
      vi.fn(
        async (data) => ({
          id:
            "agreement-2",
          createdAt:
            NOW,
          ...data,
        }),
      ),

    createAppliedAgreementResolution:
      vi.fn(
        async (data) => ({
          id:
            "resolution-2",
          createdAt:
            NOW,
          ...data,
        }),
      ),

    createChangeRequestClosure:
      vi.fn(),

    releaseActiveChangeRequest:
      vi.fn(),
  } as unknown as
    ChangeControlLifecycleSession;

  const lifecycleRepository = {
    findClientPortalGrantByTokenHash:
      vi.fn()
        .mockResolvedValue(
          discoveredGrant,
        ),

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

  const tokenService = {
    issueToken:
      vi.fn(),

    hashToken:
      vi.fn()
        .mockReturnValue(
          "hashed-token",
        ),
  } as unknown as
    ClientPortalTokenService;

  return {
    clientRepository,
    lifecycleRepository,
    tokenService,
    session,
  };
}

async function execute(
  deps:
    ReturnType<
      typeof dependencies
    >,
  outcome:
    string,
  clientNote?:
    string | null,
) {
  return recordChangeProposalDecisionFromPortal(
    deps.clientRepository,
    deps.lifecycleRepository,
    deps.tokenService,
    {
      rawToken:
        "raw-token",
      outcome,
      clientNote,
    },
  );
}

describe(
  "recordChangeProposalDecisionFromPortal",
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
      "records a portal rejection, consumes the used grant, and revokes sibling grants",
      async () => {
        const deps =
          dependencies();

        const result =
          await execute(
            deps,
            "REJECTED",
            "  Price is too high.  ",
          );

        expect(
          deps.session
            .createChangeProposalDecision,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          changeProposalVersionId:
            "proposal-1",
          recordedByMembershipId:
            null,
          portalGrantId:
            "portal-grant-1",
          outcome:
            "REJECTED",
          occurredAt:
            NOW,
          clientNameSnapshot:
            "Ada Okafor",
          decisionSource:
            "CLIENT_PORTAL",
          clientDecisionChannel:
            "PORTAL",
          evidenceNote:
            "Client rejected through the secure portal. Client note: Price is too high.",
        });

        expect(
          deps.session
            .consumeClientPortalGrant,
        ).toHaveBeenCalledWith(
          "portal-grant-1",
          NOW,
        );

        expect(
          deps.session
            .revokeOtherDecisionGrantsForProposal,
        ).toHaveBeenCalledWith(
          "proposal-1",
          "portal-grant-1",
          NOW,
        );

        expect(
          deps.session
            .createAppliedAgreementVersion,
        ).not.toHaveBeenCalled();

        expect(result).toEqual({
          decisionId:
            "decision-new",
          outcome:
            "REJECTED",
          occurredAt:
            NOW,
          appliedAgreementVersionId:
            null,
        });
      },
    );

    it(
      "applies a portal approval and derives AgreementResolution recorder provenance from the grant creator",
      async () => {
        const deps =
          dependencies();

        const result =
          await execute(
            deps,
            "APPROVED",
          );

        expect(
          deps.session
            .createChangeProposalDecision,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            outcome:
              "APPROVED",
            decisionSource:
              "CLIENT_PORTAL",
            clientDecisionChannel:
              "PORTAL",
            clientNameSnapshot:
              "Ada Okafor",
            recordedByMembershipId:
              null,
            portalGrantId:
              "portal-grant-1",
          }),
        );

        expect(
          deps.session
            .createAppliedAgreementVersion,
        ).toHaveBeenCalledWith({
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
          supersedesAgreementVersionId:
            "agreement-1",
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
        });

        expect(
          deps.session
            .createAppliedAgreementResolution,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            businessId:
              "business-1",
            agreementVersionId:
              "agreement-2",
            outcome:
              "APPROVED",
            clientNameSnapshot:
              "Ada Okafor",
            clientDecisionChannel:
              "PORTAL",
            recordedByMembershipId:
              "grant-creator-membership",
          }),
        );

        expect(
          deps.session
            .releaseActiveChangeRequest,
        ).toHaveBeenCalledWith(
          "change-request-1",
        );

        expect(result).toEqual({
          decisionId:
            "decision-new",
          outcome:
            "APPROVED",
          occurredAt:
            NOW,
          appliedAgreementVersionId:
            "agreement-2",
        });
      },
    );

    it(
      "returns the generic unavailable result when token discovery fails",
      async () => {
        const deps =
          dependencies({
            discoveredGrant:
              null,
          });

        await expect(
          execute(
            deps,
            "APPROVED",
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
          message:
            "This portal link is unavailable.",
        });

        expect(
          deps.lifecycleRepository
            .withGarmentLifecycle,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns the generic unavailable result when the Client no longer exists",
      async () => {
        const deps =
          dependencies({
            clientFound:
              false,
          });

        await expect(
          execute(
            deps,
            "APPROVED",
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
          message:
            "This portal link is unavailable.",
        });

        expect(
          deps.lifecycleRepository
            .withGarmentLifecycle,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a locked capability whose token hash no longer matches",
      async () => {
        const deps =
          dependencies({
            lockedGrant:
              grant({
                tokenHash:
                  "different-hash",
              }),
          });

        await expect(
          execute(
            deps,
            "APPROVED",
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createChangeProposalDecision,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a capability with the wrong purpose",
      async () => {
        const wrong =
          grant({
            purpose:
              "REQUEST_CHANGE",
            changeProposalVersionId:
              null,
          });

        const deps =
          dependencies({
            discoveredGrant:
              wrong,
            lockedGrant:
              wrong,
          });

        await expect(
          execute(
            deps,
            "APPROVED",
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });
      },
    );

    it(
      "rejects an expired capability without consuming it",
      async () => {
        const expired =
          grant({
            expiresAt:
              NOW,
          });

        const deps =
          dependencies({
            discoveredGrant:
              expired,
            lockedGrant:
              expired,
          });

        await expect(
          execute(
            deps,
            "APPROVED",
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .consumeClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a capability when the ChangeRequest is no longer active",
      async () => {
        const deps =
          dependencies({
            activeRequest:
              null,
          });

        await expect(
          execute(
            deps,
            "APPROVED",
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createChangeProposalDecision,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a stale capability when its proposal is no longer latest",
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
                "proposal-1",
            },
          });

        await expect(
          execute(
            deps,
            "APPROVED",
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .consumeClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a decision after another actor already decided the proposal",
      async () => {
        const deps =
          dependencies({
            existingDecision: {
              id:
                "existing-decision",
            },
          });

        await expect(
          execute(
            deps,
            "REJECTED",
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createChangeProposalDecision,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a decision after the ChangeRequest has been closed",
      async () => {
        const deps =
          dependencies({
            closure: {
              id:
                "closure-1",
              outcome:
                "WITHDRAWN",
            },
          });

        await expect(
          execute(
            deps,
            "APPROVED",
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .consumeClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns CONFLICT for an invalid decision outcome without consuming the valid capability",
      async () => {
        const deps =
          dependencies();

        await expect(
          execute(
            deps,
            "MAYBE",
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .createChangeProposalDecision,
        ).not.toHaveBeenCalled();

        expect(
          deps.session
            .consumeClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
