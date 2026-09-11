import {
  afterEach,
  beforeEach,
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
  ClientRepository,
} from "../../src/client/application/ports/client-repository";
import type {
  ChangeControlLifecycleRepository,
} from "../../src/change-control/application/ports/change-control-lifecycle-repository";
import type {
  ClientPortalReadRepository,
} from "../../src/change-control/application/ports/client-portal-read-repository";
import type {
  ClientPortalTokenService,
} from "../../src/change-control/application/ports/client-portal-token-service";
import {
  getRequestChangePortalView,
} from "../../src/change-control/application/use-cases/get-request-change-portal-view";
import type {
  ClientPortalGrant,
} from "../../src/change-control/domain/client-portal-grant";
import type {
  GarmentRepository,
} from "../../src/garment/application/ports/garment-repository";
import type {
  OrderRepository,
} from "../../src/order/application/ports/order-repository";

const NOW =
  new Date(
    "2026-09-11T18:30:00.000Z",
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

const AGREEMENT = {
  id:
    "agreement-secret-id",
  businessId:
    "business-1",
  clientId:
    "client-1",
  orderId:
    "order-1",
  garmentId:
    "garment-1",
  revisionNumber:
    3,
  measurementVersionId:
    "measurement-secret-id",
  designSummary:
    "Fitted evening gown",
  fabricDescription:
    "Client supplied emerald fabric",
  quantity:
    1,
  priceAmount:
    "80000",
  currency:
    "NGN",
  deliveryDate:
    "2026-10-15",
  note:
    "Include lining",
  styleReferenceIds: [
    "style-secret-id",
  ],
  supersedesAgreementVersionId:
    "previous-secret-id",
  createdAt:
    new Date(
      "2026-09-10T10:00:00.000Z",
    ),
};

const RESOLUTION = {
  id:
    "resolution-secret-id",
  businessId:
    "business-1",
  agreementVersionId:
    "agreement-secret-id",
  outcome:
    "APPROVED",
  occurredAt:
    new Date(
      "2026-09-10T10:05:00.000Z",
    ),
  clientNameSnapshot:
    "Ada Okafor",
  clientDecisionChannel:
    "WHATSAPP",
  evidenceNote:
    "Approved.",
  recordedByMembershipId:
    "membership-secret-id",
  createdAt:
    new Date(
      "2026-09-10T10:06:00.000Z",
    ),
};

function grant(
  overrides:
    Partial<ClientPortalGrant> = {},
): ClientPortalGrant {
  return {
    id:
      "grant-secret-id",
    businessId:
      "business-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    changeProposalVersionId:
      null,
    purpose:
      "REQUEST_CHANGE",
    tokenHash:
      "hashed-token",
    expiresAt:
      new Date(
        "2026-09-12T18:30:00.000Z",
      ),
    consumedAt:
      null,
    revokedAt:
      null,
    createdByMembershipId:
      "membership-secret-id",
    createdAt:
      new Date(
        "2026-09-11T18:00:00.000Z",
      ),
    ...overrides,
  };
}

function dependencies(
  options: {
    portalGrant?:
      ClientPortalGrant | null;
    client?:
      typeof CLIENT | null;
    order?:
      typeof ORDER | null;
    garment?:
      typeof GARMENT | null;
    versions?:
      readonly typeof AGREEMENT[];
    resolution?:
      typeof RESOLUTION | null;
    activeRequest?:
      object | null;
  } = {},
) {
  const clientRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          options.client ===
            undefined
            ? CLIENT
            : options.client,
        ),
  } as unknown as
    ClientRepository;

  const orderRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          options.order ===
            undefined
            ? ORDER
            : options.order,
        ),
  } as unknown as
    OrderRepository;

  const garmentRepository = {
    findById:
      vi.fn()
        .mockResolvedValue(
          options.garment ===
            undefined
            ? GARMENT
            : options.garment,
        ),
  } as unknown as
    GarmentRepository;

  const agreementVersionRepository = {
    findById:
      vi.fn(),

    listForGarment:
      vi.fn()
        .mockResolvedValue(
          options.versions ??
            [
              AGREEMENT,
            ],
        ),
  } as unknown as
    AgreementVersionRepository;

  const agreementResolutionRepository = {
    findForVersion:
      vi.fn()
        .mockResolvedValue(
          options.resolution ===
            undefined
            ? RESOLUTION
            : options.resolution,
        ),
  } as unknown as
    AgreementResolutionRepository;

  const clientPortalReadRepository = {
    findActiveRequestForGarment:
      vi.fn()
        .mockResolvedValue(
          options.activeRequest ??
            null,
        ),
  } as unknown as
    ClientPortalReadRepository;

  const lifecycleRepository = {
    findClientPortalGrantByTokenHash:
      vi.fn()
        .mockResolvedValue(
          options.portalGrant ===
            undefined
            ? grant()
            : options.portalGrant,
        ),

    withGarmentLifecycle:
      vi.fn(),
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
    orderRepository,
    garmentRepository,
    agreementVersionRepository,
    agreementResolutionRepository,
    clientPortalReadRepository,
    lifecycleRepository,
    tokenService,
  };
}

async function execute(
  deps:
    ReturnType<
      typeof dependencies
    >,
) {
  return getRequestChangePortalView(
    deps.clientRepository,
    deps.orderRepository,
    deps.garmentRepository,
    deps.agreementVersionRepository,
    deps.agreementResolutionRepository,
    deps.clientPortalReadRepository,
    deps.lifecycleRepository,
    deps.tokenService,
    {
      rawToken:
        "raw-token",
    },
  );
}

describe(
  "getRequestChangePortalView",
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
      "returns only the client-facing context required to request a change",
      async () => {
        const deps =
          dependencies();

        const result =
          await execute(
            deps,
          );

        expect(result).toEqual({
          purpose:
            "REQUEST_CHANGE",
          clientName:
            "Ada Okafor",
          garmentName:
            "Emerald Gown",
          currentAgreement: {
            designSummary:
              "Fitted evening gown",
            fabricDescription:
              "Client supplied emerald fabric",
            quantity:
              1,
            priceAmount:
              "80000",
            currency:
              "NGN",
            deliveryDate:
              "2026-10-15",
            note:
              "Include lining",
          },
        });

        expect(result)
          .not.toHaveProperty(
            "tokenHash",
          );

        expect(
          result.currentAgreement,
        ).not.toHaveProperty(
          "revisionNumber",
        );

        expect(
          result.currentAgreement,
        ).not.toHaveProperty(
          "measurementVersionId",
        );

        expect(
          result.currentAgreement,
        ).not.toHaveProperty(
          "styleReferenceIds",
        );
      },
    );

    it(
      "returns generic unavailable when the token cannot be discovered",
      async () => {
        const deps =
          dependencies({
            portalGrant:
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
      },
    );

    it(
      "returns generic unavailable for the wrong capability purpose",
      async () => {
        const decisionGrant =
          grant({
            purpose:
              "DECIDE_CHANGE_PROPOSAL",
            changeProposalVersionId:
              "proposal-1",
          });

        const deps =
          dependencies({
            portalGrant:
              decisionGrant,
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });
      },
    );

    it(
      "returns generic unavailable when the capability has expired",
      async () => {
        const deps =
          dependencies({
            portalGrant:
              grant({
                expiresAt:
                  NOW,
              }),
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });
      },
    );

    it(
      "returns generic unavailable when the grant ownership chain no longer matches",
      async () => {
        const deps =
          dependencies({
            order: {
              ...ORDER,
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
        });
      },
    );

    it(
      "returns generic unavailable unless the latest AgreementVersion is approved",
      async () => {
        const deps =
          dependencies({
            resolution: {
              ...RESOLUTION,
              outcome:
                "REJECTED",
            },
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });
      },
    );

    it(
      "returns generic unavailable when another ChangeRequest is already active",
      async () => {
        const deps =
          dependencies({
            activeRequest: {
              id:
                "active-request",
            },
          });

        await expect(
          execute(
            deps,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });
      },
    );

    it(
      "does not enter the mutation lifecycle lock while rendering the portal view",
      async () => {
        const deps =
          dependencies();

        await execute(
          deps,
        );

        expect(
          deps.lifecycleRepository
            .withGarmentLifecycle,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
