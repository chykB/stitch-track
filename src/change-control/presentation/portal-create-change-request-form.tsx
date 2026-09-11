"use client";

import {
  useActionState,
} from "react";

import type {
  PortalCreateChangeRequestActionState,
} from "./portal-create-change-request-action-state";

type PortalCreateChangeRequestAction =
  (
    previousState:
      PortalCreateChangeRequestActionState,
    formData:
      FormData,
  ) => Promise<
    PortalCreateChangeRequestActionState
  >;

type PortalCreateChangeRequestFormProps =
  Readonly<{
    action:
      PortalCreateChangeRequestAction;
  }>;

const INITIAL_STATE:
  PortalCreateChangeRequestActionState = {
    status:
      "idle",
    message:
      null,
    issues: [],
    submitted:
      false,
  };

export function PortalCreateChangeRequestForm({
  action,
}: PortalCreateChangeRequestFormProps) {
  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      action,
      INITIAL_STATE,
    );

  function issueFor(
    path: string,
  ): string | undefined {
    return state.issues.find(
      (issue) =>
        issue.path ===
        path,
    )?.message;
  }

  if (
    state.status ===
      "success" &&
    state.submitted
  ) {
    return (
      <div
        className="form-success"
        role="status"
      >
        <strong>
          {state.message}
        </strong>

        <span>
          The business can now review your
          request and prepare updated terms
          if needed.
        </span>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="product-form"
    >
      <label className="product-field">
        <span>
          What would you like to change?
        </span>

        <textarea
          name="description"
          rows={6}
          required
          placeholder="Describe the change you want to make to this garment."
        />

        {issueFor(
          "description",
        ) ? (
          <small className="field-error">
            {issueFor(
              "description",
            )}
          </small>
        ) : null}
      </label>

      {state.status ===
      "error" ? (
        <p
          className="form-error"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="primary-button"
        type="submit"
        disabled={isPending}
      >
        {isPending
          ? "Submitting request..."
          : "Submit change request"}
      </button>
    </form>
  );
}
