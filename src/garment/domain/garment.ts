export type GarmentDetails = Readonly<{
  name: string;
}>;

export type Garment = Readonly<{
  id: string;
  businessId: string;
  orderId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export type NormalizeGarmentDetailsInput =
  Readonly<{
    name: string;
  }>;

export type CreateGarmentInput =
  NormalizeGarmentDetailsInput &
    Readonly<{
      id: string;
      businessId: string;
      orderId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;

export function normalizeGarmentDetails(
  input: NormalizeGarmentDetailsInput,
): GarmentDetails {
  const name = input.name.trim();

  if (!name) {
    throw new Error(
      "Garment name is required.",
    );
  }

  return {
    name,
  };
}

export function createGarment(
  input: CreateGarmentInput,
): Garment {
  const details =
    normalizeGarmentDetails(input);

  return {
    id: input.id,
    businessId: input.businessId,
    orderId: input.orderId,
    ...details,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
