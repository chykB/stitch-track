import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AgreementLifecycleRepository,
  AgreementLifecycleSession,
} from "../../src/agreement/application/ports/agreement-lifecycle-repository";
import {
  recordAgreementResolutionForTenant,
} from "../../src/agreement/application/use-cases/record-agreement-resolution";
import type {
  AgreementResolution,
} from "../../src/agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../src/agreement/domain/agreement-version";
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

const VERSION: AgreementVersion = {
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
      "2026-09-08T10:00:00.000Z",
    ),
};

function existingResolution():
  AgreementResolution {
  return {
    id:
      "resolution-existing",
    businessId:
      "business-1",
    agreementVersionId:
      "agreement-1",
    outcome:
      "APPROVED",
    occurredAt:
      new Date(
        "2026-09-08T11:00:00.000Z",
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
        "2026-09-08T11:01:00.000Z",
      ),
  };
}

function dependencies(
  latestVersion:
    AgreementVersion | null =
      VERSION,
  resolution:
    AgreementResolution | null =
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

  const session: AgreementLifecycleSession = {
    findLatestVersion:
      vi.fn()
        .mockResolvedValue(
          latestVersion,
        ),

    findResolutionForVersion:
      vi.fn()
        .mockResolvedValue(
          resolution,
        ),

    createVersion:
      vi.fn(),

    createResolution:
      vi.fn(
        async (data) => ({
          id:
            "resolution-new",
          createdAt:
            new Date(
              "2026-09-08T12:00:00.000Z",
            ),
          ...data,
        }),
      ),
  };

  const agreementLifecycleRepository:
    AgreementLifecycleRepository = {
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
    };

  return {
    clientRepository,
    orderRepository,
    garmentRepository,
    agreementLifecycleRepository,
    session,
  };
}

describe(
  "recordAgreementResolutionForTenant",
  () => {
    beforeEach(() => {
      vi.useFakeTimers();

      vi.setSystemTime(
        new Date(
          "2026-09-08T12:00:00.000Z",
        ),
      );
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      "APPROVED",
      "REJECTED",
    ] as const)(
      "records %s using derived Client and authenticated Membership evidence",
      async (outcome) => {
        const deps =
          dependencies();

        const result =
          await recordAgreementResolutionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              agreementVersionId:
                "agreement-1",
              outcome,
              occurredAt:
                new Date(
                  "2026-09-08T11:00:00.000Z",
                ),
              clientDecisionChannel:
                "WHATSAPP",
              evidenceNote:
                " Confirmed by message. ",
            },
          );

        expect(
          deps
            .agreementLifecycleRepository
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
            .createResolution,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          agreementVersionId:
            "agreement-1",
          recordedByMembershipId:
            "membership-1",
          outcome,
          occurredAt:
            new Date(
              "2026-09-08T11:00:00.000Z",
            ),
          clientNameSnapshot:
            "Ada Okafor",
          clientDecisionChannel:
            "WHATSAPP",
          evidenceNote:
            "Confirmed by message.",
        });

        expect(result)
          .toMatchObject({
            outcome,
            clientNameSnapshot:
              "Ada Okafor",
            recordedByMembershipId:
              "membership-1",
          });
      },
    );

    it(
      "records WITHDRAWN without fabricating client evidence",
      async () => {
        const deps =
          dependencies();

        const result =
          await recordAgreementResolutionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              agreementVersionId:
                "agreement-1",
              outcome:
                "WITHDRAWN",
              occurredAt:
                new Date(
                  "2026-09-08T11:00:00.000Z",
                ),
              clientDecisionChannel:
                "WHATSAPP",
              evidenceNote:
                " Wrong delivery date. ",
            },
          );

        expect(
          deps.session
            .createResolution,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            outcome:
              "WITHDRAWN",
            clientNameSnapshot:
              null,
            clientDecisionChannel:
              null,
            evidenceNote:
              "Wrong delivery date.",
          }),
        );

        expect(result.outcome)
          .toBe("WITHDRAWN");
      },
    );

    it(
      "returns CONFLICT when the latest version already has a resolution",
      async () => {
        const deps =
          dependencies(
            VERSION,
            existingResolution(),
          );

        await expect(
          recordAgreementResolutionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              agreementVersionId:
                "agreement-1",
              outcome:
                "REJECTED",
              occurredAt:
                new Date(
                  "2026-09-08T11:00:00.000Z",
                ),
              clientDecisionChannel:
                "PHONE",
              evidenceNote:
                "Declined.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session
            .createResolution,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "hides an agreement that is not the latest version for the Garment",
      async () => {
        const deps =
          dependencies({
            ...VERSION,
            id:
              "agreement-2",
            revisionNumber:
              2,
            supersedesAgreementVersionId:
              "agreement-1",
          });

        await expect(
          recordAgreementResolutionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              agreementVersionId:
                "agreement-1",
              outcome:
                "APPROVED",
              occurredAt:
                new Date(
                  "2026-09-08T11:00:00.000Z",
                ),
              clientDecisionChannel:
                "WHATSAPP",
              evidenceNote:
                "Approved.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createResolution,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "hides an AgreementVersion whose stored parent chain does not match the Garment",
      async () => {
        const deps =
          dependencies({
            ...VERSION,
            clientId:
              "other-client",
          });

        await expect(
          recordAgreementResolutionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              agreementVersionId:
                "agreement-1",
              outcome:
                "APPROVED",
              occurredAt:
                new Date(
                  "2026-09-08T11:00:00.000Z",
                ),
              clientDecisionChannel:
                "WHATSAPP",
              evidenceNote:
                "Approved.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps.session
            .createResolution,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects PORTAL for the ordinary authenticated agreement-resolution workflow",
      async () => {
        const deps =
          dependencies();

        await expect(
          recordAgreementResolutionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
              agreementVersionId:
                "agreement-1",
              outcome:
                "APPROVED",
              occurredAt:
                new Date(
                  "2026-09-08T11:00:00.000Z",
                ),
              clientDecisionChannel:
                "PORTAL",
              evidenceNote:
                "Cannot fabricate portal provenance.",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
          message:
            "PORTAL is reserved for the controlled client portal workflow.",
        });

        expect(
          deps.session
            .createResolution,
        ).not.toHaveBeenCalled();
      },
    );

  },
);
