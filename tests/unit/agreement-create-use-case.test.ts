import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAgreementVersionForTenant,
} from "../../src/agreement/application/use-cases/create-agreement-version";
import type {
  AgreementLifecycleRepository,
  AgreementLifecycleSession,
} from "../../src/agreement/application/ports/agreement-lifecycle-repository";
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
  MeasurementVersionRepository,
} from "../../src/measurement/application/ports/measurement-version-repository";
import type {
  OrderRepository,
} from "../../src/order/application/ports/order-repository";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";
import type {
  StyleReferenceRepository,
} from "../../src/style-reference/application/ports/style-reference-repository";

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

function version(
  revisionNumber: number,
): AgreementVersion {
  return {
    id:
      `agreement-${revisionNumber}`,
    businessId:
      "business-1",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    revisionNumber,
    measurementVersionId:
      "measurement-1",
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
    styleReferenceIds: [
      "style-1",
    ],
    supersedesAgreementVersionId:
      revisionNumber === 1
        ? null
        : `agreement-${revisionNumber - 1}`,
    createdAt:
      new Date(
        "2026-09-08T10:00:00.000Z",
      ),
  };
}

function resolution(
  outcome:
    "APPROVED" |
    "REJECTED" |
    "WITHDRAWN",
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
        "2026-09-08T11:00:00.000Z",
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
      "Recorded evidence.",
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
    AgreementVersion | null = null,
  latestResolution:
    AgreementResolution | null = null,
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

  const measurementVersionRepository = {
    findById:
      vi.fn()
        .mockResolvedValue({
          id:
            "measurement-1",
          businessId:
            "business-1",
          clientId:
            "client-1",
          measuredAt:
            new Date(),
          unit:
            "CENTIMETER",
          note:
            null,
          entries: [],
          createdAt:
            new Date(),
        }),
  } as unknown as MeasurementVersionRepository;

  const styleReferenceRepository = {
    findById:
      vi.fn()
        .mockResolvedValue({
          id:
            "style-1",
          businessId:
            "business-1",
          garmentId:
            "garment-1",
          sourceUrl:
            "https://example.com/style.jpg",
          label:
            null,
          note:
            null,
          createdAt:
            new Date(),
        }),
  } as unknown as StyleReferenceRepository;

  const session: AgreementLifecycleSession = {
    findLatestVersion:
      vi.fn()
        .mockResolvedValue(
          latestVersion,
        ),

    findResolutionForVersion:
      vi.fn()
        .mockResolvedValue(
          latestResolution,
        ),

    createVersion:
      vi.fn(
        async (data) => ({
          id:
            `agreement-${data.revisionNumber}`,
          createdAt:
            new Date(
              "2026-09-08T12:00:00.000Z",
            ),
          ...data,
        }),
      ),

    createResolution:
      vi.fn(),
  };

  const agreementLifecycleRepository: AgreementLifecycleRepository = {
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
    measurementVersionRepository,
    styleReferenceRepository,
    agreementLifecycleRepository,
    session,
  };
}

const REQUEST = {
  garmentId:
    "garment-1",
  designSummary:
    "  Fitted   gown ",
  fabricDescription:
    " Client fabric ",
  quantity:
    1,
  priceAmount:
    "080000.0000",
  currency:
    "ngn",
  deliveryDate:
    "2026-10-15",
  note:
    " First proposal ",
  measurementVersionId:
    "measurement-1",
  styleReferenceIds: [
    "style-1",
  ],
} as const;

describe(
  "createAgreementVersionForTenant",
  () => {
    it(
      "creates revision one from the derived Garment Order Client chain",
      async () => {
        const deps =
          dependencies();

        const result =
          await createAgreementVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            REQUEST,
          );

        expect(
          deps.garmentRepository
            .findById,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          garmentId:
            "garment-1",
        });

        expect(
          deps.orderRepository
            .findById,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          orderId:
            "order-1",
        });

        expect(
          deps.clientRepository
            .findById,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          clientId:
            "client-1",
        });

        expect(
          deps.session.createVersion,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
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
            supersedesAgreementVersionId:
              null,
            designSummary:
              "Fitted gown",
            priceAmount:
              "80000",
            currency:
              "NGN",
          }),
        );

        expect(result.revisionNumber)
          .toBe(1);
      },
    );

    it.each([
      "REJECTED",
      "WITHDRAWN",
    ] as const)(
      "creates the next revision after %s",
      async (outcome) => {
        const deps =
          dependencies(
            version(1),
            resolution(
              outcome,
            ),
          );

        const result =
          await createAgreementVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            REQUEST,
          );

        expect(result)
          .toMatchObject({
            revisionNumber:
              2,
            supersedesAgreementVersionId:
              "agreement-1",
          });
      },
    );

    it(
      "returns CONFLICT when the latest agreement remains pending",
      async () => {
        const deps =
          dependencies(
            version(1),
            null,
          );

        await expect(
          createAgreementVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session.createVersion,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns CONFLICT after the latest agreement is approved",
      async () => {
        const deps =
          dependencies(
            version(1),
            resolution(
              "APPROVED",
            ),
          );

        await expect(
          createAgreementVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code:
            "CONFLICT",
        });

        expect(
          deps.session.createVersion,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "hides a MeasurementVersion belonging to another Client",
      async () => {
        const deps =
          dependencies();

        vi.mocked(
          deps
            .measurementVersionRepository
            .findById,
        ).mockResolvedValue({
          id:
            "measurement-1",
          businessId:
            "business-1",
          clientId:
            "other-client",
          measuredAt:
            new Date(),
          unit:
            "CENTIMETER",
          note:
            null,
          entries: [],
          createdAt:
            new Date(),
        });

        await expect(
          createAgreementVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps
            .agreementLifecycleRepository
            .withGarmentLifecycle,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "hides a StyleReference belonging to another Garment",
      async () => {
        const deps =
          dependencies();

        vi.mocked(
          deps
            .styleReferenceRepository
            .findById,
        ).mockResolvedValue({
          id:
            "style-1",
          businessId:
            "business-1",
          garmentId:
            "other-garment",
          sourceUrl:
            "https://example.com/other.jpg",
          label:
            null,
          note:
            null,
          createdAt:
            new Date(),
        });

        await expect(
          createAgreementVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.agreementLifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          deps
            .agreementLifecycleRepository
            .withGarmentLifecycle,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
