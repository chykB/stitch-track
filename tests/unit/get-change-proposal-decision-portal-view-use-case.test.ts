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
  AgreementVersion,
} from "../../src/agreement/domain/agreement-version";
import type {
  AgreementVersionRepository,
} from "../../src/agreement/application/ports/agreement-version-repository";
import type {
  ClientRepository,
} from "../../src/client/application/ports/client-repository";
import type {
  ChangeControlHistoryRepository,
} from "../../src/change-control/application/ports/change-control-history-repository";
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
  getChangeProposalDecisionPortalView,
} from "../../src/change-control/application/use-cases/get-change-proposal-decision-portal-view";
import type {
  ClientPortalGrant,
} from "../../src/change-control/domain/client-portal-grant";
import type {
  ChangeProposalVersion,
} from "../../src/change-control/domain/change-proposal-version";
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
  StyleReferenceRepository,
} from "../../src/style-reference/application/ports/style-reference-repository";

const NOW =
  new Date(
    "2026-09-11T19:00:00.000Z",
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

const AGREEMENT:
  AgreementVersion = {
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
      1,
    measurementVersionId:
      "old-measurement-id",
    designSummary:
      "Sleeveless fitted gown",
    fabricDescription:
      "Emerald fabric",
    quantity:
      1,
    priceAmount:
      "80000",
    currency:
      "NGN",
    deliveryDate:
      "2026-10-15",
    note:
      "Original agreement",
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
    "resolution-secret-id",
  businessId:
    "business-1",
  agreementVersionId:
    "agreement-secret-id",
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
    "membership-secret-id",
  createdAt:
    new Date(
      "2026-09-09T11:01:00.000Z",
    ),
};

const CHANGE_REQUEST = {
  id:
    "request-secret-id",
  businessId:
    "business-1",
  clientId:
    "client-1",
  orderId:
    "order-1",
  garmentId:
    "garment-1",
  baselineAgreementVersionId:
    "agreement-secret-id",
  requestedBy:
    "CLIENT",
  origin:
    "CLIENT_PORTAL",
  requestChannel:
    "PORTAL",
  description:
    "Please add long sleeves.",
  requestedAt:
    new Date(
      "2026-09-10T09:00:00.000Z",
    ),
  recordedByMembershipId:
    null,
  createdAt:
    new Date(
      "2026-09-10T09:00:00.000Z",
    ),
};

const PROPOSAL_1:
  ChangeProposalVersion = {
    id:
      "proposal-secret-1",
    businessId:
      "business-1",
    changeRequestId:
      "request-secret-id",
    clientId:
      "client-1",
    orderId:
      "order-1",
    garmentId:
      "garment-1",
    baselineAgreementVersionId:
      "agreement-secret-id",
    revisionNumber:
      1,
    supersedesChangeProposalVersionId:
      null,
    measurementVersionId:
      "measurement-secret-id",
    designSummary:
      "Long sleeve gown",
    fabricDescription:
      "Emerald fabric",
    quantity:
      1,
    priceAmount:
      "90000",
    currency:
      "NGN",
    deliveryDate:
      "2026-10-18",
    note:
      "First proposal",
    styleReferenceIds: [
      "style-secret-1",
    ],
    rationale:
      "Sleeves require extra fabric.",
    createdByMembershipId:
      "membership-secret-id",
    createdAt:
      new Date(
        "2026-09-10T10:00:00.000Z",
      ),
  };

const PROPOSAL_2:
  ChangeProposalVersion = {
    ...PROPOSAL_1,
    id:
      "proposal-secret-2",
    revisionNumber:
      2,
    supersedesChangeProposalVersionId:
      "proposal-secret-1",
    priceAmount:
      "88000",
    deliveryDate:
      "2026-10-17",
    note:
      "Updated proposal",
    styleReferenceIds: [
      "style-secret-1",
      "style-secret-2",
    ],
    rationale:
      "Updated after client feedback.",
    createdAt:
      new Date(
        "2026-09-10T12:00:00.000Z",
      ),
  };

const REJECTED_DECISION = {
  id:
    "decision-secret-id",
  businessId:
    "business-1",
  changeProposalVersionId:
    "proposal-secret-1",
  outcome:
    "REJECTED",
  occurredAt:
    new Date(
      "2026-09-10T11:00:00.000Z",
    ),
  clientNameSnapshot:
    "Ada Okafor",
  decisionSource:
    "CLIENT_PORTAL",
  clientDecisionChannel:
    "PORTAL",
  evidenceNote:
    "Rejected.",
  recordedByMembershipId:
    null,
  portalGrantId:
    "old-grant-id",
  createdAt:
    new Date(
      "2026-09-10T11:00:00.000Z",
    ),
};

const MEASUREMENT = {
  id:
    "measurement-secret-id",
  businessId:
    "business-1",
  clientId:
    "client-1",
  measuredAt:
    new Date(
      "2026-09-10T08:00:00.000Z",
    ),
  unit:
    "CENTIMETER",
  note:
    "Updated sleeve measurements",
  entries: [
    {
      id:
        "entry-secret-1",
      businessId:
        "business-1",
      measurementVersionId:
        "measurement-secret-id",
      label:
        "Sleeve length",
      normalizedKey:
        "sleeve length",
      value:
        "58",
      createdAt:
        new Date(
          "2026-09-10T08:00:00.000Z",
        ),
    },
    {
      id:
        "entry-secret-2",
      businessId:
        "business-1",
      measurementVersionId:
        "measurement-secret-id",
      label:
        "Arm round",
      normalizedKey:
        "arm round",
      value:
        "31.5",
      createdAt:
        new Date(
          "2026-09-10T08:00:00.000Z",
        ),
    },
  ],
  createdAt:
    new Date(
      "2026-09-10T08:00:00.000Z",
    ),
} as const;

const STYLE_1 = {
  id:
    "style-secret-1",
  businessId:
    "business-1",
  garmentId:
    "garment-1",
  sourceUrl:
    "https://example.com/sleeve-front",
  label:
    "Sleeve front",
  note:
    "Use sleeve shape",
  createdAt:
    new Date(
      "2026-09-10T08:30:00.000Z",
    ),
};

const STYLE_2 = {
  id:
    "style-secret-2",
  businessId:
    "business-1",
  garmentId:
    "garment-1",
  sourceUrl:
    "https://example.com/cuff",
  label:
    "Cuff detail",
  note:
    null,
  createdAt:
    new Date(
      "2026-09-10T08:31:00.000Z",
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
      "proposal-secret-2",
    purpose:
      "DECIDE_CHANGE_PROPOSAL",
    tokenHash:
      "hashed-token",
    expiresAt:
      new Date(
        "2026-09-12T19:00:00.000Z",
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
    activeRequest?:
      typeof CHANGE_REQUEST | null;
    versions?:
      readonly AgreementVersion[];
    resolution?:
      typeof BASELINE_RESOLUTION | null;
    proposals?:
      readonly ChangeProposalVersion[];
    closure?:
      object | null;
    latestDecision?:
      object | null;
    previousDecision?:
      object | null;
    measurementFound?:
      boolean;
    styleTwoFound?:
      boolean;
  } = {},
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
            ? BASELINE_RESOLUTION
            : options.resolution,
        ),
  } as unknown as
    AgreementResolutionRepository;

  const measurementVersionRepository = {
    create:
      vi.fn(),

    findById:
      vi.fn()
        .mockResolvedValue(
          options.measurementFound ===
            false
            ? null
            : MEASUREMENT,
        ),

    listForClient:
      vi.fn(),
  } as unknown as
    MeasurementVersionRepository;

  const styleReferenceRepository = {
    create:
      vi.fn(),

    findById:
      vi.fn(
        async ({
          styleReferenceId,
        }) => {
          if (
            styleReferenceId ===
            "style-secret-1"
          ) {
            return STYLE_1;
          }

          if (
            styleReferenceId ===
              "style-secret-2" &&
            options.styleTwoFound !==
              false
          ) {
            return STYLE_2;
          }

          return null;
        },
      ),

    listForGarment:
      vi.fn(),
  } as unknown as
    StyleReferenceRepository;

  const clientPortalReadRepository = {
    findActiveRequestForGarment:
      vi.fn()
        .mockResolvedValue(
          options.activeRequest ===
            undefined
            ? CHANGE_REQUEST
            : options.activeRequest,
        ),
  } as unknown as
    ClientPortalReadRepository;

  const changeControlHistoryRepository = {
    listRequestsForGarment:
      vi.fn(),

    listProposalsForRequest:
      vi.fn()
        .mockResolvedValue(
          options.proposals ??
            [
              PROPOSAL_1,
              PROPOSAL_2,
            ],
        ),

    findDecisionForProposal:
      vi.fn(
        async ({
          changeProposalVersionId,
        }) => {
          if (
            changeProposalVersionId ===
            PROPOSAL_1.id
          ) {
            return options.previousDecision ===
              undefined
              ? REJECTED_DECISION
              : options.previousDecision;
          }

          return options.latestDecision ??
            null;
        },
      ),

    findClosureForRequest:
      vi.fn()
        .mockResolvedValue(
          options.closure ??
            null,
        ),
  } as unknown as
    ChangeControlHistoryRepository;

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
    measurementVersionRepository,
    styleReferenceRepository,
    clientPortalReadRepository,
    changeControlHistoryRepository,
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
  return getChangeProposalDecisionPortalView(
    deps.clientRepository,
    deps.orderRepository,
    deps.garmentRepository,
    deps.agreementVersionRepository,
    deps.agreementResolutionRepository,
    deps.measurementVersionRepository,
    deps.styleReferenceRepository,
    deps.clientPortalReadRepository,
    deps.changeControlHistoryRepository,
    deps.lifecycleRepository,
    deps.tokenService,
    {
      rawToken:
        "raw-token",
    },
  );
}

describe(
  "getChangeProposalDecisionPortalView",
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
      "returns a narrow client-facing proposal comparison without internal identifiers",
      async () => {
        const deps =
          dependencies();

        const result =
          await execute(
            deps,
          );

        expect(result).toEqual({
          purpose:
            "DECIDE_CHANGE_PROPOSAL",
          clientName:
            "Ada Okafor",
          garmentName:
            "Emerald Gown",
          requestedChange:
            "Please add long sleeves.",
          proposalRevision:
            2,
          rationale:
            "Updated after client feedback.",
          currentAgreement: {
            designSummary:
              "Sleeveless fitted gown",
            fabricDescription:
              "Emerald fabric",
            quantity:
              1,
            priceAmount:
              "80000",
            currency:
              "NGN",
            deliveryDate:
              "2026-10-15",
            note:
              "Original agreement",
          },
          proposedAgreement: {
            designSummary:
              "Long sleeve gown",
            fabricDescription:
              "Emerald fabric",
            quantity:
              1,
            priceAmount:
              "88000",
            currency:
              "NGN",
            deliveryDate:
              "2026-10-17",
            note:
              "Updated proposal",
          },
          selectedMeasurement: {
            measuredAt:
              new Date(
                "2026-09-10T08:00:00.000Z",
              ),
            unit:
              "CENTIMETER",
            note:
              "Updated sleeve measurements",
            entries: [
              {
                label:
                  "Sleeve length",
                value:
                  "58",
              },
              {
                label:
                  "Arm round",
                value:
                  "31.5",
              },
            ],
          },
          selectedStyleReferences: [
            {
              sourceUrl:
                "https://example.com/sleeve-front",
              label:
                "Sleeve front",
              note:
                "Use sleeve shape",
            },
            {
              sourceUrl:
                "https://example.com/cuff",
              label:
                "Cuff detail",
              note:
                null,
            },
          ],
        });

        const serialized =
          JSON.stringify(
            result,
          );

        for (
          const secret
          of [
            "grant-secret-id",
            "agreement-secret-id",
            "request-secret-id",
            "proposal-secret-1",
            "proposal-secret-2",
            "measurement-secret-id",
            "style-secret-1",
            "style-secret-2",
            "membership-secret-id",
          ]
        ) {
          expect(
            serialized,
          ).not.toContain(
            secret,
          );
        }
      },
    );

    it(
      "returns generic unavailable when token discovery fails",
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
      "returns generic unavailable for the wrong grant purpose",
      async () => {
        const deps =
          dependencies({
            portalGrant:
              grant({
                purpose:
                  "REQUEST_CHANGE",
                changeProposalVersionId:
                  null,
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
      "returns generic unavailable when there is no active ChangeRequest",
      async () => {
        const deps =
          dependencies({
            activeRequest:
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
      },
    );

    it(
      "returns generic unavailable when the approved baseline has been replaced",
      async () => {
        const replacement: AgreementVersion = {
          ...AGREEMENT,
          id:
            "replacement-agreement",
          revisionNumber:
            2,
          supersedesAgreementVersionId:
            AGREEMENT.id,
        };

        const deps =
          dependencies({
            versions: [
              AGREEMENT,
              replacement,
            ],
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
      "returns generic unavailable unless the current baseline is approved",
      async () => {
        const deps =
          dependencies({
            resolution: {
              ...BASELINE_RESOLUTION,
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
      "returns generic unavailable when the capability does not target the latest proposal",
      async () => {
        const deps =
          dependencies({
            portalGrant:
              grant({
                changeProposalVersionId:
                  "proposal-secret-1",
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
      "returns generic unavailable when the latest proposal already has a decision",
      async () => {
        const deps =
          dependencies({
            latestDecision: {
              ...REJECTED_DECISION,
              id:
                "latest-decision",
              changeProposalVersionId:
                "proposal-secret-2",
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
      "returns generic unavailable when an earlier proposal was not rejected",
      async () => {
        const deps =
          dependencies({
            previousDecision:
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
      },
    );

    it(
      "returns generic unavailable when the request has been closed",
      async () => {
        const deps =
          dependencies({
            closure: {
              id:
                "closure-secret-id",
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
      "returns generic unavailable when the selected measurement does not resolve",
      async () => {
        const deps =
          dependencies({
            measurementFound:
              false,
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
      "returns generic unavailable when a selected style reference does not resolve",
      async () => {
        const deps =
          dependencies({
            styleTwoFound:
              false,
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
      "does not enter the mutation lifecycle lock while rendering the decision view",
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
