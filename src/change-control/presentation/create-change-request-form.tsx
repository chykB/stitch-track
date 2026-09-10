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
  createChangeRequestAction,
} from "./actions/create-change-request-action";
import type {
  CreateChangeRequestActionState,
} from "./create-change-request-action-state";

type RequestedBy =
  | "CLIENT"
  | "BUSINESS";

type CreateChangeRequestFormProps =
  Readonly<{
    businessId: string;
    garmentId: string;
    garmentName: string;
  }>;

const INITIAL_STATE:
  CreateChangeRequestActionState = {
    status: "idle",
    message: null,
    issues: [],
    changeRequest: null,
  };

export function CreateChangeRequestForm({
  businessId,
  garmentId,
  garmentName,
}: CreateChangeRequestFormProps) {
  const router =
    useRouter();

  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  const requestedAtRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    requestedBy,
    setRequestedBy,
  ] = useState<RequestedBy>(
    "CLIENT",
  );

  const action =
    createChangeRequestAction.bind(
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
      !state.changeRequest
    ) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [
    router,
    state.changeRequest,
  ]);

  function issueFor(
    path: string,
  ): string | undefined {
    return state.issues.find(
      (issue) =>
        issue.path === path,
    )?.message;
  }

  function stampRequestedAt():
    void {
    if (
      requestedAtRef.current
    ) {
      requestedAtRef.current.value =
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
          Record change request
        </h2>

        <p className="workspace-note">
          Start controlled change work for{" "}
          <strong>
            {garmentName}
          </strong>.
          The current approved agreement
          remains the baseline until a
          proposal is approved and applied.
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
        onSubmit={
          stampRequestedAt
        }
      >
        <input
          ref={requestedAtRef}
          type="hidden"
          name="requestedAt"
          defaultValue=""
        />

        <label className="product-field">
          <span>
            Requested by
          </span>

          <select
            name="requestedBy"
            value={requestedBy}
            onChange={(event) =>
              setRequestedBy(
                event.target
                  .value as
                  RequestedBy,
              )
            }
            required
          >
            <option value="CLIENT">
              Client
            </option>

            <option value="BUSINESS">
              Business
            </option>
          </select>

          {issueFor(
            "requestedBy",
          ) ? (
            <small className="field-error">
              {issueFor(
                "requestedBy",
              )}
            </small>
          ) : null}
        </label>

        {requestedBy ===
        "CLIENT" ? (
          <label className="product-field">
            <span>
              Client request channel
            </span>

            <select
              name="requestChannel"
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
              "requestChannel",
            ) ? (
              <small className="field-error">
                {issueFor(
                  "requestChannel",
                )}
              </small>
            ) : null}
          </label>
        ) : (
          <input
            type="hidden"
            name="requestChannel"
            value=""
          />
        )}

        <label className="product-field">
          <span>
            Requested change
          </span>

          <textarea
            name="description"
            rows={5}
            required
            placeholder="Describe exactly what is being requested to change."
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

        {state.status === "error" ? (
          <p
            className="form-error"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        {state.status === "success" &&
        state.changeRequest ? (
          <div
            className="form-success"
            role="status"
          >
            <strong>
              {state.message}
            </strong>

            <span>
              Change request{" "}
              {
                state
                  .changeRequest
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
            ? "Recording request..."
            : "Record change request"}
        </button>
      </form>
    </section>
  );
}
