import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ApplicationError,
} from "@/shared/application/errors/application-error";
import type {
  TenantContext,
} from "@/shared/application/tenancy/tenant-context";
import type {
  ClientRepository,
} from "@/client/application/ports/client-repository";
import type {
  MeasurementVersionRepository,
} from "@/measurement/application/ports/measurement-version-repository";
import {
  createMeasurementVersionForTenant,
} from "@/measurement/application/use-cases/create-measurement-version";
import {
  getMeasurementVersionForTenant,
} from "@/measurement/application/use-cases/get-measurement-version";
import {
  listMeasurementVersionsForTenant,
} from "@/measurement/application/use-cases/list-measurement-versions";
import type {
  MeasurementVersion,
} from "@/measurement/domain/measurement";

const BUSINESS_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const CLIENT_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const VERSION_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const ENTRY_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const TENANT_CONTEXT: TenantContext = {
  userId:
    "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  businessId: BUSINESS_ID,
  membershipId:
    "ffffffff-ffff-4fff-8fff-ffffffffffff",
  role: "OWNER",
};

const MEASUREMENT_VERSION:
  MeasurementVersion = {
    id: VERSION_ID,
    businessId: BUSINESS_ID,
    clientId: CLIENT_ID,
    measuredAt:
      new Date(
        "2026-09-07T10:00:00.000Z",
      ),
    unit: "CENTIMETER",
    note: "Before cutting",
    entries: [
      {
        id: ENTRY_ID,
        businessId: BUSINESS_ID,
        measurementVersionId:
          VERSION_ID,
        label: "Waist",
        normalizedKey: "waist",
        value: "80.5",
        createdAt:
          new Date(
            "2026-09-07T10:01:00.000Z",
          ),
      },
    ],
    createdAt:
      new Date(
        "2026-09-07T10:01:00.000Z",
      ),
  };

function createClientRepository(
  exists = true,
): ClientRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(
      exists
        ? {
            id: CLIENT_ID,
            businessId: BUSINESS_ID,
            name: "Ada",
            phone: "08000000000",
            email: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
    ),
  };
}

function createMeasurementRepository():
  MeasurementVersionRepository {
  return {
    create:
      vi.fn().mockResolvedValue(
        MEASUREMENT_VERSION,
      ),
    findById:
      vi.fn().mockResolvedValue(
        MEASUREMENT_VERSION,
      ),
    listForClient:
      vi.fn().mockResolvedValue([
        MEASUREMENT_VERSION,
      ]),
  };
}

describe("measurement use cases", () => {
  it("creates normalized measurement history only for a Client in the tenant", async () => {
    const clientRepository =
      createClientRepository();

    const repository =
      createMeasurementRepository();

    const result =
      await createMeasurementVersionForTenant(
        clientRepository,
        repository,
        TENANT_CONTEXT,
        {
          clientId: CLIENT_ID,
          measuredAt:
            new Date(
              "2026-09-07T10:00:00.000Z",
            ),
          unit: "CENTIMETER",
          note: "  Before cutting  ",
          entries: [
            {
              label: " Waist ",
              value: "080.500",
            },
          ],
        },
      );

    expect(
      clientRepository.findById,
    ).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      clientId: CLIENT_ID,
    });

    expect(
      repository.create,
    ).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      clientId: CLIENT_ID,
      measuredAt:
        new Date(
          "2026-09-07T10:00:00.000Z",
        ),
      unit: "CENTIMETER",
      note: "Before cutting",
      entries: [
        {
          label: "Waist",
          normalizedKey: "waist",
          value: "80.5",
        },
      ],
    });

    expect(result)
      .toBe(MEASUREMENT_VERSION);
  });

  it("does not create measurement history for a Client outside the tenant", async () => {
    const clientRepository =
      createClientRepository(false);

    const repository =
      createMeasurementRepository();

    await expect(
      createMeasurementVersionForTenant(
        clientRepository,
        repository,
        TENANT_CONTEXT,
        {
          clientId: CLIENT_ID,
          measuredAt: new Date(),
          unit: "INCH",
          entries: [
            {
              label: "Waist",
              value: "32",
            },
          ],
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<ApplicationError>);

    expect(
      repository.create,
    ).not.toHaveBeenCalled();
  });

  it("gets a MeasurementVersion using the verified Business boundary", async () => {
    const repository =
      createMeasurementRepository();

    const result =
      await getMeasurementVersionForTenant(
        repository,
        TENANT_CONTEXT,
        {
          measurementVersionId:
            VERSION_ID,
        },
      );

    expect(
      repository.findById,
    ).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      measurementVersionId:
        VERSION_ID,
    });

    expect(result)
      .toBe(MEASUREMENT_VERSION);
  });

  it("returns NOT_FOUND when a MeasurementVersion is unavailable in the tenant", async () => {
    const repository =
      createMeasurementRepository();

    vi.mocked(
      repository.findById,
    ).mockResolvedValue(null);

    await expect(
      getMeasurementVersionForTenant(
        repository,
        TENANT_CONTEXT,
        {
          measurementVersionId:
            VERSION_ID,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<ApplicationError>);
  });

  it("lists measurement history only after validating the Client in the tenant", async () => {
    const clientRepository =
      createClientRepository();

    const repository =
      createMeasurementRepository();

    const result =
      await listMeasurementVersionsForTenant(
        clientRepository,
        repository,
        TENANT_CONTEXT,
        {
          clientId: CLIENT_ID,
        },
      );

    expect(
      repository.listForClient,
    ).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      clientId: CLIENT_ID,
    });

    expect(result).toEqual([
      MEASUREMENT_VERSION,
    ]);
  });

  it("does not list history for a Client outside the tenant", async () => {
    const clientRepository =
      createClientRepository(false);

    const repository =
      createMeasurementRepository();

    await expect(
      listMeasurementVersionsForTenant(
        clientRepository,
        repository,
        TENANT_CONTEXT,
        {
          clientId: CLIENT_ID,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<ApplicationError>);

    expect(
      repository.listForClient,
    ).not.toHaveBeenCalled();
  });
});
