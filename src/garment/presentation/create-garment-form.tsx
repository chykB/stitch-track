"use client";

import Link from "next/link";
import {
  useActionState,
} from "react";

import {
  createGarmentAction,
} from "./actions/create-garment-action";
import type {
  CreateGarmentActionState,
} from "./create-garment-action-state";

type CreateGarmentFormProps =
  Readonly<{
    businessId: string;
    clientId: string;
    clientName: string;
    orderId: string;
  }>;

const INITIAL_STATE:
  CreateGarmentActionState = {
    status: "idle",
    message: null,
    issues: [],
    garment: null,
  };

export function CreateGarmentForm({
  businessId,
  clientId,
  clientName,
  orderId,
}: CreateGarmentFormProps) {
  const action =
    createGarmentAction.bind(
      null,
      businessId,
      orderId,
    );

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    action,
    INITIAL_STATE,
  );

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
          Step 3
        </p>

        <h2>Add garment</h2>

        <p className="workspace-note">
          Record the physical garment
          being made for this order.
        </p>
      </div>

      <div className="workflow-parent">
        <span className="summary-label">
          Order
        </span>

        <strong>
          Current order
        </strong>

        <span className="record-id">
          Order ID: {orderId}
        </span>
      </div>

      <form
        action={formAction}
        className="product-form"
      >
        <label className="product-field">
          <span>Garment name</span>

          <input
            type="text"
            name="name"
            required
          />

          {issueFor("name") ? (
            <small className="field-error">
              {issueFor("name")}
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
        state.garment ? (
          <div
            className="form-success"
            role="status"
          >
            <strong>
              {state.message}
            </strong>

            <span>
              {state.garment.name}
            </span>

            <span className="record-id">
              Garment ID:{" "}
              {state.garment.id}
            </span>
          </div>
        ) : null}

        <button
          className="primary-button"
          type="submit"
          disabled={
            isPending ||
            state.status === "success"
          }
        >
          {isPending
            ? "Creating garment..."
            : state.status === "success"
              ? "Garment created"
              : "Add garment"}
        </button>
      </form>

      {state.status === "success" &&
      state.garment ? (
        <section
          className="workflow-complete"
          aria-labelledby="workflow-complete-title"
        >
          <div>
            <p className="eyebrow">
              Workflow complete
            </p>

            <h3 id="workflow-complete-title">
              Client, order, and garment created
            </h3>

            <p className="workspace-note">
              The V0.3 tailoring workflow
              has been recorded successfully.
            </p>
          </div>

          <div className="workflow-records">
            <div className="workflow-record">
              <span className="summary-label">
                Client
              </span>

              <strong>
                {clientName}
              </strong>

              <span className="record-id">
                {clientId}
              </span>
            </div>

            <div className="workflow-record">
              <span className="summary-label">
                Order
              </span>

              <strong>
                Tailoring order
              </strong>

              <span className="record-id">
                {orderId}
              </span>
            </div>

            <div className="workflow-record">
              <span className="summary-label">
                Garment
              </span>

              <strong>
                {state.garment.name}
              </strong>

              <span className="record-id">
                {state.garment.id}
              </span>
            </div>
          </div>

          <Link
            className="secondary-button workflow-new-link"
            href={`/app/${businessId}`}
          >
            Start another workflow
          </Link>
        </section>
      ) : null}
    </section>
  );
}
