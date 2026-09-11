import {
  createChangeRequestFromPortal,
  type CreateChangeRequestFromPortalRequest,
} from "../application/use-cases/create-change-request-from-portal";
import type {
  ChangeRequest,
} from "../domain/change-request";
import {
  nodeClientPortalTokenService,
} from "../infrastructure/node-client-portal-token-service";
import {
  prismaChangeControlLifecycleRepository,
} from "../infrastructure/prisma-change-control-lifecycle-repository";

export async function createChangeRequestFromPublicPortal(
  request:
    CreateChangeRequestFromPortalRequest,
): Promise<ChangeRequest> {
  return createChangeRequestFromPortal(
    prismaChangeControlLifecycleRepository,
    nodeClientPortalTokenService,
    request,
  );
}
