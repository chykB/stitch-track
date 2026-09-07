"use client";

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
    </section>
  );
}
