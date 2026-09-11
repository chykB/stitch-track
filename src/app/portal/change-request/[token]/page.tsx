import {
  z,
} from "zod";

import {
  getRequestChangePublicPortalView,
} from "@/change-control/composition/get-request-change-portal-view";
import {
  createChangeRequestFromPortalAction,
} from "@/change-control/presentation/actions/create-change-request-from-portal-action";
import {
  PortalCreateChangeRequestForm,
} from "@/change-control/presentation/portal-create-change-request-form";
import {
  PortalUnavailable,
} from "@/change-control/presentation/portal-unavailable";
import {
  ApplicationError,
} from "@/shared/application/errors/application-error";

type PortalChangeRequestPageProps =
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

export default async function PortalChangeRequestPage({
  params,
}: PortalChangeRequestPageProps) {
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
      await getRequestChangePublicPortalView({
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
    createChangeRequestFromPortalAction.bind(
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
          Request a change
        </h1>

        <p className="workspace-note">
          Hi {view.clientName}. Review the
          current agreement for{" "}
          <strong>
            {view.garmentName}
          </strong>{" "}
          before describing the change you
          want.
        </p>

        <section
          className="portal-terms-card"
          aria-labelledby="current-agreement-title"
        >
          <div>
            <p className="eyebrow">
              Current agreement
            </p>

            <h2 id="current-agreement-title">
              Agreed terms
            </h2>
          </div>

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
        </section>

        <section className="product-section">
          <div>
            <p className="eyebrow">
              Change request
            </p>

            <h2>
              Describe your requested change
            </h2>

            <p className="workspace-note">
              Submitting this request does
              not automatically change the
              agreed price, design, or
              delivery date. The business
              will review it first.
            </p>
          </div>

          <PortalCreateChangeRequestForm
            action={action}
          />
        </section>
      </section>
    </main>
  );
}
