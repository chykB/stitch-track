import {
  z,
} from "zod";

import {
  getChangeProposalDecisionPublicPortalView,
} from "@/change-control/composition/get-change-proposal-decision-portal-view";
import {
  recordChangeProposalDecisionFromPortalAction,
} from "@/change-control/presentation/actions/record-change-proposal-decision-from-portal-action";
import {
  PortalChangeProposalDecisionForm,
} from "@/change-control/presentation/portal-change-proposal-decision-form";
import {
  PortalUnavailable,
} from "@/change-control/presentation/portal-unavailable";
import {
  ApplicationError,
} from "@/shared/application/errors/application-error";

type PortalDecisionPageProps =
  Readonly<{
    params:
      Promise<{
        token: string;
      }>;
  }>;

const tokenSchema =
  z.string()
    .min(1)
    .max(512);

const measurementDateFormatter =
  new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "medium",
      timeZone:
        "UTC",
    },
  );

export default async function PortalDecisionPage({
  params,
}: PortalDecisionPageProps) {
  const parsedToken =
    tokenSchema.safeParse(
      (
        await params
      ).token,
    );

  if (!parsedToken.success) {
    return (
      <PortalUnavailable />
    );
  }

  let view;

  try {
    view =
      await getChangeProposalDecisionPublicPortalView({
        rawToken:
          parsedToken.data,
      });
  } catch (error) {
    if (
      error instanceof
      ApplicationError
    ) {
      return (
        <PortalUnavailable />
      );
    }

    throw error;
  }

  const action =
    recordChangeProposalDecisionFromPortalAction.bind(
      null,
      parsedToken.data,
    );

  return (
    <main className="portal-shell">
      <section className="workspace-card portal-card">
        <p className="eyebrow">
          StitchTrack client portal
        </p>

        <h1>
          Review proposed change
        </h1>

        <p className="workspace-note">
          Hi {view.clientName}. Review
          proposal revision{" "}
          {view.proposalRevision} for{" "}
          <strong>
            {view.garmentName}
          </strong>{" "}
          before approving or rejecting it.
        </p>

        <section className="portal-request-summary">
          <span className="summary-label">
            Requested change
          </span>

          <strong>
            {view.requestedChange}
          </strong>
        </section>

        <section
          className="portal-comparison"
          aria-label="Current and proposed terms"
        >
          <article className="portal-terms-card">
            <p className="eyebrow">
              Current agreement
            </p>

            <h2>
              Existing terms
            </h2>

            <dl className="portal-terms">
              <div>
                <dt>
                  Design
                </dt>

                <dd>
                  {
                    view
                      .currentAgreement
                      .designSummary
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Fabric
                </dt>

                <dd>
                  {
                    view
                      .currentAgreement
                      .fabricDescription ??
                    "Not specified"
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Quantity
                </dt>

                <dd>
                  {
                    view
                      .currentAgreement
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
                    view
                      .currentAgreement
                      .currency
                  }{" "}
                  {
                    view
                      .currentAgreement
                      .priceAmount
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Delivery date
                </dt>

                <dd>
                  {
                    view
                      .currentAgreement
                      .deliveryDate
                  }
                </dd>
              </div>

              {view.currentAgreement
                .note ? (
                <div>
                  <dt>
                    Note
                  </dt>

                  <dd>
                    {
                      view
                        .currentAgreement
                        .note
                    }
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>

          <article className="portal-terms-card">
            <p className="eyebrow">
              Proposed change
            </p>

            <h2>
              Proposed terms
            </h2>

            <dl className="portal-terms">
              <div>
                <dt>
                  Design
                </dt>

                <dd>
                  {
                    view
                      .proposedAgreement
                      .designSummary
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Fabric
                </dt>

                <dd>
                  {
                    view
                      .proposedAgreement
                      .fabricDescription ??
                    "Not specified"
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Quantity
                </dt>

                <dd>
                  {
                    view
                      .proposedAgreement
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
                    view
                      .proposedAgreement
                      .currency
                  }{" "}
                  {
                    view
                      .proposedAgreement
                      .priceAmount
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Delivery date
                </dt>

                <dd>
                  {
                    view
                      .proposedAgreement
                      .deliveryDate
                  }
                </dd>
              </div>

              {view.proposedAgreement
                .note ? (
                <div>
                  <dt>
                    Note
                  </dt>

                  <dd>
                    {
                      view
                        .proposedAgreement
                        .note
                    }
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>
        </section>

        <section className="portal-terms-card">
          <p className="eyebrow">
            Why these terms changed
          </p>

          <h2>
            Proposal rationale
          </h2>

          <p>
            {view.rationale}
          </p>
        </section>

        {view.selectedMeasurement ? (
          <section className="portal-terms-card">
            <p className="eyebrow">
              Selected measurements
            </p>

            <h2>
              Measurement set from{" "}
              {measurementDateFormatter.format(
                view
                  .selectedMeasurement
                  .measuredAt,
              )}
            </h2>

            <p className="workspace-note">
              Unit:{" "}
              {view.selectedMeasurement
                .unit ===
              "CENTIMETER"
                ? "cm"
                : "in"}
            </p>

            <dl className="portal-terms">
              {view.selectedMeasurement
                .entries.map(
                  (
                    entry,
                    index,
                  ) => (
                    <div
                      key={`${entry.label}-${index}`}
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

            {view.selectedMeasurement
              .note ? (
              <p className="workspace-note">
                {
                  view
                    .selectedMeasurement
                    .note
                }
              </p>
            ) : null}
          </section>
        ) : null}

        {view.selectedStyleReferences
          .length > 0 ? (
          <section className="portal-terms-card">
            <p className="eyebrow">
              Selected style references
            </p>

            <h2>
              Design references
            </h2>

            <div className="portal-reference-list">
              {view.selectedStyleReferences.map(
                (
                  reference,
                  index,
                ) => (
                  <article
                    key={`${reference.sourceUrl}-${index}`}
                    className="portal-reference"
                  >
                    <a
                      href={
                        reference.sourceUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {
                        reference.label ??
                        `Reference ${index + 1}`
                      }
                    </a>

                    {reference.note ? (
                      <p className="workspace-note">
                        {
                          reference.note
                        }
                      </p>
                    ) : null}
                  </article>
                ),
              )}
            </div>
          </section>
        ) : null}

        <section className="product-section">
          <div>
            <p className="eyebrow">
              Your decision
            </p>

            <h2>
              Approve or reject this proposal
            </h2>

            <p className="workspace-note">
              Approval makes these proposed
              terms the new approved
              agreement for this garment.
            </p>
          </div>

          <PortalChangeProposalDecisionForm
            action={action}
          />
        </section>
      </section>
    </main>
  );
}
