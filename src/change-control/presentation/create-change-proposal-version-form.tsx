"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  createChangeProposalVersionAction,
} from "./actions/create-change-proposal-version-action";
import type {
  CreateChangeProposalVersionActionState,
} from "./create-change-proposal-version-action-state";

type MeasurementOption =
  Readonly<{
    id: string;
    measuredAt: string;
    unit:
      | "CENTIMETER"
      | "INCH";
  }>;

type StyleReferenceOption =
  Readonly<{
    id: string;
    label: string | null;
    sourceUrl: string;
  }>;

type BaselineTerms =
  Readonly<{
    measurementVersionId:
      string | null;
    designSummary: string;
    fabricDescription:
      string | null;
    quantity: number;
    priceAmount: string;
    currency: string;
    deliveryDate: string;
    note:
      string | null;
    styleReferenceIds:
      readonly string[];
  }>;

type CreateChangeProposalVersionFormProps =
  Readonly<{
    businessId: string;
    garmentId: string;
    garmentName: string;
    changeRequestId: string;
    measurementVersions:
      readonly MeasurementOption[];
    styleReferences:
      readonly StyleReferenceOption[];
    baseline:
      BaselineTerms;
  }>;

const INITIAL_STATE:
  CreateChangeProposalVersionActionState = {
    status: "idle",
    message: null,
    issues: [],
    proposal: null,
  };

const dateFormatter =
  new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeZone: "UTC",
    },
  );

export function CreateChangeProposalVersionForm({
  businessId,
  garmentId,
  garmentName,
  changeRequestId,
  measurementVersions,
  styleReferences,
  baseline,
}: CreateChangeProposalVersionFormProps) {
  const router =
    useRouter();

  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  const action =
    createChangeProposalVersionAction.bind(
      null,
      businessId,
      garmentId,
      changeRequestId,
    );

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    action,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (
      !state.proposal
    ) {
      return;
    }

    router.refresh();
  }, [
    router,
    state.proposal,
  ]);

  function issueFor(
    path: string,
  ): string | undefined {
    return state.issues.find(
      (issue) =>
        issue.path === path,
    )?.message;
  }

  return (
    <section className="product-section">
      <div>
        <p className="eyebrow">
          Change proposal
        </p>

        <h2>
          Create revised proposal
        </h2>

        <p className="workspace-note">
          Record the complete proposed
          terms for{" "}
          <strong>
            {garmentName}
          </strong>.
          The approved baseline remains
          unchanged until this proposal is
          approved and applied.
        </p>
      </div>

      <div className="workflow-parent">
        <span className="summary-label">
          Change request
        </span>

        <strong>
          Active request
        </strong>

        <span className="record-id">
          Request ID: {changeRequestId}
        </span>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="product-form"
      >
        <label className="product-field">
          <span>
            Measurement version
            <span className="optional-label">
              {" "}Optional
            </span>
          </span>

          <select
            name="measurementVersionId"
            defaultValue={
              baseline
                .measurementVersionId ??
              ""
            }
          >
            <option value="">
              No measurement version
            </option>

            {measurementVersions.map(
              (version) => (
                <option
                  key={version.id}
                  value={version.id}
                >
                  {dateFormatter.format(
                    new Date(
                      version.measuredAt,
                    ),
                  )}
                  {" · "}
                  {version.unit ===
                  "CENTIMETER"
                    ? "cm"
                    : "in"}
                </option>
              ),
            )}
          </select>

          {issueFor(
            "measurementVersionId",
          ) ? (
            <small className="field-error">
              {issueFor(
                "measurementVersionId",
              )}
            </small>
          ) : null}
        </label>

        <fieldset className="agreement-option-group">
          <legend>
            Style references
            <span className="optional-label">
              {" "}Optional
            </span>
          </legend>

          {styleReferences.length ===
          0 ? (
            <p className="workspace-note">
              No style references are
              available for this garment.
            </p>
          ) : (
            <div className="agreement-option-list">
              {styleReferences.map(
                (reference) => (
                  <label
                    className="agreement-option"
                    key={reference.id}
                  >
                    <input
                      type="checkbox"
                      name="styleReferenceId"
                      value={reference.id}
                      defaultChecked={
                        baseline
                          .styleReferenceIds
                          .includes(
                            reference.id,
                          )
                      }
                    />

                    <span>
                      <strong>
                        {reference.label ??
                          "Unlabelled reference"}
                      </strong>

                      <small className="record-id">
                        {reference.id}
                      </small>
                    </span>
                  </label>
                ),
              )}
            </div>
          )}

          {issueFor(
            "styleReferenceIds",
          ) ? (
            <small className="field-error">
              {issueFor(
                "styleReferenceIds",
              )}
            </small>
          ) : null}
        </fieldset>

        <label className="product-field">
          <span>
            Design summary
          </span>

          <textarea
            name="designSummary"
            rows={5}
            required
            defaultValue={
              baseline.designSummary
            }
          />

          {issueFor(
            "designSummary",
          ) ? (
            <small className="field-error">
              {issueFor(
                "designSummary",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Fabric description
            <span className="optional-label">
              {" "}Optional
            </span>
          </span>

          <textarea
            name="fabricDescription"
            rows={3}
            defaultValue={
              baseline
                .fabricDescription ??
              ""
            }
          />

          {issueFor(
            "fabricDescription",
          ) ? (
            <small className="field-error">
              {issueFor(
                "fabricDescription",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Quantity
          </span>

          <input
            type="number"
            name="quantity"
            min={1}
            step={1}
            required
            defaultValue={
              baseline.quantity
            }
          />

          {issueFor(
            "quantity",
          ) ? (
            <small className="field-error">
              {issueFor(
                "quantity",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Proposed price
          </span>

          <input
            type="text"
            inputMode="decimal"
            name="priceAmount"
            required
            defaultValue={
              baseline.priceAmount
            }
          />

          {issueFor(
            "priceAmount",
          ) ? (
            <small className="field-error">
              {issueFor(
                "priceAmount",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Currency
          </span>

          <input
            type="text"
            name="currency"
            value={
              baseline.currency
            }
            readOnly
            aria-readonly="true"
          />

          <small className="workspace-note">
            Change proposals keep the
            approved baseline currency.
          </small>

          {issueFor(
            "currency",
          ) ? (
            <small className="field-error">
              {issueFor(
                "currency",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Proposed delivery date
          </span>

          <input
            type="date"
            name="deliveryDate"
            required
            defaultValue={
              baseline.deliveryDate
            }
          />

          {issueFor(
            "deliveryDate",
          ) ? (
            <small className="field-error">
              {issueFor(
                "deliveryDate",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Note
            <span className="optional-label">
              {" "}Optional
            </span>
          </span>

          <textarea
            name="note"
            rows={3}
            defaultValue={
              baseline.note ??
              ""
            }
          />

          {issueFor(
            "note",
          ) ? (
            <small className="field-error">
              {issueFor(
                "note",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Proposal rationale
          </span>

          <textarea
            name="rationale"
            rows={4}
            required
            placeholder="Explain why these terms change and the effect on price, delivery, design, or other commitments."
          />

          {issueFor(
            "rationale",
          ) ? (
            <small className="field-error">
              {issueFor(
                "rationale",
              )}
            </small>
          ) : null}
        </label>

        {state.status === "error" ? (
          <p
            className="form-error"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        {state.status === "success" &&
        state.proposal ? (
          <div
            className="form-success"
            role="status"
          >
            <strong>
              {state.message}
            </strong>

            <span>
              Proposal revision{" "}
              {
                state
                  .proposal
                  .revisionNumber
              }
            </span>
          </div>
        ) : null}

        <button
          className="primary-button"
          type="submit"
          disabled={isPending}
        >
          {isPending
            ? "Creating proposal..."
            : "Create change proposal"}
        </button>
      </form>
    </section>
  );
}
