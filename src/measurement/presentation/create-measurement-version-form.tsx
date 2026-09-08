"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createMeasurementVersionAction,
} from "./actions/create-measurement-version-action";
import type {
  CreateMeasurementVersionActionState,
} from "./create-measurement-version-action-state";

type CreateMeasurementVersionFormProps =
  Readonly<{
    businessId: string;
    clientId: string;
    clientName: string;
  }>;

type MeasurementRow =
  Readonly<{
    id: number;
  }>;

const INITIAL_STATE:
  CreateMeasurementVersionActionState = {
    status: "idle",
    message: null,
    issues: [],
    measurementVersion: null,
  };

export function CreateMeasurementVersionForm({
  businessId,
  clientId,
  clientName,
}: CreateMeasurementVersionFormProps) {
  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  const nextRowId =
    useRef(2);

  const [
    rows,
    setRows,
  ] = useState<
    readonly MeasurementRow[]
  >([
    {
      id: 1,
    },
  ]);

  const action =
    createMeasurementVersionAction.bind(
      null,
      businessId,
      clientId,
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
      !state.measurementVersion
    ) {
      return;
    }

    formRef.current?.reset();

    setRows([
      {
        id:
          nextRowId.current++,
      },
    ]);
  }, [
    state.measurementVersion,
  ]);

  function addRow(): void {
    setRows(
      (currentRows) => [
        ...currentRows,
        {
          id:
            nextRowId.current++,
        },
      ],
    );
  }

  function removeRow(
    rowId: number,
  ): void {
    setRows(
      (currentRows) =>
        currentRows.length === 1
          ? currentRows
          : currentRows.filter(
              (row) =>
                row.id !== rowId,
            ),
    );
  }

  function issueFor(
    path: string,
  ): string | undefined {
    return state.issues.find(
      (issue) =>
        issue.path === path,
    )?.message;
  }

  function entryIssue(
    index: number,
    field:
      | "label"
      | "value",
  ): string | undefined {
    const suffix =
      `entries.${index}.${field}`;

    return state.issues.find(
      (issue) =>
        issue.path === suffix,
    )?.message;
  }

  return (
    <section className="product-section">
      <div>
        <p className="eyebrow">
          Client measurements
        </p>

        <h2>
          Record measurement history
        </h2>

        <p className="workspace-note">
          Add a dated measurement set for{" "}
          <strong>
            {clientName}
          </strong>.
          Older measurement sets remain
          unchanged.
        </p>
      </div>

      <div className="workflow-parent">
        <span className="summary-label">
          Client
        </span>

        <strong>
          {clientName}
        </strong>

        <span className="record-id">
          Client ID: {clientId}
        </span>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="product-form"
      >
        <label className="product-field">
          <span>
            Measurement date
          </span>

          <input
            type="date"
            name="measuredAt"
            required
          />

          {issueFor(
            "measuredAt",
          ) ? (
            <small className="field-error">
              {issueFor(
                "measuredAt",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>Unit</span>

          <select
            name="unit"
            defaultValue="CENTIMETER"
            required
          >
            <option value="CENTIMETER">
              Centimetres
            </option>

            <option value="INCH">
              Inches
            </option>
          </select>

          {issueFor("unit") ? (
            <small className="field-error">
              {issueFor("unit")}
            </small>
          ) : null}
        </label>

        <div className="measurement-list">
          <div className="measurement-list-heading">
            <div>
              <strong>
                Measurements
              </strong>

              <p className="workspace-note">
                Use the names your
                business normally uses.
              </p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={addRow}
            >
              Add measurement
            </button>
          </div>

          {rows.map(
            (row, index) => (
              <div
                className="measurement-row"
                key={row.id}
              >
                <label className="product-field">
                  <span>
                    Measurement name
                  </span>

                  <input
                    type="text"
                    name="measurementLabel"
                    placeholder="e.g. Waist"
                    required
                  />

                  {entryIssue(
                    index,
                    "label",
                  ) ? (
                    <small className="field-error">
                      {entryIssue(
                        index,
                        "label",
                      )}
                    </small>
                  ) : null}
                </label>

                <label className="product-field">
                  <span>Value</span>

                  <input
                    type="text"
                    inputMode="decimal"
                    name="measurementValue"
                    placeholder="e.g. 80.5"
                    required
                  />

                  {entryIssue(
                    index,
                    "value",
                  ) ? (
                    <small className="field-error">
                      {entryIssue(
                        index,
                        "value",
                      )}
                    </small>
                  ) : null}
                </label>

                <button
                  className="secondary-button measurement-remove"
                  type="button"
                  disabled={
                    rows.length === 1
                  }
                  onClick={() =>
                    removeRow(
                      row.id,
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ),
          )}
        </div>

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
            maxLength={2000}
          />

          {issueFor("note") ? (
            <small className="field-error">
              {issueFor("note")}
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
        state.measurementVersion ? (
          <div
            className="form-success"
            role="status"
          >
            <strong>
              {state.message}
            </strong>

            <span>
              {
                state
                  .measurementVersion
                  .entryCount
              }{" "}
              measurement
              {
                state
                  .measurementVersion
                  .entryCount === 1
                  ? ""
                  : "s"
              }{" "}
              recorded.
            </span>

            <span className="record-id">
              Version ID:{" "}
              {
                state
                  .measurementVersion
                  .id
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
            ? "Recording measurements..."
            : "Record measurement set"}
        </button>
      </form>
    </section>
  );
}
