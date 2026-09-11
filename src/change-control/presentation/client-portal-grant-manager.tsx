"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  issueChangeProposalDecisionPortalGrantAction,
} from "./actions/issue-change-proposal-decision-portal-grant-action";
import {
  issueRequestChangePortalGrantAction,
} from "./actions/issue-request-change-portal-grant-action";
import {
  revokeClientPortalGrantAction,
} from "./actions/revoke-client-portal-grant-action";
import type {
  IssueClientPortalGrantActionState,
  RevokeClientPortalGrantActionState,
} from "./client-portal-grant-action-state";

type OutstandingPortalGrantView =
  Readonly<{
    id: string;
    purpose:
      | "REQUEST_CHANGE"
      | "DECIDE_CHANGE_PROPOSAL";
    changeProposalVersionId:
      string | null;
    expiresAt: string;
    createdAt: string;
  }>;

type DecisionPortalTarget =
  Readonly<{
    changeRequestId: string;
    changeProposalVersionId:
      string;
    proposalRevisionNumber:
      number;
  }>;

type ClientPortalGrantManagerProps =
  Readonly<{
    businessId: string;
    garmentId: string;
    canIssueRequestChange:
      boolean;
    decisionTarget:
      DecisionPortalTarget | null;
    outstandingGrants:
      readonly OutstandingPortalGrantView[];
  }>;

const ISSUE_INITIAL_STATE:
  IssueClientPortalGrantActionState = {
    status:
      "idle",
    message:
      null,
    issues: [],
    grant:
      null,
  };

const REVOKE_INITIAL_STATE:
  RevokeClientPortalGrantActionState = {
    status:
      "idle",
    message:
      null,
    issues: [],
    grant:
      null,
  };

function IssuedPortalLink({
  state,
}: Readonly<{
  state:
    IssueClientPortalGrantActionState;
}>) {
  const [
    copied,
    setCopied,
  ] = useState(
    false,
  );

  if (
    state.status !==
      "success" ||
    !state.grant
  ) {
    return null;
  }

  const portalPath =
    state.grant.portalPath;

  async function copyLink():
    Promise<void> {
    const absoluteUrl =
      `${window.location.origin}${portalPath}`;

    await navigator.clipboard
      .writeText(
        absoluteUrl,
      );

    setCopied(
      true,
    );
  }

  return (
    <div
      className="form-success"
      role="status"
    >
      <strong>
        {state.message}
      </strong>

      <label className="product-field">
        <span>
          One-time portal link
        </span>

        <input
          readOnly
          value={portalPath}
          onFocus={(event) =>
            event.currentTarget
              .select()
          }
        />
      </label>

      <div className="workflow-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={copyLink}
        >
          {copied
            ? "Copied"
            : "Copy full link"}
        </button>

        <a
          className="secondary-button"
          href={portalPath}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open portal ↗
        </a>
      </div>

      <small className="workspace-note">
        Expires{" "}
        {new Date(
          state.grant.expiresAt,
        ).toLocaleString()}.
        This exact link cannot be
        reconstructed after it leaves
        this action state.
      </small>
    </div>
  );
}

function RequestChangePortalIssuer({
  businessId,
  garmentId,
}: Readonly<{
  businessId: string;
  garmentId: string;
}>) {
  const action =
    issueRequestChangePortalGrantAction.bind(
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
    ISSUE_INITIAL_STATE,
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

  return (
    <div className="history-card">
      <div>
        <span className="summary-label">
          Client request link
        </span>

        <strong>
          Let the client request the next
          change
        </strong>

        <p className="workspace-note">
          The link is a narrow capability
          for this garment. A successful
          submission consumes it.
        </p>
      </div>

      <form
        action={formAction}
        className="product-form"
      >
        <label className="product-field">
          <span>
            Link validity
          </span>

          <select
            name="validForHours"
            defaultValue="72"
          >
            <option value="24">
              24 hours
            </option>

            <option value="72">
              3 days
            </option>

            <option value="168">
              7 days
            </option>
          </select>

          {issueFor(
            "validForHours",
          ) ? (
            <small className="field-error">
              {issueFor(
                "validForHours",
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
            ? "Creating link..."
            : "Create client request link"}
        </button>
      </form>

      <IssuedPortalLink
        state={state}
      />
    </div>
  );
}

function DecisionPortalIssuer({
  businessId,
  garmentId,
  target,
}: Readonly<{
  businessId: string;
  garmentId: string;
  target:
    DecisionPortalTarget;
}>) {
  const action =
    issueChangeProposalDecisionPortalGrantAction.bind(
      null,
      businessId,
      garmentId,
      target.changeRequestId,
      target
        .changeProposalVersionId,
    );

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    action,
    ISSUE_INITIAL_STATE,
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

  return (
    <div className="history-card">
      <div>
        <span className="summary-label">
          Client decision link
        </span>

        <strong>
          Proposal revision{" "}
          {
            target
              .proposalRevisionNumber
          }
        </strong>

        <p className="workspace-note">
          The client can approve or reject
          only this current proposal
          revision.
        </p>
      </div>

      <form
        action={formAction}
        className="product-form"
      >
        <label className="product-field">
          <span>
            Link validity
          </span>

          <select
            name="validForHours"
            defaultValue="72"
          >
            <option value="24">
              24 hours
            </option>

            <option value="72">
              3 days
            </option>

            <option value="168">
              7 days
            </option>
          </select>

          {issueFor(
            "validForHours",
          ) ? (
            <small className="field-error">
              {issueFor(
                "validForHours",
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
            ? "Creating link..."
            : "Create client decision link"}
        </button>
      </form>

      <IssuedPortalLink
        state={state}
      />
    </div>
  );
}

function RevokePortalGrantControl({
  businessId,
  garmentId,
  grant,
}: Readonly<{
  businessId: string;
  garmentId: string;
  grant:
    OutstandingPortalGrantView;
}>) {
  const router =
    useRouter();

  const action =
    revokeClientPortalGrantAction.bind(
      null,
      businessId,
      garmentId,
      grant.id,
    );

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    action,
    REVOKE_INITIAL_STATE,
  );

  useEffect(() => {
    if (
      state.status !==
        "success" ||
      !state.grant
    ) {
      return;
    }

    router.refresh();
  }, [
    router,
    state,
  ]);

  return (
    <article className="history-card">
      <div className="history-card-heading">
        <div>
          <strong>
            {grant.purpose ===
            "REQUEST_CHANGE"
              ? "Client request link"
              : "Client decision link"}
          </strong>

          <span className="record-id">
            Grant ID:{" "}
            {grant.id}
          </span>
        </div>

        <span className="history-unit">
          ACTIVE
        </span>
      </div>

      <dl className="agreement-history-values">
        <div>
          <dt>
            Created
          </dt>

          <dd>
            {new Date(
              grant.createdAt,
            ).toLocaleString()}
          </dd>
        </div>

        <div>
          <dt>
            Expires
          </dt>

          <dd>
            {new Date(
              grant.expiresAt,
            ).toLocaleString()}
          </dd>
        </div>
      </dl>

      {grant.changeProposalVersionId ? (
        <span className="record-id">
          Proposal ID:{" "}
          {
            grant
              .changeProposalVersionId
          }
        </span>
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

      <form action={formAction}>
        <button
          className="secondary-button"
          type="submit"
          disabled={isPending}
        >
          {isPending
            ? "Revoking..."
            : "Revoke link"}
        </button>
      </form>
    </article>
  );
}

export function ClientPortalGrantManager({
  businessId,
  garmentId,
  canIssueRequestChange,
  decisionTarget,
  outstandingGrants,
}: ClientPortalGrantManagerProps) {
  if (
    !canIssueRequestChange &&
    !decisionTarget &&
    outstandingGrants.length ===
      0
  ) {
    return null;
  }

  return (
    <section
      className="record-history-section"
      aria-labelledby="client-portal-links-title"
    >
      <div>
        <p className="eyebrow">
          Client portal
        </p>

        <h2 id="client-portal-links-title">
          Client action links
        </h2>

        <p className="workspace-note">
          Portal links are one-time bearer
          capabilities. StitchTrack stores
          only their cryptographic hashes,
          so the exact URL is shown only
          when it is created.
        </p>
      </div>

      {canIssueRequestChange ? (
        <RequestChangePortalIssuer
          businessId={
            businessId
          }
          garmentId={
            garmentId
          }
        />
      ) : null}

      {decisionTarget ? (
        <DecisionPortalIssuer
          businessId={
            businessId
          }
          garmentId={
            garmentId
          }
          target={
            decisionTarget
          }
        />
      ) : null}

      {outstandingGrants.length >
      0 ? (
        <div>
          <p className="eyebrow">
            Outstanding capabilities
          </p>

          <div className="history-list">
            {outstandingGrants.map(
              (grant) => (
                <RevokePortalGrantControl
                  key={
                    grant.id
                  }
                  businessId={
                    businessId
                  }
                  garmentId={
                    garmentId
                  }
                  grant={
                    grant
                  }
                />
              ),
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
