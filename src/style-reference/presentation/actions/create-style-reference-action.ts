"use server";

import { z } from "zod";

import {
  createStyleReferenceForCurrentTenant,
} from "../../composition/create-style-reference";
import type {
  CreateStyleReferenceActionState,
} from "../create-style-reference-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

const createStyleReferenceSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    garmentId:
      z.string().uuid(
        "Invalid garment identifier.",
      ),

    sourceUrl:
      z.string()
        .trim()
        .min(
          1,
          "Style reference URL is required.",
        )
        .max(
          2048,
          "Style reference URL is too long.",
        )
        .url(
          "Enter a valid style reference URL.",
        )
        .refine(
          (value) => {
            const protocol =
              new URL(
                value,
              ).protocol;

            return (
              protocol ===
                "http:" ||
              protocol ===
                "https:"
            );
          },
          "Style reference URL must use HTTP or HTTPS.",
        ),

    label:
      z.preprocess(
        (value) =>
          typeof value === "string" &&
          value.trim() === ""
            ? null
            : value,
        z.union([
          z.string()
            .trim()
            .max(
              200,
              "Style reference label is too long.",
            ),
          z.null(),
        ]),
      ),

    note:
      z.preprocess(
        (value) =>
          typeof value === "string" &&
          value.trim() === ""
            ? null
            : value,
        z.union([
          z.string()
            .trim()
            .max(
              2000,
              "Style reference note is too long.",
            ),
          z.null(),
        ]),
      ),
  });

export async function createStyleReferenceAction(
  businessId: string,
  garmentId: string,
  _previousState:
    CreateStyleReferenceActionState,
  formData: FormData,
): Promise<CreateStyleReferenceActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        createStyleReferenceSchema,
        {
          businessId,
          garmentId,
          sourceUrl:
            formData.get(
              "sourceUrl",
            ),
          label:
            formData.get(
              "label",
            ),
          note:
            formData.get(
              "note",
            ),
        },
      );

    const styleReference =
      await createStyleReferenceForCurrentTenant(
        input.businessId,
        {
          garmentId:
            input.garmentId,
          sourceUrl:
            input.sourceUrl,
          label:
            input.label,
          note:
            input.note,
        },
      );

    return {
      status: "success",
      message:
        "Style reference added successfully.",
      issues: [],
      styleReference: {
        id:
          styleReference.id,
        garmentId:
          styleReference.garmentId,
        sourceUrl:
          styleReference.sourceUrl,
        label:
          styleReference.label,
      },
    };
  } catch (error) {
    const response =
      toSafeErrorResponse(
        error,
        applicationLogger,
        {
          operation:
            "create-style-reference",
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
      styleReference:
        null,
    };
  }
}
