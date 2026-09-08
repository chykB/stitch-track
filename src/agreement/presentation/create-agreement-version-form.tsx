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
  createAgreementVersionAction,
} from "./actions/create-agreement-version-action";
import type {
  CreateAgreementVersionActionState,
} from "./create-agreement-version-action-state";

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

type CreateAgreementVersionFormProps =
  Readonly<{
    businessId: string;
    garmentId: string;
    garmentName: string;
    measurementVersions:
      readonly MeasurementOption[];
    styleReferences:
      readonly StyleReferenceOption[];
  }>;

const INITIAL_STATE:
  CreateAgreementVersionActionState = {
    status: "idle",
    message: null,
    issues: [],
    agreementVersion: null,
  };

const dateFormatter =
  new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeZone: "UTC",
    },
  );

export function CreateAgreementVersionForm({
  businessId,
  garmentId,
  garmentName,
  measurementVersions,
  styleReferences,
}: CreateAgreementVersionFormProps) {
  const router =
    useRouter();

  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  const action =
    createAgreementVersionAction.bind(
      null,
      businessId,
      garmentId,
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
      !state.agreementVersion
    ) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [
    router,
    state.agreementVersion,
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
          Agreement
        </p>

        <h2>
          Create agreement version
        </h2>

        <p className="workspace-note">
          Record the exact commercial and
          design understanding for{" "}
          <strong>
            {garmentName}
          </strong>.
          Once created, this revision remains
          unchanged.
        </p>
      </div>

      <div className="workflow-parent">
        <span className="summary-label">
          Garment
        </span>

        <strong>
          {garmentName}
        </strong>

        <span className="record-id">
          Garment ID: {garmentId}
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
            defaultValue=""
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
            placeholder="Describe the agreed garment design."
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
            placeholder="e.g. Client supplied Ankara"
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
          <span>Quantity</span>

          <input
            type="number"
            name="quantity"
            min={1}
            step={1}
            defaultValue="1"
            required
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
          <span>Price</span>

          <input
            type="text"
            inputMode="decimal"
            name="priceAmount"
            placeholder="e.g. 80000"
            required
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
            defaultValue="NGN"
            maxLength={3}
            required
          />

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
            Delivery date
          </span>

          <input
            type="date"
            name="deliveryDate"
            required
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
            rows={4}
            placeholder="Additional agreement context"
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

        {state.status === "error" ? (
          <p
            className="form-error"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        {state.status === "success" &&
        state.agreementVersion ? (
          <div
            className="form-success"
            role="status"
          >
            <strong>
              {state.message}
            </strong>

            <span>
              Revision{" "}
              {
                state
                  .agreementVersion
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
            ? "Creating agreement..."
            : "Create agreement version"}
        </button>
      </form>
    </section>
  );
}
