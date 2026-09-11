import type {
  ClientRepository,
} from "../../../client/application/ports/client-repository";
import {
  normalizeAgreementResolutionDetails,
} from "../../../agreement/domain/agreement-resolution";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import {
  calculateAppliedAgreementRevision,
} from "../../domain/applied-change";
import {
  assertClientPortalGrantUsable,
  type ClientPortalGrant,
} from "../../domain/client-portal-grant";
import {
  normalizeChangeProposalDecisionDetails,
} from "../../domain/change-proposal-decision";
import {
  assertChangeRequestActive,
  deriveChangeRequestState,
} from "../../domain/change-request-lifecycle";
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";
import type {
  ClientPortalTokenService,
} from "../ports/client-portal-token-service";

const MAX_PORTAL_TOKEN_LENGTH =
  512;

const PORTAL_UNAVAILABLE_MESSAGE =
  "This portal link is unavailable.";

export type RecordChangeProposalDecisionFromPortalRequest =
  Readonly<{
    rawToken: string;
    outcome: string;
    clientNote?:
      string | null;
  }>;

export type PortalChangeProposalDecisionResult =
  Readonly<{
    decisionId: string;
    outcome:
      | "APPROVED"
      | "REJECTED";
    occurredAt: Date;
    appliedAgreementVersionId:
      string | null;
  }>;

function unavailable():
  never {
  throw new ApplicationError(
    "NOT_FOUND",
    PORTAL_UNAVAILABLE_MESSAGE,
  );
}

function toConflict(
  error: unknown,
): never {
  if (
    error instanceof Error
  ) {
    throw new ApplicationError(
      "CONFLICT",
      error.message,
    );
  }

  throw error;
}

function assertAuthoritativeGrant(
  discovered:
    ClientPortalGrant,
  locked:
    ClientPortalGrant,
  tokenHash: string,
): void {
  if (
    locked.id !==
      discovered.id ||
    locked.businessId !==
      discovered.businessId ||
    locked.clientId !==
      discovered.clientId ||
    locked.orderId !==
      discovered.orderId ||
    locked.garmentId !==
      discovered.garmentId ||
    locked.tokenHash !==
      tokenHash
  ) {
    unavailable();
  }
}

function buildPortalEvidence(
  outcome:
    | "APPROVED"
    | "REJECTED",
  clientNote?:
    string | null,
): string {
  const base =
    outcome === "APPROVED"
      ? "Client approved through the secure portal."
      : "Client rejected through the secure portal.";

  const normalizedNote =
    clientNote
      ?.trim()
      .replace(
        /\s+/g,
        " ",
      ) ?? "";

  if (!normalizedNote) {
    return base;
  }

  return `${base} Client note: ${normalizedNote}`;
}

export async function recordChangeProposalDecisionFromPortal(
  clientRepository:
    ClientRepository,
  changeControlLifecycleRepository:
    ChangeControlLifecycleRepository,
  clientPortalTokenService:
    ClientPortalTokenService,
  request:
    RecordChangeProposalDecisionFromPortalRequest,
): Promise<PortalChangeProposalDecisionResult> {
  if (
    request.rawToken.length ===
      0 ||
    request.rawToken.length >
      MAX_PORTAL_TOKEN_LENGTH
  ) {
    unavailable();
  }

  const tokenHash =
    clientPortalTokenService
      .hashToken(
        request.rawToken,
      );

  const discoveredGrant =
    await changeControlLifecycleRepository
      .findClientPortalGrantByTokenHash(
        tokenHash,
      );

  if (!discoveredGrant) {
    unavailable();
  }

  const discoveredClient =
    await clientRepository.findById({
      businessId:
        discoveredGrant.businessId,
      clientId:
        discoveredGrant.clientId,
    });

  if (!discoveredClient) {
    unavailable();
  }

  return changeControlLifecycleRepository
    .withGarmentLifecycle(
      {
        businessId:
          discoveredGrant.businessId,
        garmentId:
          discoveredGrant.garmentId,
      },
      async (session) => {
        const grant =
          await session
            .findClientPortalGrantById(
              discoveredGrant.id,
            );

        if (!grant) {
          unavailable();
        }

        assertAuthoritativeGrant(
          discoveredGrant,
          grant,
          tokenHash,
        );

        if (
          discoveredClient.id !==
            grant.clientId ||
          discoveredClient.businessId !==
            grant.businessId
        ) {
          unavailable();
        }

        const actionAt =
          new Date();

        try {
          assertClientPortalGrantUsable(
            grant,
            "DECIDE_CHANGE_PROPOSAL",
            actionAt,
          );
        } catch {
          unavailable();
        }

        if (
          !grant
            .changeProposalVersionId
        ) {
          unavailable();
        }

        const activeRequest =
          await session
            .findActiveChangeRequest();

        if (
          !activeRequest ||
          activeRequest.businessId !==
            grant.businessId ||
          activeRequest.clientId !==
            grant.clientId ||
          activeRequest.orderId !==
            grant.orderId ||
          activeRequest.garmentId !==
            grant.garmentId
        ) {
          unavailable();
        }

        const latestAgreement =
          await session
            .findLatestAgreementVersion();

        if (
          !latestAgreement ||
          latestAgreement.id !==
            activeRequest
              .baselineAgreementVersionId ||
          latestAgreement.businessId !==
            grant.businessId ||
          latestAgreement.clientId !==
            grant.clientId ||
          latestAgreement.orderId !==
            grant.orderId ||
          latestAgreement.garmentId !==
            grant.garmentId
        ) {
          unavailable();
        }

        const baselineResolution =
          await session
            .findAgreementResolutionForVersion(
              latestAgreement.id,
            );

        if (
          !baselineResolution ||
          baselineResolution.businessId !==
            grant.businessId ||
          baselineResolution
            .agreementVersionId !==
            latestAgreement.id ||
          baselineResolution.outcome !==
            "APPROVED"
        ) {
          unavailable();
        }

        const latestProposal =
          await session
            .findLatestProposalForRequest(
              activeRequest.id,
            );

        if (
          !latestProposal ||
          latestProposal.id !==
            grant
              .changeProposalVersionId ||
          latestProposal.businessId !==
            grant.businessId ||
          latestProposal.clientId !==
            grant.clientId ||
          latestProposal.orderId !==
            grant.orderId ||
          latestProposal.garmentId !==
            grant.garmentId ||
          latestProposal
            .changeRequestId !==
            activeRequest.id ||
          latestProposal
            .baselineAgreementVersionId !==
            latestAgreement.id
        ) {
          unavailable();
        }

        const existingDecision =
          await session
            .findDecisionForProposal(
              latestProposal.id,
            );

        if (existingDecision) {
          unavailable();
        }

        const closure =
          await session
            .findClosureForRequest(
              activeRequest.id,
            );

        if (closure) {
          unavailable();
        }

        try {
          const state =
            deriveChangeRequestState(
              latestProposal,
              null,
              closure,
            );

          assertChangeRequestActive(
            state,
          );

          if (
            state !==
            "AWAITING_CLIENT"
          ) {
            unavailable();
          }

          const decisionDetails =
            normalizeChangeProposalDecisionDetails({
              outcome:
                request.outcome,
              occurredAt:
                actionAt,
              clientNameSnapshot:
                discoveredClient.name,
              decisionSource:
                "CLIENT_PORTAL",
              clientDecisionChannel:
                "PORTAL",
              evidenceNote:
                buildPortalEvidence(
                  request.outcome ===
                    "APPROVED"
                    ? "APPROVED"
                    : request.outcome ===
                        "REJECTED"
                      ? "REJECTED"
                      : (() => {
                          throw new Error(
                            "Change proposal decision outcome is invalid.",
                          );
                        })(),
                  request.clientNote,
                ),
              proposalCreatedAt:
                latestProposal.createdAt,
              now:
                actionAt,
            });

          if (
            decisionDetails.outcome ===
            "REJECTED"
          ) {
            const decision =
              await session
                .createChangeProposalDecision({
                  businessId:
                    grant.businessId,
                  changeProposalVersionId:
                    latestProposal.id,
                  recordedByMembershipId:
                    null,
                  portalGrantId:
                    grant.id,
                  ...decisionDetails,
                });

            await session
              .consumeClientPortalGrant(
                grant.id,
                actionAt,
              );

            await session
              .revokeOtherDecisionGrantsForProposal(
                latestProposal.id,
                grant.id,
                actionAt,
              );

            return {
              decisionId:
                decision.id,
              outcome:
                "REJECTED",
              occurredAt:
                decision.occurredAt,
              appliedAgreementVersionId:
                null,
            };
          }

          const revision =
            calculateAppliedAgreementRevision(
              latestAgreement,
              baselineResolution.outcome,
              latestProposal,
            );

          const decision =
            await session
              .createChangeProposalDecision({
                businessId:
                  grant.businessId,
                changeProposalVersionId:
                  latestProposal.id,
                recordedByMembershipId:
                  null,
                portalGrantId:
                  grant.id,
                ...decisionDetails,
              });

          await session
            .consumeClientPortalGrant(
              grant.id,
              actionAt,
            );

          await session
            .revokeOtherDecisionGrantsForProposal(
              latestProposal.id,
              grant.id,
              actionAt,
            );

          const agreementVersion =
            await session
              .createAppliedAgreementVersion({
                businessId:
                  grant.businessId,
                clientId:
                  grant.clientId,
                orderId:
                  grant.orderId,
                garmentId:
                  grant.garmentId,
                revisionNumber:
                  revision.revisionNumber,
                supersedesAgreementVersionId:
                  revision
                    .supersedesAgreementVersionId,
                measurementVersionId:
                  latestProposal
                    .measurementVersionId,
                designSummary:
                  latestProposal
                    .designSummary,
                fabricDescription:
                  latestProposal
                    .fabricDescription,
                quantity:
                  latestProposal.quantity,
                priceAmount:
                  latestProposal
                    .priceAmount,
                currency:
                  latestProposal.currency,
                deliveryDate:
                  latestProposal
                    .deliveryDate,
                note:
                  latestProposal.note,
                styleReferenceIds:
                  latestProposal
                    .styleReferenceIds,
              });

          const appliedAt =
            new Date();

          const resolutionDetails =
            normalizeAgreementResolutionDetails({
              outcome:
                "APPROVED",
              occurredAt:
                appliedAt,
              clientNameSnapshot:
                discoveredClient.name,
              clientDecisionChannel:
                "PORTAL",
              evidenceNote:
                decision.evidenceNote,
              agreementCreatedAt:
                agreementVersion.createdAt,
              now:
                appliedAt,
            });

          await session
            .createAppliedAgreementResolution({
              businessId:
                grant.businessId,
              agreementVersionId:
                agreementVersion.id,
              recordedByMembershipId:
                grant
                  .createdByMembershipId,
              ...resolutionDetails,
            });

          await session
            .releaseActiveChangeRequest(
              activeRequest.id,
            );

          return {
            decisionId:
              decision.id,
            outcome:
              "APPROVED",
            occurredAt:
              decision.occurredAt,
            appliedAgreementVersionId:
              agreementVersion.id,
          };
        } catch (error) {
          if (
            error instanceof
              ApplicationError
          ) {
            throw error;
          }

          return toConflict(
            error,
          );
        }
      },
    );
}
