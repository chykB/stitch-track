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
import {
  revokeClientPortalGrantForTenant,
} from "../../src/change-control/application/use-cases/revoke-client-portal-grant";
import type {
  ClientPortalGrant,
} from "../../src/change-control/domain/client-portal-grant";
import type {
  GarmentRepository,
} from "../../src/garment/application/ports/garment-repository";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const NOW =
  new Date(
    "2026-09-10T21:10:00.000Z",
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
      "REQUEST_CHANGE",
    changeProposalVersionId:
      null,
    tokenHash:
      "hashed-secret-token",
    expiresAt:
      new Date(
        "2026-09-11T21:10:00.000Z",
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

function dependencies(
  options: {
    currentGrant?:
      ClientPortalGrant | null;
    garmentFound?:
      boolean;
    revokeError?:
      Error | null;
  } = {},
) {
  const {
    currentGrant =
      grant(),
    garmentFound =
      true,
    revokeError =
      null,
  } = options;

  const garmentRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          garmentFound
            ? GARMENT
            : null,
        ),
  } as unknown as
    GarmentRepository;

  const session:
    ChangeControlLifecycleSession = {
      findLatestAgreementVersion:
        vi.fn(),

      findAgreementResolutionForVersion:
        vi.fn(),

      findActiveChangeRequest:
        vi.fn(),

      findLatestProposalForRequest:
        vi.fn(),

      findDecisionForProposal:
        vi.fn(),

      findClosureForRequest:
        vi.fn(),

      findClientPortalGrantById:
        vi.fn()
          .mockResolvedValue(
            currentGrant,
          ),

      createClientPortalGrant:
        vi.fn(),

      consumeClientPortalGrant:
        vi.fn(),

      revokeClientPortalGrant:
        revokeError
          ? vi.fn()
              .mockRejectedValue(
                revokeError,
              )
          : vi.fn(
              async (
                _clientPortalGrantId,
                revokedAt,
              ) => ({
                ...currentGrant!,
                revokedAt,
              }),
            ),

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
    findClientPortalGrantByTokenHash:
      vi.fn(),

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
    garmentRepository,
    lifecycleRepository,
    session,
  };
}

describe(
  "revokeClientPortalGrantForTenant",
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
      "revokes an active grant using the server timestamp",
      async () => {
        const deps =
          dependencies();

        const result =
          await revokeClientPortalGrantForTenant(
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                GARMENT.id,
              clientPortalGrantId:
                "portal-grant-1",
            },
          );

        expect(
          deps.session
            .revokeClientPortalGrant,
        ).toHaveBeenCalledWith(
          "portal-grant-1",
          NOW,
        );

        expect(result).toEqual({
          clientPortalGrantId:
            "portal-grant-1",
          purpose:
            "REQUEST_CHANGE",
          changeProposalVersionId:
            null,
          revokedAt:
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
      "returns NOT_FOUND for an inaccessible Garment",
      async () => {
        const deps =
          dependencies({
            garmentFound:
              false,
          });

        await expect(
          revokeClientPortalGrantForTenant(
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "foreign-garment",
              clientPortalGrantId:
                "portal-grant-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.lifecycleRepository
            .withGarmentLifecycle,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns NOT_FOUND when the grant is outside the locked Garment scope",
      async () => {
        const deps =
          dependencies({
            currentGrant:
              null,
          });

        await expect(
          revokeClientPortalGrantForTenant(
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                GARMENT.id,
              clientPortalGrantId:
                "foreign-grant",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .revokeClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "refuses to revoke a consumed grant",
      async () => {
        const deps =
          dependencies({
            currentGrant:
              grant({
                consumedAt:
                  new Date(
                    "2026-09-10T21:00:00.000Z",
                  ),
              }),
          });

        await expect(
          revokeClientPortalGrantForTenant(
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                GARMENT.id,
              clientPortalGrantId:
                "portal-grant-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .revokeClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "refuses to revoke an already revoked grant",
      async () => {
        const deps =
          dependencies({
            currentGrant:
              grant({
                revokedAt:
                  new Date(
                    "2026-09-10T21:00:00.000Z",
                  ),
              }),
          });

        await expect(
          revokeClientPortalGrantForTenant(
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                GARMENT.id,
              clientPortalGrantId:
                "portal-grant-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .revokeClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "allows an expired but otherwise active grant to be explicitly revoked",
      async () => {
        const deps =
          dependencies({
            currentGrant:
              grant({
                expiresAt:
                  new Date(
                    "2026-09-10T21:00:00.000Z",
                  ),
              }),
          });

        const result =
          await revokeClientPortalGrantForTenant(
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                GARMENT.id,
              clientPortalGrantId:
                "portal-grant-1",
            },
          );

        expect(
          result.revokedAt,
        ).toEqual(
          NOW,
        );
      },
    );

    it(
      "maps a concurrent active-state revocation failure to CONFLICT",
      async () => {
        const deps =
          dependencies({
            revokeError:
              new Error(
                "Client portal grant could not be revoked from its active state.",
              ),
          });

        await expect(
          revokeClientPortalGrantForTenant(
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                GARMENT.id,
              clientPortalGrantId:
                "portal-grant-1",
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
