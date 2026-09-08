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

  try {
    record =
      await getGarmentRecordForCurrentTenant(
        parsedParams.data.businessId,
        parsedParams.data.garmentId,
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

      {latestAgreementOutcome ===
      "APPROVED" ? (
        <div className="workflow-complete">
          <div>
            <p className="eyebrow">
              Approved baseline
            </p>

            <h3>
              Initial agreement approved
            </h3>

            <p className="workspace-note">
              This approved revision is
              now the locked baseline.
              Post-approval change control
              belongs to the next product
              milestone.
            </p>
          </div>
        </div>
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
