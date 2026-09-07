"use server";

import { z } from "zod";

import {
  createOrderForCurrentTenant,
} from "../../composition/create-order";
import type {
  CreateOrderActionState,
} from "../create-order-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

const createOrderSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    clientId:
      z.string().uuid(
        "Invalid client identifier.",
      ),
  });

export async function createOrderAction(
  businessId: string,
  clientId: string,
  _previousState: CreateOrderActionState,
  _formData: FormData,
): Promise<CreateOrderActionState> {
  void _previousState;
  void _formData;

  try {
    const input =
      parseInput(
        createOrderSchema,
        {
          businessId,
          clientId,
        },
      );

    const order =
      await createOrderForCurrentTenant(
        input.businessId,
        {
          clientId: input.clientId,
        },
      );

    return {
      status: "success",
      message:
        "Order created successfully.",
      issues: [],
      order: {
        id: order.id,
        clientId: order.clientId,
      },
    };
  } catch (error) {
    const response =
      toSafeErrorResponse(
        error,
        applicationLogger,
        {
          operation: "create-order",
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
      order: null,
    };
  }
}
