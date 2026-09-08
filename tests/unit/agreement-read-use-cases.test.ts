import {
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
import {
  getAgreementVersionForTenant,
} from "../../src/agreement/application/use-cases/get-agreement-version";
import {
  listAgreementHistoryForTenant,
} from "../../src/agreement/application/use-cases/list-agreement-history";
import type {
  AgreementResolution,
} from "../../src/agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../src/agreement/domain/agreement-version";
import type {
  GarmentRepository,
} from "../../src/garment/application/ports/garment-repository";
import type {
  TenantContext,
} from "../../src/shared/application/tenancy/tenant-context";

const TENANT:
  TenantContext = {
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
      "2026-09-01T10:00:00.000Z",
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
      null,
    designSummary:
      `Proposal ${revisionNumber}`,
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
      revisionNumber === 1
        ? null
        : `agreement-${revisionNumber - 1}`,
    createdAt:
      new Date(
        `2026-09-0${revisionNumber}T10:00:00.000Z`,
      ),
  };
}

function resolution(
  agreementVersionId: string,
): AgreementResolution {
  return {
    id:
      `resolution-${agreementVersionId}`,
    businessId:
      "business-1",
    agreementVersionId,
    outcome:
      "REJECTED",
    occurredAt:
      new Date(
        "2026-09-08T11:00:00.000Z",
      ),
    clientNameSnapshot:
      "Ada Okafor",
    clientDecisionChannel:
      "WHATSAPP",
    evidenceNote:
      "Client declined proposal.",
    recordedByMembershipId:
      "membership-1",
    createdAt:
      new Date(
        "2026-09-08T11:01:00.000Z",
      ),
  };
}

describe(
  "agreement read use cases",
  () => {
    it(
      "gets an AgreementVersion using the current Business scope",
      async () => {
        const repository = {
          findById:
            vi.fn()
              .mockResolvedValue(
                version(1),
              ),
          listForGarment:
            vi.fn(),
        } as unknown as
          AgreementVersionRepository;

        const result =
          await getAgreementVersionForTenant(
            repository,
            TENANT,
            {
              agreementVersionId:
                "agreement-1",
            },
          );

        expect(
          repository.findById,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          agreementVersionId:
            "agreement-1",
        });

        expect(result.id)
          .toBe(
            "agreement-1",
          );
      },
    );

    it(
      "returns NOT_FOUND when an AgreementVersion is unavailable to the Business",
      async () => {
        const repository = {
          findById:
            vi.fn()
              .mockResolvedValue(
                null,
              ),
          listForGarment:
            vi.fn(),
        } as unknown as
          AgreementVersionRepository;

        await expect(
          getAgreementVersionForTenant(
            repository,
            TENANT,
            {
              agreementVersionId:
                "agreement-foreign",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });
      },
    );

    it(
      "lists versions in revision order with their immutable resolutions",
      async () => {
        const versions = [
          version(2),
          version(1),
          version(3),
        ];

        const versionRepository = {
          findById:
            vi.fn(),
          listForGarment:
            vi.fn()
              .mockResolvedValue(
                versions,
              ),
        } as unknown as
          AgreementVersionRepository;

        const resolutionRepository = {
          findForVersion:
            vi.fn(
              async ({
                agreementVersionId,
              }) =>
                agreementVersionId ===
                "agreement-3"
                  ? null
                  : resolution(
                      agreementVersionId,
                    ),
            ),
        } as unknown as
          AgreementResolutionRepository;

        const garmentRepository = {
          findById:
            vi.fn()
              .mockResolvedValue(
                GARMENT,
              ),
        } as unknown as
          GarmentRepository;

        const result =
          await listAgreementHistoryForTenant(
            garmentRepository,
            versionRepository,
            resolutionRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          );

        expect(
          result.map(
            (entry) =>
              entry.version
                .revisionNumber,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          result[0]
            .resolution
            ?.outcome,
        ).toBe(
          "REJECTED",
        );

        expect(
          result[2]
            .resolution,
        ).toBeNull();

        expect(
          versionRepository
            .listForGarment,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          garmentId:
            "garment-1",
        });
      },
    );

    it(
      "returns NOT_FOUND before reading history when the Garment is unavailable",
      async () => {
        const garmentRepository = {
          findById:
            vi.fn()
              .mockResolvedValue(
                null,
              ),
        } as unknown as
          GarmentRepository;

        const versionRepository = {
          findById:
            vi.fn(),
          listForGarment:
            vi.fn(),
        } as unknown as
          AgreementVersionRepository;

        const resolutionRepository = {
          findForVersion:
            vi.fn(),
        } as unknown as
          AgreementResolutionRepository;

        await expect(
          listAgreementHistoryForTenant(
            garmentRepository,
            versionRepository,
            resolutionRepository,
            TENANT,
            {
              garmentId:
                "garment-foreign",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          versionRepository
            .listForGarment,
        ).not.toHaveBeenCalled();

        expect(
          resolutionRepository
            .findForVersion,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "returns empty history without unnecessary resolution reads",
      async () => {
        const garmentRepository = {
          findById:
            vi.fn()
              .mockResolvedValue(
                GARMENT,
              ),
        } as unknown as
          GarmentRepository;

        const versionRepository = {
          findById:
            vi.fn(),
          listForGarment:
            vi.fn()
              .mockResolvedValue(
                [],
              ),
        } as unknown as
          AgreementVersionRepository;

        const resolutionRepository = {
          findForVersion:
            vi.fn(),
        } as unknown as
          AgreementResolutionRepository;

        const result =
          await listAgreementHistoryForTenant(
            garmentRepository,
            versionRepository,
            resolutionRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          );

        expect(result)
          .toEqual([]);

        expect(
          resolutionRepository
            .findForVersion,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
