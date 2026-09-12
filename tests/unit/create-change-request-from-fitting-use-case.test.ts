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
  ChangeRequest,
} from "../../src/change-control/domain/change-request";
import type {
  ClientRepository,
} from "../../src/client/application/ports/client-repository";
import type {
  FittingChangeRequestLifecycleRepository,
  FittingChangeRequestLifecycleSession,
} from "../../src/fitting/application/ports/fitting-change-request-lifecycle-repository";
import {
  createChangeRequestFromFittingForTenant,
} from "../../src/fitting/application/use-cases/create-change-request-from-fitting";
import type {
  FittingOutcome,
  FittingSession,
} from "../../src/fitting/domain/fitting";
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
    "2026-09-12T12:00:00.000Z",
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
      "2026-09-01T09:00:00.000Z",
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
      "2026-09-01T09:01:00.000Z",
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
      "2026-09-01T09:02:00.000Z",
    ),
};

const FITTING:
  FittingSession = {
    id:
      "fitting-1",
    businessId:
      "business-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    scheduledFor:
      new Date(
        "2026-09-10T10:00:00.000Z",
      ),
    note: null,
    createdByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-08T10:00:00.000Z",
      ),
  };

const FITTING_OUTCOME:
  FittingOutcome = {
    id:
      "fitting-outcome-1",
    businessId:
      "business-1",
    fittingSessionId:
      "fitting-1",
    outcome:
      "COMPLETED",
    occurredAt:
      new Date(
        "2026-09-10T10:00:00.000Z",
      ),
    baselineAgreementVersionId:
      "agreement-1",
    resultingMeasurementVersionId:
      null,
    observationSummary:
      "Sleeve length needs changing.",
    cancellationReason:
      null,
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-10T10:30:00.000Z",
      ),
  };

const CURRENT_AGREEMENT:
  AgreementVersion = {
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
    note: null,
    styleReferenceIds: [],
    supersedesAgreementVersionId:
      "agreement-1",
    createdAt:
      new Date(
        "2026-09-11T09:00:00.000Z",
      ),
  };

const CURRENT_RESOLUTION:
  AgreementResolution = {
    id:
      "resolution-2",
    businessId:
      "business-1",
    agreementVersionId:
      "agreement-2",
    outcome:
      "APPROVED",
    occurredAt:
      new Date(
        "2026-09-11T10:00:00.000Z",
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
        "2026-09-11T10:01:00.000Z",
      ),
  };

function dependencies(
  fitting:
    FittingSession | null =
      FITTING,
  outcome:
    FittingOutcome | null =
      FITTING_OUTCOME,
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
    FittingChangeRequestLifecycleSession = {
      findFittingSessionById:
        vi.fn()
          .mockResolvedValue(
            fitting,
          ),

      findOutcomeForSession:
        vi.fn()
          .mockResolvedValue(
            outcome,
          ),

      findLatestAgreementVersion:
        vi.fn()
          .mockResolvedValue(
            CURRENT_AGREEMENT,
          ),

      findAgreementResolutionForVersion:
        vi.fn()
          .mockResolvedValue(
            CURRENT_RESOLUTION,
          ),

      findActiveChangeRequest:
        vi.fn()
          .mockResolvedValue(
            activeRequest,
          ),

      createChangeRequest:
        vi.fn(
          async (data) => ({
            id:
              "change-request-1",
            createdAt:
              NOW,
            ...data,
          }),
        ),

      revokeOtherRequestChangeGrants:
        vi.fn(),

      createFittingChangeRequestLink:
        vi.fn(
          async (data) => ({
            createdAt:
              NOW,
            ...data,
          }),
        ),
    };

  const lifecycleRepository = {
    withGarmentLifecycle:
      vi.fn(
        async (
          _scope,
          operation,
        ) =>
          operation(session),
      ),
  } as unknown as
    FittingChangeRequestLifecycleRepository;

  return {
    clientRepository,
    orderRepository,
    garmentRepository,
    lifecycleRepository,
    session,
  };
}

describe(
  "createChangeRequestFromFittingForTenant",
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
      "creates the request from the current approved baseline and links the fitting",
      async () => {
        const deps =
          dependencies();

        const result =
          await createChangeRequestFromFittingForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              requestedBy:
                "CLIENT",
              requestChannel:
                "IN_PERSON",
              description:
                "  Change   sleeve length ",
              requestedAt:
                new Date(
                  "2026-09-12T11:00:00.000Z",
                ),
            },
          );

        expect(
          result
            .baselineAgreementVersionId,
        ).toBe(
          "agreement-2",
        );

        expect(
          result
            .baselineAgreementVersionId,
        ).not.toBe(
          FITTING_OUTCOME
            .baselineAgreementVersionId,
        );

        expect(
          deps.session
            .createFittingChangeRequestLink,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          fittingSessionId:
            "fitting-1",
          changeRequestId:
            "change-request-1",
          createdByMembershipId:
            "membership-1",
        });

        expect(
          deps.session
            .revokeOtherRequestChangeGrants,
        ).toHaveBeenCalled();
      },
    );

    it(
      "rejects a cancelled fitting",
      async () => {
        const deps =
          dependencies(
            FITTING,
            {
              ...FITTING_OUTCOME,
              outcome:
                "CANCELLED",
              baselineAgreementVersionId:
                null,
              observationSummary:
                null,
              cancellationReason:
                "Client unavailable.",
            },
          );

        await expect(
          createChangeRequestFromFittingForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              requestedBy:
                "CLIENT",
              requestChannel:
                "IN_PERSON",
              description:
                "Change sleeve length.",
              requestedAt:
                new Date(
                  "2026-09-12T11:00:00.000Z",
                ),
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
            .createFittingChangeRequestLink,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a fitting outside the trusted garment chain",
      async () => {
        const deps =
          dependencies({
            ...FITTING,
            garmentId:
              "garment-other",
          });

        await expect(
          createChangeRequestFromFittingForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-other",
              requestedBy:
                "CLIENT",
              requestChannel:
                "IN_PERSON",
              description:
                "Change sleeve length.",
              requestedAt:
                new Date(
                  "2026-09-12T11:00:00.000Z",
                ),
            },
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
      "preserves V0.6 active-request protection",
      async () => {
        const deps =
          dependencies(
            FITTING,
            FITTING_OUTCOME,
            {
              id:
                "change-request-active",
              businessId:
                "business-1",
              clientId:
                "client-1",
              orderId:
                "order-1",
              garmentId:
                "garment-1",
              baselineAgreementVersionId:
                "agreement-2",
              requestedBy:
                "CLIENT",
              origin:
                "BUSINESS_RECORDED",
              requestChannel:
                "IN_PERSON",
              description:
                "Existing request.",
              requestedAt:
                new Date(
                  "2026-09-12T10:30:00.000Z",
                ),
              recordedByMembershipId:
                "membership-1",
              createdAt:
                new Date(
                  "2026-09-12T10:31:00.000Z",
                ),
            },
          );

        await expect(
          createChangeRequestFromFittingForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              fittingSessionId:
                "fitting-1",
              requestedBy:
                "CLIENT",
              requestChannel:
                "IN_PERSON",
              description:
                "Change sleeve length.",
              requestedAt:
                new Date(
                  "2026-09-12T11:00:00.000Z",
                ),
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
            .createFittingChangeRequestLink,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
