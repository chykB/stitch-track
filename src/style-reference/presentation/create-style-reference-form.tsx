"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";

import {
  createStyleReferenceAction,
} from "./actions/create-style-reference-action";
import type {
  CreateStyleReferenceActionState,
} from "./create-style-reference-action-state";

type CreateStyleReferenceFormProps =
  Readonly<{
    businessId: string;
    garmentId: string;
    garmentName: string;
  }>;

const INITIAL_STATE:
  CreateStyleReferenceActionState = {
    status: "idle",
    message: null,
    issues: [],
    styleReference: null,
  };

export function CreateStyleReferenceForm({
  businessId,
  garmentId,
  garmentName,
}: CreateStyleReferenceFormProps) {
  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  const action =
    createStyleReferenceAction.bind(
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
      state.styleReference
    ) {
      formRef.current?.reset();
    }
  }, [
    state.styleReference,
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
          Garment style references
        </p>

        <h2>
          Add style reference
        </h2>

        <p className="workspace-note">
          Record an inspiration or design
          reference for{" "}
          <strong>
            {garmentName}
          </strong>.
          References remain separate from
          any future approval decision.
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
            Reference URL
          </span>

          <input
            type="url"
            name="sourceUrl"
            placeholder="https://example.com/style"
            required
          />

          {issueFor(
            "sourceUrl",
          ) ? (
            <small className="field-error">
              {issueFor(
                "sourceUrl",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Label
            <span className="optional-label">
              {" "}Optional
            </span>
          </span>

          <input
            type="text"
            name="label"
            maxLength={200}
            placeholder="e.g. Front view"
          />

          {issueFor("label") ? (
            <small className="field-error">
              {issueFor("label")}
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
            maxLength={2000}
            placeholder="e.g. Use the neckline shape only"
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
        state.styleReference ? (
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
                  .styleReference
                  .label ??
                "Unlabelled reference"
              }
            </span>

            <span className="record-id">
              Reference ID:{" "}
              {
                state
                  .styleReference
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
            ? "Adding reference..."
            : "Add style reference"}
        </button>
      </form>
    </section>
  );
}
