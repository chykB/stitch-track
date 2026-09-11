import {
  recordChangeProposalDecisionFromPortal,
  type PortalChangeProposalDecisionResult,
  type RecordChangeProposalDecisionFromPortalRequest,
} from "../application/use-cases/record-change-proposal-decision-from-portal";
import {
  prismaChangeControlLifecycleRepository,
} from "../infrastructure/prisma-change-control-lifecycle-repository";
import {
  nodeClientPortalTokenService,
} from "../infrastructure/node-client-portal-token-service";
import {
  prismaClientRepository,
} from "../../client/infrastructure/prisma-client-repository";

export async function recordChangeProposalDecisionFromPublicPortal(
  request:
    RecordChangeProposalDecisionFromPortalRequest,
): Promise<PortalChangeProposalDecisionResult> {
  return recordChangeProposalDecisionFromPortal(
    prismaClientRepository,
    prismaChangeControlLifecycleRepository,
    nodeClientPortalTokenService,
    request,
  );
}
