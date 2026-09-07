"use client";

import {
  useActionState,
} from "react";

import {
  createClientAction,
} from "./actions/create-client-action";
import type {
  CreateClientActionState,
} from "./create-client-action-state";
import {
  CreateOrderForm,
} from "../../order/presentation/create-order-form";

type CreateClientFormProps =
  Readonly<{
    businessId: string;
  }>;

const INITIAL_STATE:
  CreateClientActionState = {
    status: "idle",
    message: null,
    issues: [],
    client: null,
  };

export function CreateClientForm({
  businessId,
}: CreateClientFormProps) {
  const action =
    createClientAction.bind(
      null,
      businessId,
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
          Step 1
        </p>

        <h2>Create client</h2>

        <p className="workspace-note">
          Add the person this tailoring
          work belongs to.
        </p>
      </div>

      <form
        action={formAction}
        className="product-form"
      >
        <label className="product-field">
          <span>Client name</span>

          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            disabled={
              state.status === "success"
            }
          />

          {issueFor("name") ? (
            <small className="field-error">
              {issueFor("name")}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>Phone</span>

          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            required
            disabled={
              state.status === "success"
            }
          />

          {issueFor("phone") ? (
            <small className="field-error">
              {issueFor("phone")}
            </small>
          ) : null}
        </label>

        <label className="product-field">
          <span>
            Email
            <span className="optional-label">
              {" "}Optional
            </span>
          </span>

          <input
            type="email"
            name="email"
            autoComplete="email"
            disabled={
              state.status === "success"
            }
          />

          {issueFor("email") ? (
            <small className="field-error">
              {issueFor("email")}
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
        state.client ? (
          <div
            className="form-success"
            role="status"
          >
            <strong>
              {state.message}
            </strong>

            <span>
              {state.client.name}
            </span>

            <span className="record-id">
              Client ID:{" "}
              {state.client.id}
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
            ? "Creating client..."
            : state.status === "success"
              ? "Client created"
              : "Create client"}
        </button>
      </form>

      {state.status === "success" &&
      state.client ? (
        <CreateOrderForm
          businessId={businessId}
          clientId={state.client.id}
          clientName={state.client.name}
        />
      ) : null}
    </section>
  );
}
