"use server";

import { z } from "zod";

import {
  revokeClientPortalGrantForCurrentTenant,
} from "../../composition/revoke-client-portal-grant";
import type {
  RevokeClientPortalGrantActionState,
} from "../client-portal-grant-action-state";
import {
  applicationLogger,
} from "../../../shared/composition/logger";
import {
  toSafeErrorResponse,
} from "../../../shared/presentation/errors/to-safe-error-response";
import {
  parseInput,
} from "../../../shared/validation/parse-input";

const revokeClientPortalGrantSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    garmentId:
      z.string().uuid(
        "Invalid garment identifier.",
      ),

    clientPortalGrantId:
      z.string().uuid(
        "Invalid client portal grant identifier.",
      ),
  });

export async function revokeClientPortalGrantAction(
  businessId: string,
  garmentId: string,
  clientPortalGrantId: string,
  _previousState:
    RevokeClientPortalGrantActionState,
  formData: FormData,
): Promise<RevokeClientPortalGrantActionState> {
  void _previousState;
  void formData;

  try {
    const input =
      parseInput(
        revokeClientPortalGrantSchema,
        {
          businessId,
          garmentId,
          clientPortalGrantId,
        },
      );

    const grant =
      await revokeClientPortalGrantForCurrentTenant(
        input.businessId,
        {
          garmentId:
            input.garmentId,
          clientPortalGrantId:
            input.clientPortalGrantId,
        },
      );

    return {
      status:
        "success",
      message:
        "Client portal link revoked successfully.",
      issues: [],
      grant: {
        id:
          grant.clientPortalGrantId,
        purpose:
          grant.purpose,
        changeProposalVersionId:
          grant
            .changeProposalVersionId,
        revokedAt:
          grant.revokedAt
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
            "revoke-client-portal-grant",
        },
      );

    return {
      status:
        "error",
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
      grant:
        null,
    };
  }
}
