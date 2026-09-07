"use server";

import { z } from "zod";

import {
  createClientForCurrentTenant,
} from "../../composition/create-client";
import type {
  CreateClientActionState,
} from "../create-client-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

const createClientSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    name:
      z.string()
        .trim()
        .min(
          1,
          "Client name is required.",
        )
        .max(
          200,
          "Client name is too long.",
        ),

    phone:
      z.string()
        .trim()
        .min(
          1,
          "Client phone is required.",
        )
        .max(
          40,
          "Client phone is too long.",
        ),

    email:
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
              320,
              "Email is too long.",
            )
            .email(
              "Enter a valid email address.",
            ),
          z.null(),
        ]),
      ),
  });

export async function createClientAction(
  businessId: string,
  _previousState: CreateClientActionState,
  formData: FormData,
): Promise<CreateClientActionState> {
  try {
    const input =
      parseInput(
        createClientSchema,
        {
          businessId,
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
        },
      );

    const client =
      await createClientForCurrentTenant(
        input.businessId,
        {
          name: input.name,
          phone: input.phone,
          email: input.email,
        },
      );

    return {
      status: "success",
      message:
        "Client created successfully.",
      issues: [],
      client: {
        id: client.id,
        name: client.name,
      },
    };
  } catch (error) {
    const response =
      toSafeErrorResponse(
        error,
        applicationLogger,
        {
          operation: "create-client",
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
      client: null,
    };
  }
}
