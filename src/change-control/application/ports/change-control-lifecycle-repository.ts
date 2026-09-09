import type {
  AgreementResolution,
  AgreementResolutionDetails,
} from "../../../agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
  AgreementVersionDetails,
} from "../../../agreement/domain/agreement-version";
import type {
  ChangeProposalDecision,
  ChangeProposalDecisionDetails,
} from "../../domain/change-proposal-decision";
import type {
  ChangeProposalVersion,
  ChangeProposalVersionDetails,
} from "../../domain/change-proposal-version";
import type {
  ChangeRequest,
  ChangeRequestDetails,
} from "../../domain/change-request";
import type {
  ChangeRequestClosure,
  ChangeRequestClosureDetails,
} from "../../domain/change-request-lifecycle";

export type ChangeControlLifecycleScope =
  Readonly<{
    businessId: string;
    garmentId: string;
  }>;

export type CreateChangeRequestData =
  ChangeRequestDetails &
    Readonly<{
      businessId: string;
      clientId: string;
      orderId: string;
      garmentId: string;
      baselineAgreementVersionId:
        string;
      recordedByMembershipId:
        string | null;
    }>;

export type CreateChangeProposalVersionData =
  ChangeProposalVersionDetails &
    Readonly<{
      businessId: string;
      changeRequestId: string;
      clientId: string;
      orderId: string;
      garmentId: string;
      baselineAgreementVersionId:
        string;
      revisionNumber: number;
      supersedesChangeProposalVersionId:
        string | null;
      createdByMembershipId:
        string;
    }>;

export type CreateChangeProposalDecisionData =
  ChangeProposalDecisionDetails &
    Readonly<{
      businessId: string;
      changeProposalVersionId:
        string;
      recordedByMembershipId:
        string | null;
      portalGrantId:
        string | null;
    }>;

export type CreateAppliedAgreementVersionData =
  AgreementVersionDetails &
    Readonly<{
      businessId: string;
      clientId: string;
      orderId: string;
      garmentId: string;
      revisionNumber: number;
      supersedesAgreementVersionId:
        string;
    }>;

export type CreateAppliedAgreementResolutionData =
  AgreementResolutionDetails &
    Readonly<{
      businessId: string;
      agreementVersionId: string;
      recordedByMembershipId:
        string;
    }>;

export type CreateChangeRequestClosureData =
  ChangeRequestClosureDetails &
    Readonly<{
      businessId: string;
      changeRequestId: string;
      recordedByMembershipId:
        string;
    }>;

export interface ChangeControlLifecycleSession {
  findLatestAgreementVersion():
    Promise<AgreementVersion | null>;

  findAgreementResolutionForVersion(
    agreementVersionId: string,
  ): Promise<AgreementResolution | null>;

  findActiveChangeRequest():
    Promise<ChangeRequest | null>;

  findLatestProposalForRequest(
    changeRequestId: string,
  ): Promise<ChangeProposalVersion | null>;

  findDecisionForProposal(
    changeProposalVersionId: string,
  ): Promise<ChangeProposalDecision | null>;

  findClosureForRequest(
    changeRequestId: string,
  ): Promise<ChangeRequestClosure | null>;

  createChangeRequest(
    data: CreateChangeRequestData,
  ): Promise<ChangeRequest>;

  createChangeProposalVersion(
    data:
      CreateChangeProposalVersionData,
  ): Promise<ChangeProposalVersion>;

  createChangeProposalDecision(
    data:
      CreateChangeProposalDecisionData,
  ): Promise<ChangeProposalDecision>;

  createAppliedAgreementVersion(
    data:
      CreateAppliedAgreementVersionData,
  ): Promise<AgreementVersion>;

  createAppliedAgreementResolution(
    data:
      CreateAppliedAgreementResolutionData,
  ): Promise<AgreementResolution>;

  createChangeRequestClosure(
    data:
      CreateChangeRequestClosureData,
  ): Promise<ChangeRequestClosure>;
}

export interface ChangeControlLifecycleRepository {
  withGarmentLifecycle<T>(
    scope:
      ChangeControlLifecycleScope,
    operation: (
      session:
        ChangeControlLifecycleSession,
    ) => Promise<T>,
  ): Promise<T>;
}
