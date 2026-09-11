"use server";

import { z } from "zod";

import {
  issueRequestChangePortalGrantForCurrentTenant,
} from "../../composition/issue-request-change-portal-grant";
import type {
  IssueClientPortalGrantActionState,
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

const validityHoursSchema =
  z.enum([
    "24",
    "72",
    "168",
  ]).transform(
    (value) =>
      Number(value),
  );

const issueRequestChangePortalGrantSchema =
  z.object({
    businessId:
      z.string().uuid(
        "Invalid business identifier.",
      ),

    garmentId:
      z.string().uuid(
        "Invalid garment identifier.",
      ),

    validForHours:
      validityHoursSchema,
  });

export async function issueRequestChangePortalGrantAction(
  businessId: string,
  garmentId: string,
  _previousState:
    IssueClientPortalGrantActionState,
  formData: FormData,
): Promise<IssueClientPortalGrantActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        issueRequestChangePortalGrantSchema,
        {
          businessId,
          garmentId,
          validForHours:
            formData.get(
              "validForHours",
            ),
        },
      );

    const expiresAt =
      new Date(
        Date.now() +
          input.validForHours *
            60 *
            60 *
            1000,
      );

    const grant =
      await issueRequestChangePortalGrantForCurrentTenant(
        input.businessId,
        {
          garmentId:
            input.garmentId,
          expiresAt,
        },
      );

    return {
      status:
        "success",
      message:
        "Client change-request link created. Copy it now because StitchTrack will not be able to show this exact link again.",
      issues: [],
      grant: {
        id:
          grant.clientPortalGrantId,
        purpose:
          grant.purpose,
        changeProposalVersionId:
          null,
        portalPath:
          `/portal/change-request/${encodeURIComponent(
            grant.rawToken,
          )}`,
        expiresAt:
          grant.expiresAt
            .toISOString(),
        createdAt:
          grant.createdAt
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
            "issue-request-change-portal-grant",
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
