import type {
  AgreementResolutionRepository,
} from "../../../agreement/application/ports/agreement-resolution-repository";
import type {
  AgreementVersionRepository,
} from "../../../agreement/application/ports/agreement-version-repository";
import type {
  AgreementResolution,
} from "../../../agreement/domain/agreement-resolution";
import type {
  AgreementVersion,
} from "../../../agreement/domain/agreement-version";
import type {
  GarmentRepository,
} from "../../../garment/application/ports/garment-repository";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  TenantContext,
} from "../../../shared/application/tenancy/tenant-context";
import type {
  ChangeProposalDecision,
} from "../../domain/change-proposal-decision";
import type {
  ChangeProposalVersion,
} from "../../domain/change-proposal-version";
import type {
  ChangeRequest,
} from "../../domain/change-request";
import {
  deriveChangeRequestState,
  isAppliedAgreementForProposal,
  type ChangeRequestClosure,
  type ChangeRequestState,
} from "../../domain/change-request-lifecycle";
import type {
  ChangeControlHistoryRepository,
} from "../ports/change-control-history-repository";

export type AgreementHistoryEvidence =
  Readonly<{
    version:
      AgreementVersion;
    resolution:
      AgreementResolution;
  }>;

export type ChangeProposalHistoryEntry =
  Readonly<{
    proposal:
      ChangeProposalVersion;
    decision:
      ChangeProposalDecision | null;
  }>;

export type ChangeRequestHistoryEntry =
  Readonly<{
    request:
      ChangeRequest;
    baseline:
      AgreementHistoryEvidence;
    proposals:
      readonly ChangeProposalHistoryEntry[];
    closure:
      ChangeRequestClosure | null;
    appliedAgreement:
      AgreementHistoryEvidence | null;
    state:
      ChangeRequestState;
  }>;

export type ChangeControlHistory =
  Readonly<{
    currentApprovedBaseline:
      AgreementHistoryEvidence | null;
    requests:
      readonly ChangeRequestHistoryEntry[];
  }>;

export type GetChangeControlHistoryRequest =
  Readonly<{
    garmentId: string;
  }>;

function historyConflict(
  message: string,
): never {
  throw new ApplicationError(
    "CONFLICT",
    message,
  );
}

function inaccessibleHistory():
  never {
  throw new ApplicationError(
    "NOT_FOUND",
    "Change-control history was not found for this garment.",
  );
}

function assertProposalChain(
  proposals:
    readonly ChangeProposalVersion[],
): void {
  proposals.forEach(
    (proposal, index) => {
      const expectedRevision =
        index + 1;

      const expectedSupersedes =
        index === 0
          ? null
          : proposals[index - 1].id;

      if (
        proposal.revisionNumber !==
          expectedRevision ||
        proposal
          .supersedesChangeProposalVersionId !==
          expectedSupersedes
      ) {
        historyConflict(
          "Change proposal revision history is inconsistent.",
        );
      }
    },
  );
}

function assertProposalDecisionChain(
  proposals:
    readonly ChangeProposalHistoryEntry[],
): void {
  for (
    let index = 0;
    index < proposals.length - 1;
    index += 1
  ) {
    const decision =
      proposals[index].decision;

    if (
      !decision ||
      decision.outcome !==
        "REJECTED"
    ) {
      historyConflict(
        "A later change proposal requires the preceding proposal to have been rejected.",
      );
    }
  }
}

export async function getChangeControlHistoryForTenant(
  garmentRepository:
    GarmentRepository,
  agreementVersionRepository:
    AgreementVersionRepository,
  agreementResolutionRepository:
    AgreementResolutionRepository,
  changeControlHistoryRepository:
    ChangeControlHistoryRepository,
  tenantContext:
    TenantContext,
  request:
    GetChangeControlHistoryRequest,
): Promise<ChangeControlHistory> {
  const garment =
    await garmentRepository.findById({
      businessId:
        tenantContext.businessId,
      garmentId:
        request.garmentId,
    });

  if (!garment) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Garment was not found in the current business.",
    );
  }

  const versions =
    await agreementVersionRepository
      .listForGarment({
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      });

  const orderedVersions =
    [...versions].sort(
      (left, right) =>
        left.revisionNumber -
        right.revisionNumber,
    );

  for (
    const version
    of orderedVersions
  ) {
    if (
      version.businessId !==
        tenantContext.businessId ||
      version.garmentId !==
        garment.id ||
      version.orderId !==
        garment.orderId
    ) {
      inaccessibleHistory();
    }
  }

  const versionById =
    new Map(
      orderedVersions.map(
        (version) => [
          version.id,
          version,
        ],
      ),
    );

  const resolutionCache =
    new Map<
      string,
      Promise<
        AgreementResolution | null
      >
    >();

  const getResolution =
    (
      agreementVersionId:
        string,
    ): Promise<
      AgreementResolution | null
    > => {
      const existing =
        resolutionCache.get(
          agreementVersionId,
        );

      if (existing) {
        return existing;
      }

      const pending =
        agreementResolutionRepository
          .findForVersion({
            businessId:
              tenantContext.businessId,
            agreementVersionId,
          })
          .then(
            (resolution) => {
              if (
                resolution &&
                (
                  resolution.businessId !==
                    tenantContext.businessId ||
                  resolution
                    .agreementVersionId !==
                    agreementVersionId
                )
              ) {
                inaccessibleHistory();
              }

              return resolution;
            },
          );

      resolutionCache.set(
        agreementVersionId,
        pending,
      );

      return pending;
    };

  let currentApprovedBaseline:
    AgreementHistoryEvidence | null =
      null;

  const latestAgreement =
    orderedVersions.at(
      -1,
    );

  if (latestAgreement) {
    const latestResolution =
      await getResolution(
        latestAgreement.id,
      );

    if (
      latestResolution?.outcome ===
      "APPROVED"
    ) {
      currentApprovedBaseline = {
        version:
          latestAgreement,
        resolution:
          latestResolution,
      };
    }
  }

  const requests =
    await changeControlHistoryRepository
      .listRequestsForGarment({
        businessId:
          tenantContext.businessId,
        garmentId:
          garment.id,
      });

  const orderedRequests =
    [...requests].sort(
      (left, right) => {
        const requestedDifference =
          left.requestedAt.getTime() -
          right.requestedAt.getTime();

        if (
          requestedDifference !== 0
        ) {
          return requestedDifference;
        }

        const createdDifference =
          left.createdAt.getTime() -
          right.createdAt.getTime();

        if (
          createdDifference !== 0
        ) {
          return createdDifference;
        }

        return left.id.localeCompare(
          right.id,
        );
      },
    );

  const history =
    await Promise.all(
      orderedRequests.map(
        async (
          changeRequest,
        ): Promise<
          ChangeRequestHistoryEntry
        > => {
          if (
            changeRequest.businessId !==
              tenantContext.businessId ||
            changeRequest.garmentId !==
              garment.id ||
            changeRequest.orderId !==
              garment.orderId
          ) {
            inaccessibleHistory();
          }

          const baseline =
            versionById.get(
              changeRequest
                .baselineAgreementVersionId,
            );

          if (
            !baseline ||
            baseline.clientId !==
              changeRequest.clientId ||
            baseline.orderId !==
              changeRequest.orderId ||
            baseline.garmentId !==
              changeRequest.garmentId
          ) {
            historyConflict(
              "Change request baseline history is inconsistent.",
            );
          }

          const baselineResolution =
            await getResolution(
              baseline.id,
            );

          if (
            !baselineResolution ||
            baselineResolution.outcome !==
              "APPROVED"
          ) {
            historyConflict(
              "Change request baseline does not have its required approved resolution.",
            );
          }

          const proposals =
            await changeControlHistoryRepository
              .listProposalsForRequest({
                businessId:
                  tenantContext.businessId,
                changeRequestId:
                  changeRequest.id,
              });

          const orderedProposals =
            [...proposals].sort(
              (left, right) =>
                left.revisionNumber -
                right.revisionNumber,
            );

          for (
            const proposal
            of orderedProposals
          ) {
            if (
              proposal.businessId !==
                tenantContext.businessId ||
              proposal.changeRequestId !==
                changeRequest.id ||
              proposal.clientId !==
                changeRequest.clientId ||
              proposal.orderId !==
                changeRequest.orderId ||
              proposal.garmentId !==
                changeRequest.garmentId ||
              proposal
                .baselineAgreementVersionId !==
                changeRequest
                  .baselineAgreementVersionId
            ) {
              inaccessibleHistory();
            }
          }

          assertProposalChain(
            orderedProposals,
          );

          const proposalHistory =
            await Promise.all(
              orderedProposals.map(
                async (
                  proposal,
                ): Promise<
                  ChangeProposalHistoryEntry
                > => {
                  const decision =
                    await changeControlHistoryRepository
                      .findDecisionForProposal({
                        businessId:
                          tenantContext.businessId,
                        changeProposalVersionId:
                          proposal.id,
                      });

                  if (
                    decision &&
                    (
                      decision.businessId !==
                        tenantContext.businessId ||
                      decision
                        .changeProposalVersionId !==
                        proposal.id
                    )
                  ) {
                    inaccessibleHistory();
                  }

                  return {
                    proposal,
                    decision,
                  };
                },
              ),
            );

          assertProposalDecisionChain(
            proposalHistory,
          );

          const closure =
            await changeControlHistoryRepository
              .findClosureForRequest({
                businessId:
                  tenantContext.businessId,
                changeRequestId:
                  changeRequest.id,
              });

          if (
            closure &&
            (
              closure.businessId !==
                tenantContext.businessId ||
              closure.changeRequestId !==
                changeRequest.id
            )
          ) {
            inaccessibleHistory();
          }

          const latestProposal =
            proposalHistory.at(
              -1,
            ) ?? null;

          let appliedAgreement:
            AgreementHistoryEvidence | null =
              null;

          if (
            latestProposal
              ?.decision
              ?.outcome ===
            "APPROVED"
          ) {
            const candidates =
              orderedVersions.filter(
                (version) =>
                  isAppliedAgreementForProposal(
                    latestProposal.proposal,
                    version,
                  ),
              );

            if (
              candidates.length !== 1
            ) {
              historyConflict(
                "Approved change history does not resolve to exactly one amended agreement.",
              );
            }

            const appliedVersion =
              candidates[0];

            const appliedResolution =
              await getResolution(
                appliedVersion.id,
              );

            if (
              !appliedResolution ||
              appliedResolution.outcome !==
                "APPROVED"
            ) {
              historyConflict(
                "Applied change does not have its required approved agreement resolution.",
              );
            }

            appliedAgreement = {
              version:
                appliedVersion,
              resolution:
                appliedResolution,
            };
          }

          let state:
            ChangeRequestState;

          try {
            state =
              deriveChangeRequestState(
                latestProposal
                  ?.proposal ??
                  null,
                latestProposal
                  ?.decision ??
                  null,
                closure,
                appliedAgreement
                  ?.version ??
                  null,
              );
          } catch (error) {
            if (
              error instanceof Error
            ) {
              historyConflict(
                error.message,
              );
            }

            throw error;
          }

          return {
            request:
              changeRequest,
            baseline: {
              version:
                baseline,
              resolution:
                baselineResolution,
            },
            proposals:
              proposalHistory,
            closure,
            appliedAgreement,
            state,
          };
        },
      ),
    );

  return {
    currentApprovedBaseline,
    requests:
      history,
  };
}
