"use server";

import { z } from "zod";

import {
  createChangeRequestForCurrentTenant,
} from "../../composition/create-change-request";
import type {
  CreateChangeRequestActionState,
} from "../create-change-request-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

type BusinessRequestChannel =
  | "WHATSAPP"
  | "EMAIL"
  | "PHONE"
  | "IN_PERSON"
  | "OTHER"
  | null;

function assertBusinessRequestChannel(
  value:
    BusinessRequestChannel |
    "PORTAL",
): asserts value is BusinessRequestChannel {
  if (value === "PORTAL") {
    throw new Error(
      "Business change request cannot use the PORTAL channel.",
    );
  }
}

const requestChannelSchema =
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

const requestedAtSchema =
  z.string()
    .trim()
    .min(
      1,
      "Request time is required.",
    )
    .refine(
      (value) =>
        !Number.isNaN(
          new Date(
            value,
          ).getTime(),
        ),
      "Enter a valid request time.",
    )
    .transform(
      (value) =>
        new Date(value),
    );

const createChangeRequestSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    garmentId:
      z.string().uuid(
        "Invalid garment identifier.",
      ),

    requestedBy:
      z.enum([
        "CLIENT",
        "BUSINESS",
      ]),

    requestChannel:
      requestChannelSchema,

    description:
      z.string()
        .trim()
        .min(
          1,
          "Change description is required.",
        ),

    requestedAt:
      requestedAtSchema,
  }).superRefine(
    (input, context) => {
      if (
        input.requestedBy ===
        "BUSINESS"
      ) {
        if (
          input.requestChannel
        ) {
          context.addIssue({
            code: "custom",
            path: [
              "requestChannel",
            ],
            message:
              "A Business-requested change does not use a client communication channel.",
          });
        }

        return;
      }

      if (
        !input.requestChannel
      ) {
        context.addIssue({
          code: "custom",
          path: [
            "requestChannel",
          ],
          message:
            "Select how the client communicated the request.",
        });
      }
    },
  );

export async function createChangeRequestAction(
  businessId: string,
  garmentId: string,
  _previousState:
    CreateChangeRequestActionState,
  formData: FormData,
): Promise<CreateChangeRequestActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        createChangeRequestSchema,
        {
          businessId,
          garmentId,
          requestedBy:
            formData.get(
              "requestedBy",
            ),
          requestChannel:
            formData.get(
              "requestChannel",
            ),
          description:
            formData.get(
              "description",
            ),
          requestedAt:
            formData.get(
              "requestedAt",
            ),
        },
      );

    const changeRequest =
      await createChangeRequestForCurrentTenant(
        input.businessId,
        {
          garmentId:
            input.garmentId,
          requestedBy:
            input.requestedBy,
          requestChannel:
            input.requestChannel,
          description:
            input.description,
          requestedAt:
            input.requestedAt,
        },
      );

    assertBusinessRequestChannel(
      changeRequest.requestChannel,
    );

    return {
      status: "success",
      message:
        "Change request recorded successfully.",
      issues: [],
      changeRequest: {
        id:
          changeRequest.id,
        garmentId:
          changeRequest.garmentId,
        requestedBy:
          changeRequest.requestedBy,
        requestChannel:
          changeRequest.requestChannel,
        description:
          changeRequest.description,
        requestedAt:
          changeRequest.requestedAt
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
            "create-change-request",
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
      changeRequest:
        null,
    };
  }
}
