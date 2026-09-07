"use server";

import { z } from "zod";

import {
  createGarmentForCurrentTenant,
} from "../../composition/create-garment";
import type {
  CreateGarmentActionState,
} from "../create-garment-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

const createGarmentSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    orderId:
      z.string().uuid(
        "Invalid order identifier.",
      ),

    name:
      z.string()
        .trim()
        .min(
          1,
          "Garment name is required.",
        ),
  });

export async function createGarmentAction(
  businessId: string,
  orderId: string,
  _previousState: CreateGarmentActionState,
  formData: FormData,
): Promise<CreateGarmentActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        createGarmentSchema,
        {
          businessId,
          orderId,
          name: formData.get("name"),
        },
      );

    const garment =
      await createGarmentForCurrentTenant(
        input.businessId,
        {
          orderId: input.orderId,
          name: input.name,
        },
      );

    return {
      status: "success",
      message:
        "Garment created successfully.",
      issues: [],
      garment: {
        id: garment.id,
        orderId: garment.orderId,
        name: garment.name,
      },
    };
  } catch (error) {
    const response =
      toSafeErrorResponse(
        error,
        applicationLogger,
        {
          operation: "create-garment",
        },
      );

    return {
      status: "error",
      message: response.body.message,
      issues:
        response.body.code ===
        "INVALID_INPUT"
          ? response.body.issues.map(
              (issue) => ({
                path: issue.path,
                message: issue.message,
              }),
            )
          : [],
      garment: null,
    };
  }
}
