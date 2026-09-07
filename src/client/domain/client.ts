export type ClientDetails = Readonly<{
  name: string;
  phone: string;
  email: string | null;
}>;

export type Client = Readonly<{
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type NormalizeClientDetailsInput = Readonly<{
  name: string;
  phone: string;
  email?: string | null;
}>;

export type CreateClientInput =
  NormalizeClientDetailsInput &
    Readonly<{
      id: string;
      businessId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;

export function normalizeClientDetails(
  input: NormalizeClientDetailsInput,
): ClientDetails {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email =
    input.email?.trim() || null;

  if (!name) {
    throw new Error(
      "Client name is required.",
    );
  }

  if (!phone) {
    throw new Error(
      "Client phone is required.",
    );
  }

  return {
    name,
    phone,
    email,
  };
}

export function createClient(
  input: CreateClientInput,
): Client {
  const details =
    normalizeClientDetails(input);

  return {
    id: input.id,
    businessId: input.businessId,
    ...details,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
