import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ClientPortalGrantReadRepository,
} from "../../src/change-control/application/ports/client-portal-grant-read-repository";
import {
  listOutstandingClientPortalGrantsForTenant,
} from "../../src/change-control/application/use-cases/list-outstanding-client-portal-grants";
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
      "2026-09-11T10:00:00.000Z",
    ),
  updatedAt:
    new Date(
      "2026-09-11T10:00:00.000Z",
    ),
};

function garmentRepositoryReturning(
  garment:
    typeof GARMENT | null,
): GarmentRepository {
  return {
    create:
      vi.fn(),
    findById:
      vi.fn(
        async () =>
          garment,
      ),
  };
}

function grantReadRepositoryReturning(
  records:
    Parameters<
      ClientPortalGrantReadRepository[
        "listOutstandingForGarment"
      ]
    > extends never
      ? never
      : Awaited<
          ReturnType<
            ClientPortalGrantReadRepository[
              "listOutstandingForGarment"
            ]
          >
        >,
): ClientPortalGrantReadRepository {
  return {
    listOutstandingForGarment:
      vi.fn(
        async () =>
          records,
      ),
  };
}

describe(
  "listOutstandingClientPortalGrantsForTenant",
  () => {
    it(
      "returns only safe outstanding grant metadata for the current garment",
      async () => {
        const readRepository =
          grantReadRepositoryReturning([
            {
              id:
                "grant-2",
              businessId:
                "business-1",
              garmentId:
                "garment-1",
              purpose:
                "DECIDE_CHANGE_PROPOSAL",
              changeProposalVersionId:
                "proposal-1",
              expiresAt:
                new Date(
                  "2026-09-12T12:00:00.000Z",
                ),
              createdAt:
                new Date(
                  "2026-09-11T12:00:00.000Z",
                ),
            },
            {
              id:
                "grant-1",
              businessId:
                "business-1",
              garmentId:
                "garment-1",
              purpose:
                "REQUEST_CHANGE",
              changeProposalVersionId:
                null,
              expiresAt:
                new Date(
                  "2026-09-12T10:00:00.000Z",
                ),
              createdAt:
                new Date(
                  "2026-09-11T10:00:00.000Z",
                ),
            },
          ]);

        const result =
          await listOutstandingClientPortalGrantsForTenant(
            garmentRepositoryReturning(
              GARMENT,
            ),
            readRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          );

        expect(result).toEqual([
          {
            id:
              "grant-2",
            purpose:
              "DECIDE_CHANGE_PROPOSAL",
            changeProposalVersionId:
              "proposal-1",
            expiresAt:
              new Date(
                "2026-09-12T12:00:00.000Z",
              ),
            createdAt:
              new Date(
                "2026-09-11T12:00:00.000Z",
              ),
          },
          {
            id:
              "grant-1",
            purpose:
              "REQUEST_CHANGE",
            changeProposalVersionId:
              null,
            expiresAt:
              new Date(
                "2026-09-12T10:00:00.000Z",
              ),
            createdAt:
              new Date(
                "2026-09-11T10:00:00.000Z",
              ),
          },
        ]);

        expect(
          Object.keys(
            result[0],
          ).sort(),
        ).toEqual([
          "changeProposalVersionId",
          "createdAt",
          "expiresAt",
          "id",
          "purpose",
        ]);

        expect(
          readRepository
            .listOutstandingForGarment,
        ).toHaveBeenCalledWith({
          businessId:
            "business-1",
          garmentId:
            "garment-1",
        });
      },
    );

    it(
      "does not query grant metadata when the garment is inaccessible",
      async () => {
        const readRepository =
          grantReadRepositoryReturning(
            [],
          );

        await expect(
          listOutstandingClientPortalGrantsForTenant(
            garmentRepositoryReturning(
              null,
            ),
            readRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          readRepository
            .listOutstandingForGarment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects a garment returned outside the tenant boundary",
      async () => {
        const readRepository =
          grantReadRepositoryReturning(
            [],
          );

        await expect(
          listOutstandingClientPortalGrantsForTenant(
            garmentRepositoryReturning({
              ...GARMENT,
              businessId:
                "business-2",
            }),
            readRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });

        expect(
          readRepository
            .listOutstandingForGarment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects grant metadata returned outside the requested garment scope",
      async () => {
        const readRepository =
          grantReadRepositoryReturning([
            {
              id:
                "grant-foreign",
              businessId:
                "business-1",
              garmentId:
                "garment-2",
              purpose:
                "REQUEST_CHANGE",
              changeProposalVersionId:
                null,
              expiresAt:
                new Date(
                  "2026-09-12T10:00:00.000Z",
                ),
              createdAt:
                new Date(
                  "2026-09-11T10:00:00.000Z",
                ),
            },
          ]);

        await expect(
          listOutstandingClientPortalGrantsForTenant(
            garmentRepositoryReturning(
              GARMENT,
            ),
            readRepository,
            TENANT,
            {
              garmentId:
                "garment-1",
            },
          ),
        ).rejects.toMatchObject({
          code:
            "NOT_FOUND",
        });
      },
    );
  },
);
