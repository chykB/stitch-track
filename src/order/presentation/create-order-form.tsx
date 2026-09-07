"use client";

import {
  useActionState,
} from "react";

import {
  createOrderAction,
} from "./actions/create-order-action";
import type {
  CreateOrderActionState,
} from "./create-order-action-state";

type CreateOrderFormProps =
  Readonly<{
    businessId: string;
    clientId: string;
    clientName: string;
  }>;

const INITIAL_STATE:
  CreateOrderActionState = {
    status: "idle",
    message: null,
    issues: [],
    order: null,
  };

export function CreateOrderForm({
  businessId,
  clientId,
  clientName,
}: CreateOrderFormProps) {
  const action =
    createOrderAction.bind(
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

  return (
    <section className="product-section">
      <div>
        <p className="eyebrow">
          Step 2
        </p>

        <h2>Create order</h2>

        <p className="workspace-note">
          Start a tailoring order for{" "}
          <strong>{clientName}</strong>.
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
        action={formAction}
        className="product-form"
      >
        {state.status === "error" ? (
          <p
            className="form-error"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        {state.status === "success" &&
        state.order ? (
          <div
            className="form-success"
            role="status"
          >
            <strong>
              {state.message}
            </strong>

            <span className="record-id">
              Order ID:{" "}
              {state.order.id}
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
            ? "Creating order..."
            : state.status === "success"
              ? "Order created"
              : "Create order"}
        </button>
      </form>
    </section>
  );
}
