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
  createChangeRequestForTenant,
} from "../../src/change-control/application/use-cases/create-change-request";
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
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const NOW =
  new Date(
    "2026-09-09T14:00:00.000Z",
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

const AGREEMENT: AgreementVersion = {
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

function resolution(
  outcome:
    "APPROVED" |
    "REJECTED" |
    "WITHDRAWN" =
      "APPROVED",
): AgreementResolution {
  return {
    id:
      "resolution-1",
    businessId:
      "business-1",
    agreementVersionId:
      "agreement-1",
    outcome,
    occurredAt:
      new Date(
        "2026-09-09T11:00:00.000Z",
      ),
    clientNameSnapshot:
      outcome === "WITHDRAWN"
        ? null
        : "Ada Okafor",
    clientDecisionChannel:
      outcome === "WITHDRAWN"
        ? null
        : "WHATSAPP",
    evidenceNote:
      "Approved.",
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T11:01:00.000Z",
      ),
  };
}

function existingRequest():
  ChangeRequest {
  return {
    id:
      "change-request-existing",
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

function dependencies(
  latestAgreement:
    AgreementVersion | null =
      AGREEMENT,
  baselineResolution:
    AgreementResolution | null =
      resolution(),
  activeRequest:
    ChangeRequest | null =
      null,
) {
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
            null,
          ),

      findDecisionForProposal:
        vi.fn()
          .mockResolvedValue(
            null,
          ),

      findClosureForRequest:
        vi.fn()
          .mockResolvedValue(
            null,
          ),

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

describe(
  "createChangeRequestForTenant",
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
      "creates a Business-recorded client change from the current approved baseline",
      async () => {
        const deps =
          dependencies();

        const result =
          await createChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              requestedBy:
                "CLIENT",
              requestChannel:
                "WHATSAPP",
              description:
                "  Add long sleeves ",
              requestedAt:
                new Date(
                  "2026-09-09T12:00:00.000Z",
                ),
            },
          );

        expect(
          result,
        ).toMatchObject({
          id:
            "change-request-new",
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
            "Add long sleeves",
          recordedByMembershipId:
            "membership-1",
        });

        expect(
          deps.session
            .createChangeRequest,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            baselineAgreementVersionId:
              "agreement-1",
            recordedByMembershipId:
              "membership-1",
          }),
        );
      },
    );

    it(
      "allows an authenticated Business-initiated change",
      async () => {
        const deps =
          dependencies();

        const result =
          await createChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              requestedBy:
                "BUSINESS",
              requestChannel:
                null,
              description:
                "Correct construction detail",
              requestedAt:
                new Date(
                  "2026-09-09T12:00:00.000Z",
                ),
            },
          );

        expect(
          result.requestedBy,
        ).toBe(
          "BUSINESS",
        );

        expect(
          result.requestChannel,
        ).toBeNull();
      },
    );

    it(
      "rejects a garment without an agreement baseline",
      async () => {
        const deps =
          dependencies(
            null,
            null,
          );

        await expect(
          createChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              requestedBy:
                "CLIENT",
              requestChannel:
                "EMAIL",
              description:
                "Change neckline",
              requestedAt:
                new Date(
                  "2026-09-09T12:00:00.000Z",
                ),
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });
      },
    );

    it.each([
      "REJECTED",
      "WITHDRAWN",
    ] as const)(
      "rejects a latest agreement resolved as %s",
      async (outcome) => {
        const deps =
          dependencies(
            AGREEMENT,
            resolution(
              outcome,
            ),
          );

        await expect(
          createChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              requestedBy:
                "CLIENT",
              requestChannel:
                "PHONE",
              description:
                "Change neckline",
              requestedAt:
                new Date(
                  "2026-09-09T12:00:00.000Z",
                ),
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });
      },
    );

    it(
      "rejects an unresolved latest agreement",
      async () => {
        const deps =
          dependencies(
            AGREEMENT,
            null,
          );

        await expect(
          createChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              requestedBy:
                "CLIENT",
              requestChannel:
                "EMAIL",
              description:
                "Change neckline",
              requestedAt:
                new Date(
                  "2026-09-09T12:00:00.000Z",
                ),
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });
      },
    );

    it(
      "rejects a second active request for the garment",
      async () => {
        const deps =
          dependencies(
            AGREEMENT,
            resolution(),
            existingRequest(),
          );

        await expect(
          createChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              requestedBy:
                "CLIENT",
              requestChannel:
                "WHATSAPP",
              description:
                "Another request",
              requestedAt:
                new Date(
                  "2026-09-09T12:30:00.000Z",
                ),
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });
      },
    );

    it(
      "returns NOT_FOUND before entering the lifecycle for an inaccessible garment",
      async () => {
        const deps =
          dependencies();

        (
          deps.garmentRepository
            .findById as ReturnType<
              typeof vi.fn
            >
        ).mockResolvedValue(
          null,
        );

        await expect(
          createChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-foreign",
              requestedBy:
                "CLIENT",
              requestChannel:
                "EMAIL",
              description:
                "Change neckline",
              requestedAt:
                new Date(
                  "2026-09-09T12:00:00.000Z",
                ),
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
      "rejects a request time before the approved baseline",
      async () => {
        const deps =
          dependencies();

        await expect(
          createChangeRequestForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              requestedBy:
                "CLIENT",
              requestChannel:
                "EMAIL",
              description:
                "Change neckline",
              requestedAt:
                new Date(
                  "2026-09-09T10:59:59.999Z",
                ),
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
