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
  createChangeRequestFromPortal,
} from "../../src/change-control/application/use-cases/create-change-request-from-portal";
import type {
  ClientPortalGrant,
} from "../../src/change-control/domain/client-portal-grant";
import type {
  ChangeRequest,
} from "../../src/change-control/domain/change-request";

const NOW =
  new Date(
    "2026-09-10T21:30:00.000Z",
  );

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

const RESOLUTION:
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

function portalGrant(
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
      "REQUEST_CHANGE",
    changeProposalVersionId:
      null,
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
      "membership-1",
    createdAt:
      new Date(
        "2026-09-10T20:00:00.000Z",
      ),
    ...overrides,
  };
}

function activeRequest():
  ChangeRequest {
  return {
    id:
      "existing-request",
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
      "Existing request",
    requestedAt:
      new Date(
        "2026-09-10T20:30:00.000Z",
      ),
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-10T20:31:00.000Z",
      ),
  };
}

function dependencies(
  options: {
    discoveredGrant?:
      ClientPortalGrant | null;
    lockedGrant?:
      ClientPortalGrant | null;
    latestAgreement?:
      AgreementVersion | null;
    baselineResolution?:
      AgreementResolution | null;
    currentActiveRequest?:
      ChangeRequest | null;
    consumeError?:
      Error | null;
  } = {},
) {
  const discoveredGrant =
    options.discoveredGrant ===
      undefined
      ? portalGrant()
      : options.discoveredGrant;

  const lockedGrant =
    options.lockedGrant ===
      undefined
      ? discoveredGrant
      : options.lockedGrant;

  const latestAgreement =
    options.latestAgreement ===
      undefined
      ? AGREEMENT
      : options.latestAgreement;

  const baselineResolution =
    options.baselineResolution ===
      undefined
      ? RESOLUTION
      : options.baselineResolution;

  const currentActiveRequest =
    options.currentActiveRequest ===
      undefined
      ? null
      : options.currentActiveRequest;

  const consumeError =
    options.consumeError ??
      null;

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
            currentActiveRequest,
          ),

      findLatestProposalForRequest:
        vi.fn(),

      findDecisionForProposal:
        vi.fn(),

      findClosureForRequest:
        vi.fn(),

      findClientPortalGrantById:
        vi.fn()
          .mockResolvedValue(
            lockedGrant,
          ),

      createClientPortalGrant:
        vi.fn(),

      consumeClientPortalGrant:
        consumeError
          ? vi.fn()
              .mockRejectedValue(
                consumeError,
              )
          : vi.fn(
              async (
                _grantId,
                consumedAt,
              ) => ({
                ...lockedGrant!,
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
        vi.fn(
          async (data) => ({
            id:
              "change-request-new",
            createdAt:
              NOW,
            ...data,
          }),
        ),

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
  overrides:
    Partial<{
      rawToken: string;
      description: string;
    }> = {},
) {
  return createChangeRequestFromPortal(
    deps.lifecycleRepository,
    deps.tokenService,
    {
      rawToken:
        "raw-token",
      description:
        "  Add long sleeves  ",
      ...overrides,
    },
  );
}

describe(
  "createChangeRequestFromPortal",
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
      "creates a CLIENT_PORTAL ChangeRequest and consumes only the used capability",
      async () => {
        const deps =
          dependencies();

        const result =
          await execute(
            deps,
          );

        expect(
          deps.tokenService
            .hashToken,
        ).toHaveBeenCalledWith(
          "raw-token",
        );

        expect(
          deps.lifecycleRepository
            .findClientPortalGrantByTokenHash,
        ).toHaveBeenCalledWith(
          "hashed-token",
        );

        expect(
          deps.lifecycleRepository
            .withGarmentLifecycle,
        ).toHaveBeenCalledWith(
          {
            businessId:
              "business-1",
            garmentId:
              "garment-1",
          },
          expect.any(
            Function,
          ),
        );

        expect(
          deps.session
            .findClientPortalGrantById,
        ).toHaveBeenCalledWith(
          "portal-grant-1",
        );

        expect(
          deps.session
            .createChangeRequest,
        ).toHaveBeenCalledWith({
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
            "CLIENT_PORTAL",
          requestChannel:
            "PORTAL",
          description:
            "Add long sleeves",
          requestedAt:
            NOW,
          recordedByMembershipId:
            null,
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
            .revokeOtherRequestChangeGrants,
        ).toHaveBeenCalledWith(
          "client-1",
          "portal-grant-1",
          NOW,
        );

        expect(result).toMatchObject({
          id:
            "change-request-new",
          requestedBy:
            "CLIENT",
          origin:
            "CLIENT_PORTAL",
          requestChannel:
            "PORTAL",
          recordedByMembershipId:
            null,
        });

        const createOrder =
          vi.mocked(
            deps.session
              .createChangeRequest,
          ).mock
            .invocationCallOrder[0];

        const consumeOrder =
          vi.mocked(
            deps.session
              .consumeClientPortalGrant,
          ).mock
            .invocationCallOrder[0];

        const revokeOrder =
          vi.mocked(
            deps.session
              .revokeOtherRequestChangeGrants,
          ).mock
            .invocationCallOrder[0];

        expect(
          createOrder,
        ).toBeLessThan(
          consumeOrder,
        );

        expect(
          consumeOrder,
        ).toBeLessThan(
          revokeOrder,
        );
      },
    );

    it(
      "rejects an empty bearer token before hashing it",
      async () => {
        const deps =
          dependencies();

        await expect(
          execute(
            deps,
            {
              rawToken:
                "",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
          message:
            "This portal link is unavailable.",
        });

        expect(
          deps.tokenService
            .hashToken,
        ).not.toHaveBeenCalled();

        expect(
          deps.lifecycleRepository
            .withGarmentLifecycle,
        ).not.toHaveBeenCalled();
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
      "returns the generic unavailable result when the grant disappears before the locked reload",
      async () => {
        const deps =
          dependencies({
            lockedGrant:
              null,
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createChangeRequest,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a locked grant whose token hash no longer matches the discovered capability",
      async () => {
        const deps =
          dependencies({
            lockedGrant:
              portalGrant({
                tokenHash:
                  "different-hash",
              }),
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
          message:
            "This portal link is unavailable.",
        });

        expect(
          deps.session
            .createChangeRequest,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a capability with the wrong purpose",
      async () => {
        const decisionGrant =
          portalGrant({
            purpose:
              "DECIDE_CHANGE_PROPOSAL",
            changeProposalVersionId:
              "proposal-1",
          });

        const deps =
          dependencies({
            discoveredGrant:
              decisionGrant,
            lockedGrant:
              decisionGrant,
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
          message:
            "This portal link is unavailable.",
        });

        expect(
          deps.session
            .createChangeRequest,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a revoked capability without consuming it",
      async () => {
        const revoked =
          portalGrant({
            revokedAt:
              new Date(
                "2026-09-10T21:00:00.000Z",
              ),
          });

        const deps =
          dependencies({
            discoveredGrant:
              revoked,
            lockedGrant:
              revoked,
          });

        await expect(
          execute(
            deps,
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
      "rejects a previously consumed capability",
      async () => {
        const consumed =
          portalGrant({
            consumedAt:
              new Date(
                "2026-09-10T21:00:00.000Z",
              ),
          });

        const deps =
          dependencies({
            discoveredGrant:
              consumed,
            lockedGrant:
              consumed,
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createChangeRequest,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "treats a capability as expired at its exact expiry timestamp",
      async () => {
        const expired =
          portalGrant({
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
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createChangeRequest,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "does not create a request when the scoped Garment no longer has the grant's approved baseline",
      async () => {
        const deps =
          dependencies({
            latestAgreement: {
              ...AGREEMENT,
              clientId:
                "different-client",
            },
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
          message:
            "This portal link is unavailable.",
        });

        expect(
          deps.session
            .consumeClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "does not create another request when one is already active",
      async () => {
        const deps =
          dependencies({
            currentActiveRequest:
              activeRequest(),
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
          message:
            "This portal link is unavailable.",
        });

        expect(
          deps.session
            .createChangeRequest,
        ).not.toHaveBeenCalled();

        expect(
          deps.session
            .consumeClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "does not consume the capability when client input fails request normalization",
      async () => {
        const deps =
          dependencies();

        await expect(
          execute(
            deps,
            {
              description:
                "   ",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .createChangeRequest,
        ).not.toHaveBeenCalled();

        expect(
          deps.session
            .consumeClientPortalGrant,
        ).not.toHaveBeenCalled();

        expect(
          deps.session
            .revokeOtherRequestChangeGrants,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
