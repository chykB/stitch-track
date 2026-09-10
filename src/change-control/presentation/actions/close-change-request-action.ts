"use server";

import { z } from "zod";

import {
  closeChangeRequestForCurrentTenant,
} from "../../composition/close-change-request";
import type {
  CloseChangeRequestActionState,
} from "../close-change-request-action-state";
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
      "Closure time is required.",
    )
    .refine(
      (value) =>
        !Number.isNaN(
          new Date(
            value,
          ).getTime(),
        ),
      "Enter a valid closure time.",
    )
    .transform(
      (value) =>
        new Date(value),
    );

const closeChangeRequestSchema =
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

    outcome:
      z.enum([
        "WITHDRAWN",
        "IMPOSSIBLE",
      ]),

    reason:
      z.string()
        .trim()
        .min(
          1,
          "Closure reason is required.",
        ),

    occurredAt:
      occurredAtSchema,
  });

export async function closeChangeRequestAction(
  businessId: string,
  garmentId: string,
  changeRequestId: string,
  _previousState:
    CloseChangeRequestActionState,
  formData: FormData,
): Promise<CloseChangeRequestActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        closeChangeRequestSchema,
        {
          businessId,
          garmentId,
          changeRequestId,
          outcome:
            formData.get(
              "outcome",
            ),
          reason:
            formData.get(
              "reason",
            ),
          occurredAt:
            formData.get(
              "occurredAt",
            ),
        },
      );

    const closure =
      await closeChangeRequestForCurrentTenant(
        input.businessId,
        {
          garmentId:
            input.garmentId,
          changeRequestId:
            input.changeRequestId,
          outcome:
            input.outcome,
          reason:
            input.reason,
          occurredAt:
            input.occurredAt,
        },
      );

    return {
      status: "success",
      message:
        "Change request closed successfully.",
      issues: [],
      closure: {
        id:
          closure.id,
        changeRequestId:
          closure.changeRequestId,
        outcome:
          closure.outcome,
        occurredAt:
          closure.occurredAt
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
            "close-change-request",
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
      closure:
        null,
    };
  }
}
