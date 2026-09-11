"use server";

import { z } from "zod";

import {
  issueChangeProposalDecisionPortalGrantForCurrentTenant,
} from "../../composition/issue-change-proposal-decision-portal-grant";
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

const issueDecisionPortalGrantSchema =
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

    changeProposalVersionId:
      z.string().uuid(
        "Invalid change proposal identifier.",
      ),

    validForHours:
      validityHoursSchema,
  });

export async function issueChangeProposalDecisionPortalGrantAction(
  businessId: string,
  garmentId: string,
  changeRequestId: string,
  changeProposalVersionId:
    string,
  _previousState:
    IssueClientPortalGrantActionState,
  formData: FormData,
): Promise<IssueClientPortalGrantActionState> {
  void _previousState;

  try {
    const input =
      parseInput(
        issueDecisionPortalGrantSchema,
        {
          businessId,
          garmentId,
          changeRequestId,
          changeProposalVersionId,
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
      await issueChangeProposalDecisionPortalGrantForCurrentTenant(
        input.businessId,
        {
          garmentId:
            input.garmentId,
          changeRequestId:
            input.changeRequestId,
          changeProposalVersionId:
            input.changeProposalVersionId,
          expiresAt,
        },
      );

    return {
      status:
        "success",
      message:
        "Client proposal-decision link created. Copy it now because StitchTrack will not be able to show this exact link again.",
      issues: [],
      grant: {
        id:
          grant.clientPortalGrantId,
        purpose:
          grant.purpose,
        changeProposalVersionId:
          grant.changeProposalVersionId,
        portalPath:
          `/portal/change-decision/${encodeURIComponent(
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
            "issue-change-proposal-decision-portal-grant",
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
