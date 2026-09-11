import {
  getChangeProposalDecisionPortalView,
  type ChangeProposalDecisionPortalView,
  type GetChangeProposalDecisionPortalViewRequest,
} from "../application/use-cases/get-change-proposal-decision-portal-view";
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
  prismaMeasurementVersionRepository,
} from "../../measurement/infrastructure/prisma-measurement-version-repository";
import {
  prismaOrderRepository,
} from "../../order/infrastructure/prisma-order-repository";
import {
  prismaStyleReferenceRepository,
} from "../../style-reference/infrastructure/prisma-style-reference-repository";
import {
  prismaChangeControlHistoryRepository,
} from "../infrastructure/prisma-change-control-history-repository";
import {
  prismaChangeControlLifecycleRepository,
} from "../infrastructure/prisma-change-control-lifecycle-repository";
import {
  prismaClientPortalReadRepository,
} from "../infrastructure/prisma-client-portal-read-repository";
import {
  nodeClientPortalTokenService,
} from "../infrastructure/node-client-portal-token-service";

export async function getChangeProposalDecisionPublicPortalView(
  request:
    GetChangeProposalDecisionPortalViewRequest,
): Promise<ChangeProposalDecisionPortalView> {
  return getChangeProposalDecisionPortalView(
    prismaClientRepository,
    prismaOrderRepository,
    prismaGarmentRepository,
    prismaAgreementVersionRepository,
    prismaAgreementResolutionRepository,
    prismaMeasurementVersionRepository,
    prismaStyleReferenceRepository,
    prismaClientPortalReadRepository,
    prismaChangeControlHistoryRepository,
    prismaChangeControlLifecycleRepository,
    nodeClientPortalTokenService,
    request,
  );
}
