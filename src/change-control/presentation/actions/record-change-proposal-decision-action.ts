"use server";

import { z } from "zod";

import {
  recordChangeProposalApprovalForCurrentTenant,
} from "../../composition/record-change-proposal-approval";
import {
  recordChangeProposalRejectionForCurrentTenant,
} from "../../composition/record-change-proposal-rejection";
import type {
  RecordChangeProposalDecisionActionState,
} from "../record-change-proposal-decision-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

const occurredAtSchema =
  z.string()
    .trim()
    .min(
      1,
      "Decision time is required.",
    )
    .refine(
      (value) =>
        !Number.isNaN(
          new Date(
            value,
          ).getTime(),
        ),
      "Enter a valid decision time.",
    )
    .transform(
      (value) =>
        new Date(value),
    );

const recordDecisionSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    garmentId:
      z.string().uuid(
        "Invalid garment identifier.",
      ),

    changeRequestId:
      z.string().uuid(
        "Invalid change request identifier.",
      ),

    changeProposalVersionId:
      z.string().uuid(
        "Invalid change proposal identifier.",
      ),

    outcome:
      z.enum([
        "APPROVED",
        "REJECTED",
      ]),

    occurredAt:
      occurredAtSchema,

    clientDecisionChannel:
      z.enum([
        "WHATSAPP",
        "EMAIL",
        "PHONE",
        "IN_PERSON",
        "OTHER",
      ]),

    evidenceNote:
      z.string()
        .trim()
        .min(
          1,
          "Evidence note is required.",
        ),
  });

export async function recordChangeProposalDecisionAction(
  businessId: string,
  garmentId: string,
  changeRequestId: string,
  changeProposalVersionId:
    string,
  _previousState:
    RecordChangeProposalDecisionActionState,
  formData: FormData,
): Promise<RecordChangeProposalDecisionActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        recordDecisionSchema,
        {
          businessId,
          garmentId,
          changeRequestId,
          changeProposalVersionId,
          outcome:
            formData.get(
              "outcome",
            ),
          occurredAt:
            formData.get(
              "occurredAt",
            ),
          clientDecisionChannel:
            formData.get(
              "clientDecisionChannel",
            ),
          evidenceNote:
            formData.get(
              "evidenceNote",
            ),
        },
      );

    if (
      input.outcome ===
      "APPROVED"
    ) {
      const result =
        await recordChangeProposalApprovalForCurrentTenant(
          input.businessId,
          {
            garmentId:
              input.garmentId,
            changeRequestId:
              input.changeRequestId,
            changeProposalVersionId:
              input
                .changeProposalVersionId,
            occurredAt:
              input.occurredAt,
            clientDecisionChannel:
              input
                .clientDecisionChannel,
            evidenceNote:
              input.evidenceNote,
          },
        );

      return {
        status: "success",
        message:
          "Change proposal approved and applied successfully.",
        issues: [],
        decision: {
          id:
            result.decision.id,
          changeProposalVersionId:
            result.decision
              .changeProposalVersionId,
          outcome:
            result.decision.outcome,
          occurredAt:
            result.decision
              .occurredAt
              .toISOString(),
          appliedAgreementVersionId:
            result.agreementVersion.id,
        },
      };
    }

    const decision =
      await recordChangeProposalRejectionForCurrentTenant(
        input.businessId,
        {
          garmentId:
            input.garmentId,
          changeRequestId:
            input.changeRequestId,
          changeProposalVersionId:
            input
              .changeProposalVersionId,
          occurredAt:
            input.occurredAt,
          clientDecisionChannel:
            input
              .clientDecisionChannel,
          evidenceNote:
            input.evidenceNote,
        },
      );

    return {
      status: "success",
      message:
        "Change proposal rejection recorded successfully.",
      issues: [],
      decision: {
        id:
          decision.id,
        changeProposalVersionId:
          decision
            .changeProposalVersionId,
        outcome:
          decision.outcome,
        occurredAt:
          decision.occurredAt
            .toISOString(),
        appliedAgreementVersionId:
          null,
      },
    };
  } catch (error) {
    const response =
      toSafeErrorResponse(
        error,
        applicationLogger,
        {
          operation:
            "record-change-proposal-decision",
        },
      );

    return {
      status: "error",
      message:
        response.body.message,
      issues:
        response.body.code ===
        "INVALID_INPUT"
          ? response.body.issues.map(
              (issue) => ({
                path:
                  issue.path,
                message:
                  issue.message,
              }),
            )
          : [],
      decision:
        null,
    };
  }
}
