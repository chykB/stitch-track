"use server";

import {
  z,
} from "zod";

import {
  createChangeRequestFromPublicPortal,
} from "../../composition/create-change-request-from-portal";
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
  PortalCreateChangeRequestActionState,
} from "../portal-create-change-request-action-state";

const createPortalChangeRequestSchema =
  z.object({
    description:
      z.string()
        .trim()
        .min(
          1,
          "Change description is required.",
        ),
  });

export async function createChangeRequestFromPortalAction(
  rawToken: string,
  _previousState:
    PortalCreateChangeRequestActionState,
  formData:
    FormData,
): Promise<PortalCreateChangeRequestActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        createPortalChangeRequestSchema,
        {
          description:
            formData.get(
              "description",
            ),
        },
      );

    await createChangeRequestFromPublicPortal({
      rawToken,
      description:
        input.description,
    });

    return {
      status:
        "success",
      message:
        "Your change request was submitted successfully.",
      issues: [],
      submitted:
        true,
    };
  } catch (error) {
    const response =
      toPortalActionError(
        error,
        applicationLogger,
        {
          operation:
            "portal-create-change-request",
        },
      );

    return {
      status:
        "error",
      message:
        response.message,
      issues:
        response.issues,
      submitted:
        false,
    };
  }
}
