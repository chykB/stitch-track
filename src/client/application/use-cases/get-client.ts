import { ApplicationError } from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  Client,
} from "../../domain/client";
import type {
  ClientRepository,
} from "../ports/client-repository";

export type GetClientRequest = Readonly<{
  clientId: string;
}>;

export async function getClientForTenant(
  clientRepository: ClientRepository,
  tenantContext: TenantContext,
  request: GetClientRequest,
): Promise<Client> {
  const client =
    await clientRepository.findById({
      businessId: tenantContext.businessId,
      clientId: request.clientId,
    });

  if (!client) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Client was not found in the current business.",
    );
  }

  return client;
}
