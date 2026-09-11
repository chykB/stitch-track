import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { z } from "zod";

import {
  CreateAgreementVersionForm,
} from "../../../../../agreement/presentation/create-agreement-version-form";
import {
  RecordAgreementResolutionForm,
} from "../../../../../agreement/presentation/record-agreement-resolution-form";
import {
  CloseChangeRequestForm,
} from "../../../../../change-control/presentation/close-change-request-form";
import {
  CreateChangeProposalVersionForm,
} from "../../../../../change-control/presentation/create-change-proposal-version-form";
import {
  CreateChangeRequestForm,
} from "../../../../../change-control/presentation/create-change-request-form";
import {
  RecordChangeProposalDecisionForm,
} from "../../../../../change-control/presentation/record-change-proposal-decision-form";
import {
  ClientPortalGrantManager,
} from "../../../../../change-control/presentation/client-portal-grant-manager";
import {
  getChangeControlHistoryForCurrentTenant,
} from "../../../../../change-control/composition/get-change-control-history";
import {
  listOutstandingClientPortalGrantsForCurrentTenant,
} from "../../../../../change-control/composition/list-outstanding-client-portal-grants";
import {
  getGarmentRecordForCurrentTenant,
} from "../../../../../garment/composition/get-garment-record";
import {
  ApplicationError,
} from "../../../../../shared/application/errors/application-error";

type GarmentRecordPageProps =
  Readonly<{
    params: Promise<{
      businessId: string;
      garmentId: string;
    }>;
  }>;

const routeParamsSchema =
  z.object({
    businessId:
      z.string().uuid(),
    garmentId:
      z.string().uuid(),
  });

const measurementDateFormatter =
  new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeZone: "UTC",
    },
  );

const dateTimeFormatter =
  new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    },
  );

export default async function GarmentRecordPage({
  params,
}: GarmentRecordPageProps) {
  const parsedParams =
    routeParamsSchema.safeParse(
      await params,
    );

  if (!parsedParams.success) {
    notFound();
  }

  let record;
  let changeControlHistory;
  let outstandingPortalGrants;

  try {
    record =
      await getGarmentRecordForCurrentTenant(
        parsedParams.data.businessId,
        parsedParams.data.garmentId,
      );

    changeControlHistory =
      await getChangeControlHistoryForCurrentTenant(
        parsedParams.data.businessId,
        {
          garmentId:
            parsedParams.data.garmentId,
        },
      );

    outstandingPortalGrants =
      await listOutstandingClientPortalGrantsForCurrentTenant(
        parsedParams.data.businessId,
        {
          garmentId:
            parsedParams.data.garmentId,
        },
      );
  } catch (error) {
    if (
      error instanceof ApplicationError
    ) {
      if (
        error.code ===
        "UNAUTHORIZED"
      ) {
        redirect("/sign-in");
      }

      if (
        error.code ===
          "FORBIDDEN" ||
        error.code ===
          "NOT_FOUND"
      ) {
        notFound();
      }
    }

    throw error;
  }

  const latestAgreementEntry =
    record.agreementHistory[
      record.agreementHistory.length -
        1
    ] ?? null;

  const latestAgreementOutcome =
    latestAgreementEntry
      ?.resolution
      ?.outcome ?? null;

  const canCreateAgreementVersion =
    !latestAgreementEntry ||
    latestAgreementOutcome ===
      "REJECTED" ||
    latestAgreementOutcome ===
      "WITHDRAWN";

  const canResolveLatestAgreement =
    Boolean(
      latestAgreementEntry &&
      !latestAgreementEntry
        .resolution,
    );

  const activeChangeRequestEntry =
    changeControlHistory.requests.find(
      (entry) =>
        entry.state === "OPEN" ||
        entry.state ===
          "AWAITING_CLIENT",
    ) ?? null;

  const latestChangeProposalEntry =
    activeChangeRequestEntry
      ?.proposals.at(-1) ??
    null;

  const proposalSeed =
    latestChangeProposalEntry
      ?.proposal ??
    activeChangeRequestEntry
      ?.baseline.version ??
    null;

  const canCreateChangeRequest =
    Boolean(
      changeControlHistory
        .currentApprovedBaseline &&
      !activeChangeRequestEntry,
    );

  const canCreateChangeProposal =
    activeChangeRequestEntry
      ?.state === "OPEN";

  const canDecideChangeProposal =
    Boolean(
      activeChangeRequestEntry
        ?.state ===
        "AWAITING_CLIENT" &&
      latestChangeProposalEntry &&
      !latestChangeProposalEntry
        .decision,
    );

  const canCloseChangeRequest =
    Boolean(
      activeChangeRequestEntry &&
      (
        activeChangeRequestEntry
          .state === "OPEN" ||
        activeChangeRequestEntry
          .state ===
          "AWAITING_CLIENT"
      ),
    );

  return (
    <section className="workspace-card">
      <Link
        className="workspace-back-link"
        href={
          `/app/${parsedParams.data.businessId}`
        }
      >
        ← Back to business
      </Link>

      <p className="eyebrow">
        Garment record
      </p>

      <h1>
        {record.garment.name}
      </h1>

      <p className="workspace-note">
        Immutable measurement history and
        style references recorded for this
        tailoring workflow.
      </p>

      <div className="workspace-summary">
        <div>
          <span className="summary-label">
            Client
          </span>

          <strong>
            {record.client.name}
          </strong>

          <span className="record-id">
            {record.client.id}
          </span>
        </div>

        <div>
          <span className="summary-label">
            Garment
          </span>

          <strong>
            {record.garment.name}
          </strong>

          <span className="record-id">
            {record.garment.id}
          </span>
        </div>
      </div>

      <section
        className="record-history-section"
        aria-labelledby="measurement-history-title"
      >
        <div>
          <p className="eyebrow">
            Client measurements
          </p>

          <h2 id="measurement-history-title">
            Measurement history
          </h2>

          <p className="workspace-note">
            Each measurement set is preserved
            as a separate historical record.
          </p>
        </div>

        {record.measurementVersions.length ===
        0 ? (
          <div className="empty-state">
            <p>
              No measurement history has
              been recorded yet.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {record.measurementVersions.map(
              (version) => (
                <article
                  className="history-card"
                  key={version.id}
                >
                  <div className="history-card-heading">
                    <div>
                      <strong>
                        {measurementDateFormatter.format(
                          version.measuredAt,
                        )}
                      </strong>

                      <span className="record-id">
                        {version.id}
                      </span>
                    </div>

                    <span className="history-unit">
                      {version.unit ===
                      "CENTIMETER"
                        ? "cm"
                        : "in"}
                    </span>
                  </div>

                  <dl className="measurement-history-values">
                    {version.entries.map(
                      (entry) => (
                        <div
                          key={entry.id}
                        >
                          <dt>
                            {entry.label}
                          </dt>

                          <dd>
                            {entry.value}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>

                  {version.note ? (
                    <p className="history-note">
                      {version.note}
                    </p>
                  ) : null}
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <section
        className="record-history-section"
        aria-labelledby="style-reference-history-title"
      >
        <div>
          <p className="eyebrow">
            Garment references
          </p>

          <h2 id="style-reference-history-title">
            Style references
          </h2>

          <p className="workspace-note">
            These are recorded references,
            not approval or final-design
            decisions.
          </p>
        </div>

        {record.styleReferences.length ===
        0 ? (
          <div className="empty-state">
            <p>
              No style references have
              been recorded yet.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {record.styleReferences.map(
              (reference) => (
                <article
                  className="history-card"
                  key={reference.id}
                >
                  <div>
                    <strong>
                      {reference.label ??
                        "Unlabelled reference"}
                    </strong>

                    <span className="record-id">
                      {reference.id}
                    </span>
                  </div>

                  <a
                    className="reference-link"
                    href={
                      reference.sourceUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open reference ↗
                  </a>

                  {reference.note ? (
                    <p className="history-note">
                      {reference.note}
                    </p>
                  ) : null}
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <section
        className="record-history-section"
        aria-labelledby="agreement-history-title"
      >
        <div>
          <p className="eyebrow">
            Garment agreement
          </p>

          <h2 id="agreement-history-title">
            Agreement history
          </h2>

          <p className="workspace-note">
            Each revision preserves the
            exact measurements, references,
            commercial terms, and final
            decision recorded at that point
            in time.
          </p>
        </div>

        {record.agreementHistory.length ===
        0 ? (
          <div className="empty-state">
            <p>
              No agreement version has
              been recorded yet.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {record.agreementHistory.map(
              (entry) => {
                const selectedMeasurement =
                  entry.version
                    .measurementVersionId
                    ? record
                        .measurementVersions
                        .find(
                          (version) =>
                            version.id ===
                            entry
                              .version
                              .measurementVersionId,
                        )
                    : null;

                return (
                  <article
                    className="history-card"
                    key={
                      entry.version.id
                    }
                  >
                    <div className="history-card-heading">
                      <div>
                        <strong>
                          Revision{" "}
                          {
                            entry
                              .version
                              .revisionNumber
                          }
                        </strong>

                        <span className="record-id">
                          {
                            entry
                              .version
                              .id
                          }
                        </span>
                      </div>

                      <span className="history-unit">
                        {entry.resolution
                          ?.outcome ??
                          "PENDING"}
                      </span>
                    </div>

                    <dl className="agreement-history-values">
                      <div>
                        <dt>
                          Quantity
                        </dt>

                        <dd>
                          {
                            entry
                              .version
                              .quantity
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Price
                        </dt>

                        <dd>
                          {
                            entry
                              .version
                              .currency
                          }{" "}
                          {
                            entry
                              .version
                              .priceAmount
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Delivery
                        </dt>

                        <dd>
                          {measurementDateFormatter.format(
                            new Date(
                              `${entry.version.deliveryDate}T00:00:00.000Z`,
                            ),
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div className="agreement-history-detail">
                      <span className="summary-label">
                        Design summary
                      </span>

                      <p>
                        {
                          entry
                            .version
                            .designSummary
                        }
                      </p>
                    </div>

                    {entry.version
                      .fabricDescription ? (
                      <div className="agreement-history-detail">
                        <span className="summary-label">
                          Fabric
                        </span>

                        <p>
                          {
                            entry
                              .version
                              .fabricDescription
                          }
                        </p>
                      </div>
                    ) : null}

                    <div className="agreement-history-detail">
                      <span className="summary-label">
                        Measurement version
                      </span>

                      {selectedMeasurement ? (
                        <>
                          <strong>
                            {measurementDateFormatter.format(
                              selectedMeasurement
                                .measuredAt,
                            )}
                            {" · "}
                            {selectedMeasurement
                              .unit ===
                            "CENTIMETER"
                              ? "cm"
                              : "in"}
                          </strong>

                          <span className="record-id">
                            {
                              selectedMeasurement
                                .id
                            }
                          </span>
                        </>
                      ) : (
                        <span className="workspace-note">
                          No measurement
                          version attached.
                        </span>
                      )}
                    </div>

                    <div className="agreement-history-detail">
                      <span className="summary-label">
                        Exact style references
                      </span>

                      {entry.version
                        .styleReferenceIds
                        .length === 0 ? (
                        <span className="workspace-note">
                          No style references
                          attached.
                        </span>
                      ) : (
                        <ul className="agreement-reference-list">
                          {entry.version.styleReferenceIds.map(
                            (
                              styleReferenceId,
                            ) => {
                              const reference =
                                record.styleReferences.find(
                                  (
                                    candidate,
                                  ) =>
                                    candidate.id ===
                                    styleReferenceId,
                                );

                              return (
                                <li
                                  key={
                                    styleReferenceId
                                  }
                                >
                                  <div>
                                    <strong>
                                      {reference
                                        ?.label ??
                                        "Recorded reference"}
                                    </strong>

                                    <span className="record-id">
                                      {
                                        styleReferenceId
                                      }
                                    </span>
                                  </div>

                                  {reference ? (
                                    <a
                                      className="reference-link"
                                      href={
                                        reference
                                          .sourceUrl
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Open ↗
                                    </a>
                                  ) : null}
                                </li>
                              );
                            },
                          )}
                        </ul>
                      )}
                    </div>

                    {entry.version.note ? (
                      <p className="history-note">
                        {
                          entry
                            .version
                            .note
                        }
                      </p>
                    ) : null}

                    {entry.resolution ? (
                      <div className="agreement-resolution-record">
                        <span className="summary-label">
                          Resolution evidence
                        </span>

                        <strong>
                          {
                            entry
                              .resolution
                              .outcome
                          }
                        </strong>

                        {entry.resolution
                          .clientNameSnapshot ? (
                          <span>
                            Client:{" "}
                            {
                              entry
                                .resolution
                                .clientNameSnapshot
                            }
                          </span>
                        ) : null}

                        {entry.resolution
                          .clientDecisionChannel ? (
                          <span>
                            Channel:{" "}
                            {
                              entry
                                .resolution
                                .clientDecisionChannel
                            }
                          </span>
                        ) : null}

                        <p className="history-note">
                          {
                            entry
                              .resolution
                              .evidenceNote
                          }
                        </p>
                      </div>
                    ) : (
                      <p className="workspace-note">
                        This revision is
                        pending a terminal
                        decision.
                      </p>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      {canResolveLatestAgreement &&
      latestAgreementEntry ? (
        <RecordAgreementResolutionForm
          businessId={
            parsedParams.data.businessId
          }
          garmentId={
            record.garment.id
          }
          agreementVersionId={
            latestAgreementEntry
              .version.id
          }
          revisionNumber={
            latestAgreementEntry
              .version
              .revisionNumber
          }
        />
      ) : null}

      <section
        className="record-history-section"
        aria-labelledby="change-control-history-title"
      >
        <div>
          <p className="eyebrow">
            Change control
          </p>

          <h2 id="change-control-history-title">
            Change-control history
          </h2>

          <p className="workspace-note">
            Requests, proposal revisions,
            client decisions, closures, and
            applied agreement evidence are
            preserved here as immutable
            workflow history.
          </p>
        </div>

        {changeControlHistory
          .requests.length === 0 ? (
          <div className="empty-state">
            <p>
              No post-approval change
              requests have been recorded.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {changeControlHistory
              .requests.map(
                (entry, index) => (
                  <article
                    className="history-card"
                    key={entry.request.id}
                  >
                    <div className="history-card-heading">
                      <div>
                        <strong>
                          Change request{" "}
                          {index + 1}
                        </strong>

                        <span className="record-id">
                          {entry.request.id}
                        </span>
                      </div>

                      <span className="history-unit">
                        {entry.state}
                      </span>
                    </div>

                    <dl className="agreement-history-values">
                      <div>
                        <dt>
                          Requested by
                        </dt>

                        <dd>
                          {
                            entry.request
                              .requestedBy
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Channel
                        </dt>

                        <dd>
                          {
                            entry.request
                              .requestChannel ??
                            "Not applicable"
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Requested
                        </dt>

                        <dd>
                          {dateTimeFormatter.format(
                            entry.request
                              .requestedAt,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Baseline
                        </dt>

                        <dd>
                          Revision{" "}
                          {
                            entry.baseline
                              .version
                              .revisionNumber
                          }
                        </dd>
                      </div>
                    </dl>

                    <div className="agreement-history-detail">
                      <span className="summary-label">
                        Requested change
                      </span>

                      <p>
                        {
                          entry.request
                            .description
                        }
                      </p>
                    </div>

                    <div className="agreement-history-detail">
                      <span className="summary-label">
                        Baseline evidence
                      </span>

                      <strong>
                        Approved revision{" "}
                        {
                          entry.baseline
                            .version
                            .revisionNumber
                        }
                      </strong>

                      <span className="record-id">
                        {
                          entry.baseline
                            .version.id
                        }
                      </span>

                      <p className="history-note">
                        Approved{" "}
                        {dateTimeFormatter.format(
                          entry.baseline
                            .resolution
                            .occurredAt,
                        )}
                      </p>
                    </div>

                    <div className="agreement-history-detail">
                      <span className="summary-label">
                        Proposal history
                      </span>

                      {entry.proposals.length ===
                      0 ? (
                        <p className="workspace-note">
                          No change proposal
                          has been recorded
                          yet.
                        </p>
                      ) : (
                        <div className="history-list">
                          {entry.proposals.map(
                            (
                              proposalEntry,
                            ) => (
                              <div
                                className="history-card"
                                key={
                                  proposalEntry
                                    .proposal.id
                                }
                              >
                                <div className="history-card-heading">
                                  <div>
                                    <strong>
                                      Proposal
                                      revision{" "}
                                      {
                                        proposalEntry
                                          .proposal
                                          .revisionNumber
                                      }
                                    </strong>

                                    <span className="record-id">
                                      {
                                        proposalEntry
                                          .proposal
                                          .id
                                      }
                                    </span>
                                  </div>

                                  <span className="history-unit">
                                    {proposalEntry
                                      .decision
                                      ?.outcome ??
                                      "PENDING"}
                                  </span>
                                </div>

                                <dl className="agreement-history-values">
                                  <div>
                                    <dt>
                                      Quantity
                                    </dt>

                                    <dd>
                                      {
                                        proposalEntry
                                          .proposal
                                          .quantity
                                      }
                                    </dd>
                                  </div>

                                  <div>
                                    <dt>
                                      Price
                                    </dt>

                                    <dd>
                                      {
                                        proposalEntry
                                          .proposal
                                          .currency
                                      }{" "}
                                      {
                                        proposalEntry
                                          .proposal
                                          .priceAmount
                                      }
                                    </dd>
                                  </div>

                                  <div>
                                    <dt>
                                      Delivery
                                    </dt>

                                    <dd>
                                      {measurementDateFormatter.format(
                                        new Date(
                                          `${proposalEntry.proposal.deliveryDate}T00:00:00.000Z`,
                                        ),
                                      )}
                                    </dd>
                                  </div>
                                </dl>

                                <div className="agreement-history-detail">
                                  <span className="summary-label">
                                    Design
                                  </span>

                                  <p>
                                    {
                                      proposalEntry
                                        .proposal
                                        .designSummary
                                    }
                                  </p>
                                </div>

                                {proposalEntry
                                  .proposal
                                  .fabricDescription ? (
                                  <div className="agreement-history-detail">
                                    <span className="summary-label">
                                      Fabric
                                    </span>

                                    <p>
                                      {
                                        proposalEntry
                                          .proposal
                                          .fabricDescription
                                      }
                                    </p>
                                  </div>
                                ) : null}

                                <div className="agreement-history-detail">
                                  <span className="summary-label">
                                    Measurement
                                  </span>

                                  <span className="record-id">
                                    {proposalEntry
                                      .proposal
                                      .measurementVersionId ??
                                      "No measurement version"}
                                  </span>
                                </div>

                                <div className="agreement-history-detail">
                                  <span className="summary-label">
                                    Style references
                                  </span>

                                  {proposalEntry
                                    .proposal
                                    .styleReferenceIds
                                    .length ===
                                  0 ? (
                                    <span className="workspace-note">
                                      No style
                                      references.
                                    </span>
                                  ) : (
                                    proposalEntry
                                      .proposal
                                      .styleReferenceIds
                                      .map(
                                        (
                                          referenceId,
                                        ) => (
                                          <span
                                            className="record-id"
                                            key={
                                              referenceId
                                            }
                                          >
                                            {
                                              referenceId
                                            }
                                          </span>
                                        ),
                                      )
                                  )}
                                </div>

                                <div className="agreement-history-detail">
                                  <span className="summary-label">
                                    Proposal
                                    rationale
                                  </span>

                                  <p>
                                    {
                                      proposalEntry
                                        .proposal
                                        .rationale
                                    }
                                  </p>
                                </div>

                                {proposalEntry
                                  .proposal.note ? (
                                  <div className="agreement-history-detail">
                                    <span className="summary-label">
                                      Note
                                    </span>

                                    <p>
                                      {
                                        proposalEntry
                                          .proposal
                                          .note
                                      }
                                    </p>
                                  </div>
                                ) : null}

                                {proposalEntry
                                  .decision ? (
                                  <div className="agreement-resolution-record">
                                    <span className="summary-label">
                                      Client
                                      decision
                                      evidence
                                    </span>

                                    <strong>
                                      {
                                        proposalEntry
                                          .decision
                                          .outcome
                                      }
                                    </strong>

                                    <span>
                                      Client:{" "}
                                      {
                                        proposalEntry
                                          .decision
                                          .clientNameSnapshot
                                      }
                                    </span>

                                    <span>
                                      Channel:{" "}
                                      {
                                        proposalEntry
                                          .decision
                                          .clientDecisionChannel
                                      }
                                    </span>

                                    <span>
                                      Recorded:{" "}
                                      {dateTimeFormatter.format(
                                        proposalEntry
                                          .decision
                                          .occurredAt,
                                      )}
                                    </span>

                                    <p className="history-note">
                                      {
                                        proposalEntry
                                          .decision
                                          .evidenceNote
                                      }
                                    </p>
                                  </div>
                                ) : (
                                  <p className="workspace-note">
                                    This
                                    proposal is
                                    awaiting a
                                    client
                                    decision.
                                  </p>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    {entry.closure ? (
                      <div className="agreement-resolution-record">
                        <span className="summary-label">
                          Request closure
                        </span>

                        <strong>
                          {
                            entry.closure
                              .outcome
                          }
                        </strong>

                        <span>
                          Closed:{" "}
                          {dateTimeFormatter.format(
                            entry.closure
                              .occurredAt,
                          )}
                        </span>

                        <p className="history-note">
                          {
                            entry.closure
                              .reason
                          }
                        </p>
                      </div>
                    ) : null}

                    {entry.appliedAgreement ? (
                      <div className="agreement-resolution-record">
                        <span className="summary-label">
                          Applied agreement
                        </span>

                        <strong>
                          Revision{" "}
                          {
                            entry
                              .appliedAgreement
                              .version
                              .revisionNumber
                          }
                        </strong>

                        <span className="record-id">
                          {
                            entry
                              .appliedAgreement
                              .version.id
                          }
                        </span>

                        <span>
                          Applied:{" "}
                          {dateTimeFormatter.format(
                            entry
                              .appliedAgreement
                              .resolution
                              .occurredAt,
                          )}
                        </span>
                      </div>
                    ) : null}
                  </article>
                ),
              )}
          </div>
        )}
      </section>

      {changeControlHistory
        .currentApprovedBaseline ? (
        <div className="workflow-complete">
          <div>
            <p className="eyebrow">
              Approved baseline
            </p>

            <h3>
              Revision{" "}
              {
                changeControlHistory
                  .currentApprovedBaseline
                  .version
                  .revisionNumber
              }{" "}
              is current
            </h3>

            <p className="workspace-note">
              This approved agreement is
              the current locked baseline.
              Any post-approval change must
              move through change control
              before it can replace these
              terms.
            </p>
          </div>
        </div>
      ) : null}

      <ClientPortalGrantManager
        businessId={
          parsedParams.data.businessId
        }
        garmentId={
          record.garment.id
        }
        canIssueRequestChange={
          canCreateChangeRequest
        }
        decisionTarget={
          canDecideChangeProposal &&
          activeChangeRequestEntry &&
          latestChangeProposalEntry
            ? {
                changeRequestId:
                  activeChangeRequestEntry
                    .request.id,
                changeProposalVersionId:
                  latestChangeProposalEntry
                    .proposal.id,
                proposalRevisionNumber:
                  latestChangeProposalEntry
                    .proposal
                    .revisionNumber,
              }
            : null
        }
        outstandingGrants={
          outstandingPortalGrants.map(
            (grant) => ({
              id:
                grant.id,
              purpose:
                grant.purpose,
              changeProposalVersionId:
                grant
                  .changeProposalVersionId,
              expiresAt:
                grant.expiresAt
                  .toISOString(),
              createdAt:
                grant.createdAt
                  .toISOString(),
            }),
          )
        }
      />

      {canCreateChangeRequest ? (
        <CreateChangeRequestForm
          businessId={
            parsedParams.data.businessId
          }
          garmentId={
            record.garment.id
          }
          garmentName={
            record.garment.name
          }
        />
      ) : null}

      {canCreateChangeProposal &&
      activeChangeRequestEntry &&
      proposalSeed ? (
        <CreateChangeProposalVersionForm
          businessId={
            parsedParams.data.businessId
          }
          garmentId={
            record.garment.id
          }
          garmentName={
            record.garment.name
          }
          changeRequestId={
            activeChangeRequestEntry
              .request.id
          }
          measurementVersions={
            record.measurementVersions.map(
              (version) => ({
                id:
                  version.id,
                measuredAt:
                  version.measuredAt
                    .toISOString(),
                unit:
                  version.unit,
              }),
            )
          }
          styleReferences={
            record.styleReferences.map(
              (reference) => ({
                id:
                  reference.id,
                label:
                  reference.label,
                sourceUrl:
                  reference.sourceUrl,
              }),
            )
          }
          baseline={{
            measurementVersionId:
              proposalSeed
                .measurementVersionId,
            designSummary:
              proposalSeed
                .designSummary,
            fabricDescription:
              proposalSeed
                .fabricDescription,
            quantity:
              proposalSeed.quantity,
            priceAmount:
              proposalSeed.priceAmount,
            currency:
              proposalSeed.currency,
            deliveryDate:
              proposalSeed.deliveryDate,
            note:
              proposalSeed.note,
            styleReferenceIds:
              proposalSeed
                .styleReferenceIds,
          }}
        />
      ) : null}

      {canDecideChangeProposal &&
      activeChangeRequestEntry &&
      latestChangeProposalEntry ? (
        <RecordChangeProposalDecisionForm
          businessId={
            parsedParams.data.businessId
          }
          garmentId={
            record.garment.id
          }
          changeRequestId={
            activeChangeRequestEntry
              .request.id
          }
          changeProposalVersionId={
            latestChangeProposalEntry
              .proposal.id
          }
          proposalRevisionNumber={
            latestChangeProposalEntry
              .proposal
              .revisionNumber
          }
        />
      ) : null}

      {canCloseChangeRequest &&
      activeChangeRequestEntry ? (
        <CloseChangeRequestForm
          businessId={
            parsedParams.data.businessId
          }
          garmentId={
            record.garment.id
          }
          changeRequestId={
            activeChangeRequestEntry
              .request.id
          }
        />
      ) : null}

      {canCreateAgreementVersion ? (
        <CreateAgreementVersionForm
          businessId={
            parsedParams.data.businessId
          }
          garmentId={
            record.garment.id
          }
          garmentName={
            record.garment.name
          }
          measurementVersions={
            record.measurementVersions.map(
              (version) => ({
                id:
                  version.id,
                measuredAt:
                  version.measuredAt
                    .toISOString(),
                unit:
                  version.unit,
              }),
            )
          }
          styleReferences={
            record.styleReferences.map(
              (reference) => ({
                id:
                  reference.id,
                label:
                  reference.label,
                sourceUrl:
                  reference.sourceUrl,
              }),
            )
          }
        />
      ) : null}
    </section>
  );
}
