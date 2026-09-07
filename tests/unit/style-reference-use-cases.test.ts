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
  GarmentRepository,
} from "@/garment/application/ports/garment-repository";
import type {
  StyleReferenceRepository,
} from "@/style-reference/application/ports/style-reference-repository";
import {
  createStyleReferenceForTenant,
} from "@/style-reference/application/use-cases/create-style-reference";
import {
  getStyleReferenceForTenant,
} from "@/style-reference/application/use-cases/get-style-reference";
import {
  listStyleReferencesForTenant,
} from "@/style-reference/application/use-cases/list-style-references";
import type {
  StyleReference,
} from "@/style-reference/domain/style-reference";

const BUSINESS_ID =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const ORDER_ID =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const GARMENT_ID =
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const STYLE_REFERENCE_ID =
  "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const TENANT_CONTEXT: TenantContext = {
  userId:
    "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  businessId: BUSINESS_ID,
  membershipId:
    "ffffffff-ffff-4fff-8fff-ffffffffffff",
  role: "OWNER",
};

const STYLE_REFERENCE:
  StyleReference = {
    id: STYLE_REFERENCE_ID,
    businessId: BUSINESS_ID,
    garmentId: GARMENT_ID,
    sourceUrl:
      "https://example.com/styles/gown.jpg",
    label: "Front inspiration",
    note: "Use the neckline shape",
    createdAt:
      new Date(
        "2026-09-07T10:00:00.000Z",
      ),
  };

function createGarmentRepository(
  exists = true,
): GarmentRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(
      exists
        ? {
            id: GARMENT_ID,
            businessId: BUSINESS_ID,
            orderId: ORDER_ID,
            name: "Wedding gown",
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
    ),
  };
}

function createStyleReferenceRepository():
  StyleReferenceRepository {
  return {
    create:
      vi.fn().mockResolvedValue(
        STYLE_REFERENCE,
      ),
    findById:
      vi.fn().mockResolvedValue(
        STYLE_REFERENCE,
      ),
    listForGarment:
      vi.fn().mockResolvedValue([
        STYLE_REFERENCE,
      ]),
  };
}

describe("style reference use cases", () => {
  it("creates a normalized StyleReference only for a Garment in the tenant", async () => {
    const garmentRepository =
      createGarmentRepository();

    const repository =
      createStyleReferenceRepository();

    const result =
      await createStyleReferenceForTenant(
        garmentRepository,
        repository,
        TENANT_CONTEXT,
        {
          garmentId: GARMENT_ID,
          sourceUrl:
            "  https://example.com/styles/gown.jpg  ",
          label:
            "  Front inspiration  ",
          note:
            "  Use the neckline shape  ",
        },
      );

    expect(
      garmentRepository.findById,
    ).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      garmentId: GARMENT_ID,
    });

    expect(
      repository.create,
    ).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      garmentId: GARMENT_ID,
      sourceUrl:
        "https://example.com/styles/gown.jpg",
      label: "Front inspiration",
      note: "Use the neckline shape",
    });

    expect(result)
      .toBe(STYLE_REFERENCE);
  });

  it("does not create a StyleReference for a Garment outside the tenant", async () => {
    const garmentRepository =
      createGarmentRepository(false);

    const repository =
      createStyleReferenceRepository();

    await expect(
      createStyleReferenceForTenant(
        garmentRepository,
        repository,
        TENANT_CONTEXT,
        {
          garmentId: GARMENT_ID,
          sourceUrl:
            "https://example.com/style.jpg",
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<ApplicationError>);

    expect(
      repository.create,
    ).not.toHaveBeenCalled();
  });

  it("gets a StyleReference using the verified Business boundary", async () => {
    const repository =
      createStyleReferenceRepository();

    const result =
      await getStyleReferenceForTenant(
        repository,
        TENANT_CONTEXT,
        {
          styleReferenceId:
            STYLE_REFERENCE_ID,
        },
      );

    expect(
      repository.findById,
    ).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      styleReferenceId:
        STYLE_REFERENCE_ID,
    });

    expect(result)
      .toBe(STYLE_REFERENCE);
  });

  it("returns NOT_FOUND when a StyleReference is unavailable in the tenant", async () => {
    const repository =
      createStyleReferenceRepository();

    vi.mocked(
      repository.findById,
    ).mockResolvedValue(null);

    await expect(
      getStyleReferenceForTenant(
        repository,
        TENANT_CONTEXT,
        {
          styleReferenceId:
            STYLE_REFERENCE_ID,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<ApplicationError>);
  });

  it("lists StyleReferences only after validating the Garment in the tenant", async () => {
    const garmentRepository =
      createGarmentRepository();

    const repository =
      createStyleReferenceRepository();

    const result =
      await listStyleReferencesForTenant(
        garmentRepository,
        repository,
        TENANT_CONTEXT,
        {
          garmentId: GARMENT_ID,
        },
      );

    expect(
      repository.listForGarment,
    ).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      garmentId: GARMENT_ID,
    });

    expect(result).toEqual([
      STYLE_REFERENCE,
    ]);
  });

  it("does not list StyleReferences for a Garment outside the tenant", async () => {
    const garmentRepository =
      createGarmentRepository(false);

    const repository =
      createStyleReferenceRepository();

    await expect(
      listStyleReferencesForTenant(
        garmentRepository,
        repository,
        TENANT_CONTEXT,
        {
          garmentId: GARMENT_ID,
        },
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<ApplicationError>);

    expect(
      repository.listForGarment,
    ).not.toHaveBeenCalled();
  });
});
