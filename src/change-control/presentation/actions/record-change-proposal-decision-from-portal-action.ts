"use server";

import {
  z,
} from "zod";

import {
  recordChangeProposalDecisionFromPublicPortal,
} from "../../composition/record-change-proposal-decision-from-portal";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  parseInput,
} from "../../../shared/validation/parse-input";
import {
  toPortalActionError,
} from "../portal-action-error";
import type {
  PortalChangeProposalDecisionActionState,
} from "../portal-change-proposal-decision-action-state";

const clientNoteSchema =
  z.preprocess(
    (value) =>
      typeof value ===
        "string" &&
      value.trim() ===
        ""
        ? null
        : value,
    z.union([
      z.string()
        .trim()
        .max(
          2000,
          "Client note is too long.",
        ),
      z.null(),
    ]),
  );

const recordPortalDecisionSchema =
  z.object({
    outcome:
      z.enum([
        "APPROVED",
        "REJECTED",
      ]),

    clientNote:
      clientNoteSchema,
  });

export async function recordChangeProposalDecisionFromPortalAction(
  rawToken: string,
  _previousState:
    PortalChangeProposalDecisionActionState,
  formData:
    FormData,
): Promise<PortalChangeProposalDecisionActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        recordPortalDecisionSchema,
        {
          outcome:
            formData.get(
              "outcome",
            ),
          clientNote:
            formData.get(
              "clientNote",
            ),
        },
      );

    const result =
      await recordChangeProposalDecisionFromPublicPortal({
        rawToken,
        outcome:
          input.outcome,
        clientNote:
          input.clientNote,
      });

    return {
      status:
        "success",
      message:
        result.outcome ===
          "APPROVED"
          ? "The proposal was approved successfully."
          : "The proposal was rejected successfully.",
      issues: [],
      decision:
        result.outcome,
    };
  } catch (error) {
    const response =
      toPortalActionError(
        error,
        applicationLogger,
        {
          operation:
            "portal-record-change-proposal-decision",
        },
      );

    return {
      status:
        "error",
      message:
        response.message,
      issues:
        response.issues,
      decision:
        null,
    };
  }
}
