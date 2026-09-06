import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import {
  normalizeClientDetails,
  type Client,
} from "../../domain/client";
import type {
  ClientRepository,
} from "../ports/client-repository";

export type CreateClientRequest = Readonly<{
  name: string;
  phone: string;
  email?: string | null;
}>;

export async function createClientForTenant(
  clientRepository: ClientRepository,
  tenantContext: TenantContext,
  request: CreateClientRequest,
): Promise<Client> {
  const details =
    normalizeClientDetails(request);

  return clientRepository.create({
    businessId: tenantContext.businessId,
    ...details,
  });
}
