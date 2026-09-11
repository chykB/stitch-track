import type {
  ChangeProposalDecision,
} from "../../domain/change-proposal-decision";
import type {
  ChangeProposalVersion,
} from "../../domain/change-proposal-version";
import type {
  ChangeRequest,
} from "../../domain/change-request";
import type {
  ChangeRequestClosure,
} from "../../domain/change-request-lifecycle";

export type ListChangeRequestsForGarment =
  Readonly<{
    businessId: string;
    garmentId: string;
  }>;

export type ListChangeProposalsForRequest =
  Readonly<{
    businessId: string;
    changeRequestId: string;
  }>;

export type FindChangeProposalDecision =
  Readonly<{
    businessId: string;
    changeProposalVersionId:
      string;
  }>;

export type FindChangeRequestClosure =
  Readonly<{
    businessId: string;
    changeRequestId: string;
  }>;

export interface ChangeControlHistoryRepository {
  listRequestsForGarment(
    lookup:
      ListChangeRequestsForGarment,
  ): Promise<readonly ChangeRequest[]>;

  listProposalsForRequest(
    lookup:
      ListChangeProposalsForRequest,
  ): Promise<
    readonly ChangeProposalVersion[]
  >;

  findDecisionForProposal(
    lookup:
      FindChangeProposalDecision,
  ): Promise<
    ChangeProposalDecision | null
  >;

  findClosureForRequest(
    lookup:
      FindChangeRequestClosure,
  ): Promise<
    ChangeRequestClosure | null
  >;
}
