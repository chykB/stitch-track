import {
  getRequestChangePortalView,
  type GetRequestChangePortalViewRequest,
  type RequestChangePortalView,
} from "../application/use-cases/get-request-change-portal-view";
import {
  prismaAgreementResolutionRepository,
} from "../../agreement/infrastructure/prisma-agreement-resolution-repository";
import {
  prismaAgreementVersionRepository,
} from "../../agreement/infrastructure/prisma-agreement-version-repository";
import {
  prismaClientRepository,
} from "../../client/infrastructure/prisma-client-repository";
import {
  prismaGarmentRepository,
} from "../../garment/infrastructure/prisma-garment-repository";
import {
  prismaOrderRepository,
} from "../../order/infrastructure/prisma-order-repository";
import {
  nodeClientPortalTokenService,
} from "../infrastructure/node-client-portal-token-service";
import {
  prismaChangeControlLifecycleRepository,
} from "../infrastructure/prisma-change-control-lifecycle-repository";
import {
  prismaClientPortalReadRepository,
} from "../infrastructure/prisma-client-portal-read-repository";

export async function getRequestChangePublicPortalView(
  request:
    GetRequestChangePortalViewRequest,
): Promise<RequestChangePortalView> {
  return getRequestChangePortalView(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaAgreementVersionRepository,
    prismaAgreementResolutionRepository,
    prismaClientPortalReadRepository,
    prismaChangeControlLifecycleRepository,
    nodeClientPortalTokenService,
    request,
  );
}
