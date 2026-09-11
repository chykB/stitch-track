"use client";

import {
  useActionState,
} from "react";

import type {
  PortalChangeProposalDecisionActionState,
} from "./portal-change-proposal-decision-action-state";

type PortalDecisionAction =
  (
    previousState:
      PortalChangeProposalDecisionActionState,
    formData:
      FormData,
  ) => Promise<
    PortalChangeProposalDecisionActionState
  >;

type PortalChangeProposalDecisionFormProps =
  Readonly<{
    action:
      PortalDecisionAction;
  }>;

const INITIAL_STATE:
  PortalChangeProposalDecisionActionState = {
    status:
      "idle",
    message:
      null,
    issues: [],
    decision:
      null,
  };

export function PortalChangeProposalDecisionForm({
  action,
}: PortalChangeProposalDecisionFormProps) {
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
    state.decision
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
          {state.decision ===
          "APPROVED"
            ? "The approved proposal has been applied as the new agreement."
            : "The business can now revise the proposal if appropriate."}
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
          Note
          <span className="optional-label">
            {" "}Optional
          </span>
        </span>

        <textarea
          name="clientNote"
          rows={4}
          maxLength={2000}
          placeholder="Add any comment you want the business to keep with your decision."
        />

        {issueFor(
          "clientNote",
        ) ? (
          <small className="field-error">
            {issueFor(
              "clientNote",
            )}
          </small>
        ) : null}
      </label>

      {issueFor(
        "outcome",
      ) ? (
        <p className="field-error">
          {issueFor(
            "outcome",
          )}
        </p>
      ) : null}

      {state.status ===
      "error" ? (
        <p
          className="form-error"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="portal-actions">
        <button
          className="primary-button"
          type="submit"
          name="outcome"
          value="APPROVED"
          disabled={isPending}
        >
          {isPending
            ? "Submitting..."
            : "Approve proposal"}
        </button>

        <button
          className="secondary-button"
          type="submit"
          name="outcome"
          value="REJECTED"
          disabled={isPending}
        >
          {isPending
            ? "Submitting..."
            : "Reject proposal"}
        </button>
      </div>
    </form>
  );
}
