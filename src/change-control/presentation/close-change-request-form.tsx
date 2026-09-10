"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  closeChangeRequestAction,
} from "./actions/close-change-request-action";
import type {
  CloseChangeRequestActionState,
} from "./close-change-request-action-state";

type ClosureOutcome =
  | "WITHDRAWN"
  | "IMPOSSIBLE";

type CloseChangeRequestFormProps =
  Readonly<{
    businessId: string;
    garmentId: string;
    changeRequestId: string;
  }>;

const INITIAL_STATE:
  CloseChangeRequestActionState = {
    status: "idle",
    message: null,
    issues: [],
    closure: null,
  };

export function CloseChangeRequestForm({
  businessId,
  garmentId,
  changeRequestId,
}: CloseChangeRequestFormProps) {
  const router =
    useRouter();

  const occurredAtRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    outcome,
    setOutcome,
  ] = useState<ClosureOutcome>(
    "WITHDRAWN",
  );

  const action =
    closeChangeRequestAction.bind(
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
      !state.closure
    ) {
      return;
    }

    router.refresh();
  }, [
    router,
    state.closure,
  ]);

  function issueFor(
    path: string,
  ): string | undefined {
    return state.issues.find(
      (issue) =>
        issue.path === path,
    )?.message;
  }

  function stampOccurredAt():
    void {
    if (
      occurredAtRef.current
    ) {
      occurredAtRef.current.value =
        new Date()
          .toISOString();
    }
  }

  return (
    <section className="product-section">
      <div>
        <p className="eyebrow">
          Change control
        </p>

        <h2>
          Close change request
        </h2>

        <p className="workspace-note">
          Close this request without
          applying a proposal. The closure
          becomes part of the immutable
          change-control history.
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
        action={formAction}
        className="product-form"
        onSubmit={
          stampOccurredAt
        }
      >
        <input
          ref={occurredAtRef}
          type="hidden"
          name="occurredAt"
          defaultValue=""
        />

        <label className="product-field">
          <span>
            Closure outcome
          </span>

          <select
            name="outcome"
            value={outcome}
            onChange={(event) =>
              setOutcome(
                event.target
                  .value as
                  ClosureOutcome,
              )
            }
            required
          >
            <option value="WITHDRAWN">
              Withdrawn
            </option>

            <option value="IMPOSSIBLE">
              Impossible
            </option>
          </select>

          {issueFor(
            "outcome",
          ) ? (
            <small className="field-error">
              {issueFor(
                "outcome",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Closure reason
          </span>

          <textarea
            name="reason"
            rows={4}
            required
            placeholder={
              outcome ===
              "WITHDRAWN"
                ? "Explain why the change request is being withdrawn."
                : "Explain why this requested change cannot be completed."
            }
          />

          {issueFor(
            "reason",
          ) ? (
            <small className="field-error">
              {issueFor(
                "reason",
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
        state.closure ? (
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
                  .closure
                  .outcome
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
            ? "Closing request..."
            : outcome ===
              "WITHDRAWN"
              ? "Withdraw change request"
              : "Mark change impossible"}
        </button>
      </form>
    </section>
  );
}
