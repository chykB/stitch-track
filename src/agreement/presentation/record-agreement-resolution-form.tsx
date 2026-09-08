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
  recordAgreementResolutionAction,
} from "./actions/record-agreement-resolution-action";
import type {
  RecordAgreementResolutionActionState,
} from "./record-agreement-resolution-action-state";

type AgreementResolutionOutcome =
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

type RecordAgreementResolutionFormProps =
  Readonly<{
    businessId: string;
    garmentId: string;
    agreementVersionId: string;
    revisionNumber: number;
  }>;

const INITIAL_STATE:
  RecordAgreementResolutionActionState = {
    status: "idle",
    message: null,
    issues: [],
    resolution: null,
  };

export function RecordAgreementResolutionForm({
  businessId,
  garmentId,
  agreementVersionId,
  revisionNumber,
}: RecordAgreementResolutionFormProps) {
  const router =
    useRouter();

  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  const occurredAtRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    outcome,
    setOutcome,
  ] = useState<
    AgreementResolutionOutcome
  >("APPROVED");

  const action =
    recordAgreementResolutionAction.bind(
      null,
      businessId,
      garmentId,
      agreementVersionId,
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
      !state.resolution
    ) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [
    router,
    state.resolution,
  ]);

  function issueFor(
    path: string,
  ): string | undefined {
    return state.issues.find(
      (issue) =>
        issue.path === path,
    )?.message;
  }

  function stampOccurredAt(): void {
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
          Agreement decision
        </p>

        <h2>
          Resolve revision{" "}
          {revisionNumber}
        </h2>

        <p className="workspace-note">
          Record the terminal outcome for
          this pending revision. This
          evidence becomes part of the
          immutable agreement history.
        </p>
      </div>

      <form
        ref={formRef}
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
          <span>Outcome</span>

          <select
            name="outcome"
            value={outcome}
            onChange={(event) =>
              setOutcome(
                event.target
                  .value as
                  AgreementResolutionOutcome,
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

            <option value="WITHDRAWN">
              Withdrawn
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

        {outcome !==
        "WITHDRAWN" ? (
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
        ) : (
          <input
            type="hidden"
            name="clientDecisionChannel"
            value=""
          />
        )}

        <label className="product-field">
          <span>
            Evidence note
          </span>

          <textarea
            name="evidenceNote"
            rows={4}
            required
            placeholder={
              outcome ===
              "WITHDRAWN"
                ? "Why was this agreement version withdrawn?"
                : "Record what the client communicated and any useful evidence."
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
        state.resolution ? (
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
                  .resolution
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
            : "Record agreement decision"}
        </button>
      </form>
    </section>
  );
}
