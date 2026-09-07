import {
  createClientForTenant,
  type CreateClientRequest,
} from "../application/use-cases/create-client";
import type {
  Client,
} from "../domain/client";
import {
  prismaClientRepository,
} from "../infrastructure/prisma-client-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";

export async function createClientForCurrentTenant(
  requestedBusinessId: string,
  request: CreateClientRequest,
): Promise<Client> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  return createClientForTenant(
    prismaClientRepository,
    tenantContext,
    request,
  );
}
