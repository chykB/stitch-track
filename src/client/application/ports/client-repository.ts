import type {
  Client,
  ClientDetails,
} from "../../domain/client";

export type CreateClientData =
  ClientDetails &
    Readonly<{
      businessId: string;
    }>;

export type FindClientById = Readonly<{
  businessId: string;
  clientId: string;
}>;

export interface ClientRepository {
  create(
    data: CreateClientData,
  ): Promise<Client>;

  findById(
    lookup: FindClientById,
  ): Promise<Client | null>;
}
