import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { z } from "zod";

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
    </section>
  );
}
