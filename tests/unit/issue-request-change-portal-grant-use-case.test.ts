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
  issueRequestChangePortalGrantForTenant,
} from "../../src/change-control/application/use-cases/issue-request-change-portal-grant";
import type {
  ChangeRequest,
} from "../../src/change-control/domain/change-request";
import type {
  ClientRepository,
} from "../../src/client/application/ports/client-repository";
import type {
  GarmentRepository,
} from "../../src/garment/application/ports/garment-repository";
import type {
  OrderRepository,
} from "../../src/order/application/ports/order-repository";
import {
  ApplicationError,
} from "../../src/shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const NOW =
  new Date(
    "2026-09-10T20:50:00.000Z",
  );

const EXPIRES_AT =
  new Date(
    "2026-09-11T20:50:00.000Z",
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

const ACTIVE_REQUEST:
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
      "Existing change",
    requestedAt:
      new Date(
        "2026-09-10T15:00:00.000Z",
      ),
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-10T15:01:00.000Z",
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
    garmentFound?:
      boolean;
  } = {},
) {
  const {
    latestAgreement =
      AGREEMENT,
    baselineResolution =
      RESOLUTION,
    activeRequest =
      null,
    garmentFound =
      true,
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
          garmentFound
            ? GARMENT
            : null,
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
        vi.fn(),

      findDecisionForProposal:
        vi.fn(),

      findClosureForRequest:
        vi.fn(),

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
            "raw-secret-token",
          tokenHash:
            "hashed-secret-token",
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

describe(
  "issueRequestChangePortalGrantForTenant",
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
      "issues one REQUEST_CHANGE capability from the current approved Garment baseline",
      async () => {
        const deps =
          dependencies();

        const result =
          await issueRequestChangePortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            {
              garmentId:
                GARMENT.id,
              expiresAt:
                EXPIRES_AT,
            },
          );

        expect(
          deps.tokenService
            .issueToken,
        ).toHaveBeenCalledTimes(
          1,
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
            null,
          purpose:
            "REQUEST_CHANGE",
          tokenHash:
            "hashed-secret-token",
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
            "raw-secret-token",
          purpose:
            "REQUEST_CHANGE",
          changeProposalVersionId:
            null,
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
      "does not issue a capability when no approved baseline exists",
      async () => {
        const deps =
          dependencies({
            latestAgreement:
              null,
          });

        await expect(
          issueRequestChangePortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            {
              garmentId:
                GARMENT.id,
              expiresAt:
                EXPIRES_AT,
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.tokenService
            .issueToken,
        ).not.toHaveBeenCalled();

        expect(
          deps.session
            .createClientPortalGrant,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "does not issue a capability while a ChangeRequest is already active",
      async () => {
        const deps =
          dependencies({
            activeRequest:
              ACTIVE_REQUEST,
          });

        await expect(
          issueRequestChangePortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            {
              garmentId:
                GARMENT.id,
              expiresAt:
                EXPIRES_AT,
            },
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
      "rejects an expiry that is not later than the application-controlled issuance time",
      async () => {
        const deps =
          dependencies();

        await expect(
          issueRequestChangePortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            {
              garmentId:
                GARMENT.id,
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

    it(
      "returns NOT_FOUND without generating a token for an inaccessible Garment",
      async () => {
        const deps =
          dependencies({
            garmentFound:
              false,
          });

        await expect(
          issueRequestChangePortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            {
              garmentId:
                "foreign-garment",
              expiresAt:
                EXPIRES_AT,
            },
          ),
        ).rejects.toBeInstanceOf(
          ApplicationError,
        );

        await expect(
          issueRequestChangePortalGrantForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            deps.tokenService,
            TENANT,
            {
              garmentId:
                "foreign-garment",
              expiresAt:
                EXPIRES_AT,
            },
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
  },
);
