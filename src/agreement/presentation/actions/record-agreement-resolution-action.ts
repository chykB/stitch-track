"use server";

import { z } from "zod";

import {
  recordAgreementResolutionForCurrentTenant,
} from "../../composition/record-agreement-resolution";
import type {
  RecordAgreementResolutionActionState,
} from "../record-agreement-resolution-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

const decisionChannelSchema =
  z.preprocess(
    (value) =>
      typeof value === "string" &&
      value.trim() === ""
        ? null
        : value,
    z.union([
      z.enum([
        "WHATSAPP",
        "EMAIL",
        "PHONE",
        "IN_PERSON",
        "OTHER",
      ]),
      z.null(),
    ]),
  );

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

const recordAgreementResolutionSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    garmentId:
      z.string().uuid(
        "Invalid garment identifier.",
      ),

    agreementVersionId:
      z.string().uuid(
        "Invalid agreement version identifier.",
      ),

    outcome:
      z.enum([
        "APPROVED",
        "REJECTED",
        "WITHDRAWN",
      ]),

    occurredAt:
      occurredAtSchema,

    clientDecisionChannel:
      decisionChannelSchema,

    evidenceNote:
      z.string()
        .trim()
        .min(
          1,
          "Evidence note is required.",
        ),
  }).superRefine(
    (input, context) => {
      if (
        input.outcome ===
        "WITHDRAWN"
      ) {
        if (
          input.clientDecisionChannel
        ) {
          context.addIssue({
            code: "custom",
            path: [
              "clientDecisionChannel",
            ],
            message:
              "A withdrawal does not use a client decision channel.",
          });
        }

        return;
      }

      if (
        !input.clientDecisionChannel
      ) {
        context.addIssue({
          code: "custom",
          path: [
            "clientDecisionChannel",
          ],
          message:
            "Select how the client communicated the decision.",
        });
      }
    },
  );

export async function recordAgreementResolutionAction(
  businessId: string,
  garmentId: string,
  agreementVersionId: string,
  _previousState:
    RecordAgreementResolutionActionState,
  formData: FormData,
): Promise<RecordAgreementResolutionActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        recordAgreementResolutionSchema,
        {
          businessId,
          garmentId,
          agreementVersionId,
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

    const resolution =
      await recordAgreementResolutionForCurrentTenant(
        input.businessId,
        {
          garmentId:
            input.garmentId,
          agreementVersionId:
            input.agreementVersionId,
          outcome:
            input.outcome,
          occurredAt:
            input.occurredAt,
          clientDecisionChannel:
            input.clientDecisionChannel,
          evidenceNote:
            input.evidenceNote,
        },
      );

    return {
      status: "success",
      message:
        "Agreement resolution recorded successfully.",
      issues: [],
      resolution: {
        id:
          resolution.id,
        agreementVersionId:
          resolution.agreementVersionId,
        outcome:
          resolution.outcome,
        occurredAt:
          resolution.occurredAt
            .toISOString(),
      },
    };
  } catch (error) {
    const response =
      toSafeErrorResponse(
        error,
        applicationLogger,
        {
          operation:
            "record-agreement-resolution",
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
      resolution:
        null,
    };
  }
}
