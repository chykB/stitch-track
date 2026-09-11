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
  recordChangeProposalDecisionAction,
} from "./actions/record-change-proposal-decision-action";
import type {
  RecordChangeProposalDecisionActionState,
} from "./record-change-proposal-decision-action-state";

type DecisionOutcome =
  | "APPROVED"
  | "REJECTED";

type RecordChangeProposalDecisionFormProps =
  Readonly<{
    businessId: string;
    garmentId: string;
    changeRequestId: string;
    changeProposalVersionId: string;
    proposalRevisionNumber: number;
  }>;

const INITIAL_STATE:
  RecordChangeProposalDecisionActionState = {
    status: "idle",
    message: null,
    issues: [],
    decision: null,
  };

export function RecordChangeProposalDecisionForm({
  businessId,
  garmentId,
  changeRequestId,
  changeProposalVersionId,
  proposalRevisionNumber,
}: RecordChangeProposalDecisionFormProps) {
  const router =
    useRouter();

  const occurredAtRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    outcome,
    setOutcome,
  ] = useState<DecisionOutcome>(
    "APPROVED",
  );

  const action =
    recordChangeProposalDecisionAction.bind(
      null,
      businessId,
      garmentId,
      changeRequestId,
      changeProposalVersionId,
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
      !state.decision
    ) {
      return;
    }

    router.refresh();
  }, [
    router,
    state.decision,
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
          Client decision
        </p>

        <h2>
          Resolve proposal revision{" "}
          {proposalRevisionNumber}
        </h2>

        <p className="workspace-note">
          Record the client&apos;s decision
          on the current proposal.
          Approval atomically applies the
          proposed terms as the next
          approved agreement revision.
        </p>
      </div>

      <div className="workflow-parent">
        <span className="summary-label">
          Change proposal
        </span>

        <strong>
          Revision{" "}
          {proposalRevisionNumber}
        </strong>

        <span className="record-id">
          Proposal ID:{" "}
          {changeProposalVersionId}
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
            Client decision
          </span>

          <select
            name="outcome"
            value={outcome}
            onChange={(event) =>
              setOutcome(
                event.target
                  .value as
                  DecisionOutcome,
              )
            }
            required
          >
            <option value="APPROVED">
              Approved
            </option>

            <option value="REJECTED">
              Rejected
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
            Client decision channel
          </span>

          <select
            name="clientDecisionChannel"
            defaultValue="WHATSAPP"
            required
          >
            <option value="WHATSAPP">
              WhatsApp
            </option>

            <option value="EMAIL">
              Email
            </option>

            <option value="PHONE">
              Phone
            </option>

            <option value="IN_PERSON">
              In person
            </option>

            <option value="OTHER">
              Other
            </option>
          </select>

          {issueFor(
            "clientDecisionChannel",
          ) ? (
            <small className="field-error">
              {issueFor(
                "clientDecisionChannel",
              )}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Decision evidence
          </span>

          <textarea
            name="evidenceNote"
            rows={4}
            required
            placeholder={
              outcome ===
              "APPROVED"
                ? "Record what the client communicated when approving these proposed terms."
                : "Record what the client rejected and any useful evidence."
            }
          />

          {issueFor(
            "evidenceNote",
          ) ? (
            <small className="field-error">
              {issueFor(
                "evidenceNote",
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
        state.decision ? (
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
                  .decision
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
            ? "Recording decision..."
            : outcome ===
              "APPROVED"
              ? "Approve and apply proposal"
              : "Record proposal rejection"}
        </button>
      </form>
    </section>
  );
}
