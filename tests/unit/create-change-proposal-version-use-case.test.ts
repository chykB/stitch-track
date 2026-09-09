import {
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
  createChangeProposalVersionForTenant,
} from "../../src/change-control/application/use-cases/create-change-proposal-version";
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
  userId: "user-1",
  businessId: "business-1",
  membershipId: "membership-1",
  role: "OWNER",
};

const CLIENT = {
  id: "client-1",
  businessId: "business-1",
  name: "Ada Okafor",
  phone: "08050000001",
  email: null,
  createdAt:
    new Date(
      "2026-09-01T10:00:00.000Z",
    ),
};

const ORDER = {
  id: "order-1",
  businessId: "business-1",
  clientId: "client-1",
  createdAt:
    new Date(
      "2026-09-01T10:01:00.000Z",
    ),
};

const GARMENT = {
  id: "garment-1",
  businessId: "business-1",
  orderId: "order-1",
  name: "Emerald Gown",
  createdAt:
    new Date(
      "2026-09-01T10:02:00.000Z",
    ),
};

const AGREEMENT: AgreementVersion = {
  id: "agreement-1",
  businessId: "business-1",
  clientId: "client-1",
  orderId: "order-1",
  garmentId: "garment-1",
  revisionNumber: 1,
  measurementVersionId: null,
  designSummary: "Fitted gown",
  fabricDescription: null,
  quantity: 1,
  priceAmount: "80000",
  currency: "NGN",
  deliveryDate: "2026-10-15",
  note: null,
  styleReferenceIds: [],
  supersedesAgreementVersionId:
    null,
  createdAt:
    new Date(
      "2026-09-09T10:00:00.000Z",
    ),
};

const BASELINE_RESOLUTION:
  AgreementResolution = {
    id: "resolution-1",
    businessId: "business-1",
    agreementVersionId:
      "agreement-1",
    outcome: "APPROVED",
    occurredAt:
      new Date(
        "2026-09-09T11:00:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote: "Approved.",
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T11:01:00.000Z",
      ),
  };

const CHANGE_REQUEST:
  ChangeRequest = {
    id: "change-request-1",
    businessId: "business-1",
    clientId: "client-1",
    orderId: "order-1",
    garmentId: "garment-1",
    baselineAgreementVersionId:
      "agreement-1",
    requestedBy: "CLIENT",
    origin: "BUSINESS_RECORDED",
    requestChannel: "WHATSAPP",
    description: "Add sleeves",
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

function proposal(
  revisionNumber = 1,
): ChangeProposalVersion {
  return {
    id:
      `proposal-${revisionNumber}`,
    businessId: "business-1",
    changeRequestId:
      "change-request-1",
    clientId: "client-1",
    orderId: "order-1",
    garmentId: "garment-1",
    baselineAgreementVersionId:
      "agreement-1",
    revisionNumber,
    supersedesChangeProposalVersionId:
      revisionNumber === 1
        ? null
        : `proposal-${revisionNumber - 1}`,
    measurementVersionId:
      "measurement-1",
    designSummary:
      "Long sleeve gown",
    fabricDescription: null,
    quantity: 1,
    priceAmount: "90000",
    currency: "NGN",
    deliveryDate: "2026-10-20",
    note: null,
    styleReferenceIds: [
      "style-1",
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
}

function decision(
  outcome:
    "APPROVED" |
    "REJECTED",
): ChangeProposalDecision {
  return {
    id: "decision-1",
    businessId: "business-1",
    changeProposalVersionId:
      "proposal-1",
    outcome,
    occurredAt:
      new Date(
        "2026-09-09T13:30:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    decisionSource:
      "BUSINESS_RECORDED",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote:
      "Client decision.",
    recordedByMembershipId:
      "membership-1",
    portalGrantId: null,
    createdAt:
      new Date(
        "2026-09-09T13:31:00.000Z",
      ),
  };
}

function closure():
  ChangeRequestClosure {
  return {
    id: "closure-1",
    businessId: "business-1",
    changeRequestId:
      "change-request-1",
    outcome: "WITHDRAWN",
    reason: "Cancelled.",
    occurredAt:
      new Date(
        "2026-09-09T13:40:00.000Z",
      ),
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-09T13:41:00.000Z",
      ),
  };
}

function dependencies(
  options: {
    activeRequest?:
      ChangeRequest | null;
    latestAgreement?:
      AgreementVersion | null;
    latestProposal?:
      ChangeProposalVersion | null;
    latestDecision?:
      ChangeProposalDecision | null;
    closure?:
      ChangeRequestClosure | null;
  } = {},
) {
  const {
    activeRequest =
      CHANGE_REQUEST,
    latestAgreement =
      AGREEMENT,
    latestProposal =
      null,
    latestDecision =
      null,
    closure:
      requestClosure =
        null,
  } = options;

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
          id: "measurement-1",
          businessId:
            "business-1",
          clientId: "client-1",
        }),
  } as unknown as
    MeasurementVersionRepository;

  const styleReferenceRepository = {
    findById:
      vi.fn()
        .mockResolvedValue({
          id: "style-1",
          businessId:
            "business-1",
          garmentId:
            "garment-1",
        }),
  } as unknown as
    StyleReferenceRepository;

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
            BASELINE_RESOLUTION,
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
            latestDecision,
          ),

      findClosureForRequest:
        vi.fn()
          .mockResolvedValue(
            requestClosure,
          ),

      createChangeRequest:
        vi.fn(),

      createChangeProposalVersion:
        vi.fn(
          async (data) => ({
            id: "proposal-new",
            createdAt:
              new Date(
                "2026-09-09T14:00:00.000Z",
              ),
            ...data,
          }),
        ),

      createChangeProposalDecision:
        vi.fn(),
      createAppliedAgreementVersion:
        vi.fn(),

      createAppliedAgreementResolution:
        vi.fn(),

      createChangeRequestClosure:
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
    measurementVersionRepository,
    styleReferenceRepository,
    lifecycleRepository,
    session,
  };
}

const REQUEST = {
  garmentId: "garment-1",
  changeRequestId:
    "change-request-1",
  measurementVersionId:
    "measurement-1",
  designSummary:
    " Long sleeve gown ",
  fabricDescription: null,
  quantity: 1,
  priceAmount: "90000",
  currency: "ngn",
  deliveryDate:
    "2026-10-20",
  note: null,
  styleReferenceIds: [
    "style-1",
  ],
  rationale:
    " Sleeves affect price. ",
} as const;

describe(
  "createChangeProposalVersionForTenant",
  () => {
    it(
      "creates proposal revision one from the active approved baseline",
      async () => {
        const deps =
          dependencies();

        const result =
          await createChangeProposalVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          );

        expect(
          result,
        ).toMatchObject({
          id: "proposal-new",
          changeRequestId:
            "change-request-1",
          baselineAgreementVersionId:
            "agreement-1",
          revisionNumber: 1,
          supersedesChangeProposalVersionId:
            null,
          designSummary:
            "Long sleeve gown",
          priceAmount:
            "90000",
          currency: "NGN",
          createdByMembershipId:
            "membership-1",
        });
      },
    );

    it(
      "creates the next proposal after rejection",
      async () => {
        const deps =
          dependencies({
            latestProposal:
              proposal(1),
            latestDecision:
              decision(
                "REJECTED",
              ),
          });

        const result =
          await createChangeProposalVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          );

        expect(
          result,
        ).toMatchObject({
          revisionNumber: 2,
          supersedesChangeProposalVersionId:
            "proposal-1",
        });
      },
    );

    it(
      "rejects another proposal while the latest is pending",
      async () => {
        const deps =
          dependencies({
            latestProposal:
              proposal(),
          });

        await expect(
          createChangeProposalVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );

    it(
      "rejects another proposal after approval",
      async () => {
        const deps =
          dependencies({
            latestProposal:
              proposal(),
            latestDecision:
              decision(
                "APPROVED",
              ),
          });

        await expect(
          createChangeProposalVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );

    it(
      "rejects a closed change request",
      async () => {
        const deps =
          dependencies({
            closure:
              closure(),
          });

        await expect(
          createChangeProposalVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );

    it(
      "rejects when the request baseline is no longer current",
      async () => {
        const deps =
          dependencies({
            latestAgreement: {
              ...AGREEMENT,
              id:
                "agreement-2",
              revisionNumber: 2,
              supersedesAgreementVersionId:
                "agreement-1",
            },
          });

        await expect(
          createChangeProposalVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );

    it(
      "rejects a measurement belonging to another client",
      async () => {
        const deps =
          dependencies();

        (
          deps.measurementVersionRepository
            .findById as ReturnType<
              typeof vi.fn
            >
        ).mockResolvedValue({
          id: "measurement-1",
          businessId:
            "business-1",
          clientId:
            "client-other",
        });

        await expect(
          createChangeProposalVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      },
    );

    it(
      "rejects a style reference belonging to another garment",
      async () => {
        const deps =
          dependencies();

        (
          deps.styleReferenceRepository
            .findById as ReturnType<
              typeof vi.fn
            >
        ).mockResolvedValue({
          id: "style-1",
          businessId:
            "business-1",
          garmentId:
            "garment-other",
        });

        await expect(
          createChangeProposalVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.lifecycleRepository,
            TENANT,
            REQUEST,
          ),
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      },
    );

    it(
      "returns NOT_FOUND for a stale or inaccessible change request identifier",
      async () => {
        const deps =
          dependencies();

        await expect(
          createChangeProposalVersionForTenant(
            deps.clientRepository,
            deps.orderRepository,
            deps.garmentRepository,
            deps.measurementVersionRepository,
            deps.styleReferenceRepository,
            deps.lifecycleRepository,
            TENANT,
            {
              ...REQUEST,
              changeRequestId:
                "change-request-other",
            },
          ),
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      },
    );
  },
);
