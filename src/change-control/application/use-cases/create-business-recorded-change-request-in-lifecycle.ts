import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import {
  normalizeChangeRequestDetails,
  type ChangeRequest,
} from "../../domain/change-request";
import type {
  BusinessRecordedChangeRequestLifecycleSession,
} from "../ports/change-control-lifecycle-repository";

export type CreateBusinessRecordedChangeRequestInLifecycleInput =
  Readonly<{
    businessId: string;
    clientId: string;
    orderId: string;
    garmentId: string;
    recordedByMembershipId:
      string;
    requestedBy: string;
    requestChannel?:
      string | null;
    description: string;
    requestedAt: Date;
  }>;

export async function createBusinessRecordedChangeRequestInLifecycle(
  session:
    BusinessRecordedChangeRequestLifecycleSession,
  input:
    CreateBusinessRecordedChangeRequestInLifecycleInput,
): Promise<ChangeRequest> {
  const latestAgreement =
    await session
      .findLatestAgreementVersion();

  if (!latestAgreement) {
    throw new ApplicationError(
      "CONFLICT",
      "An approved agreement is required before recording a post-approval change.",
    );
  }

  if (
    latestAgreement.businessId !==
      input.businessId ||
    latestAgreement.garmentId !==
      input.garmentId ||
    latestAgreement.orderId !==
      input.orderId ||
    latestAgreement.clientId !==
      input.clientId
  ) {
    throw new ApplicationError(
      "NOT_FOUND",
      "Current agreement was not found for this garment.",
    );
  }

  const baselineResolution =
    await session
      .findAgreementResolutionForVersion(
        latestAgreement.id,
      );

  if (
    !baselineResolution ||
    baselineResolution.outcome !==
      "APPROVED"
  ) {
    throw new ApplicationError(
      "CONFLICT",
      "The current agreement must be approved before starting change control.",
    );
  }

  const activeRequest =
    await session
      .findActiveChangeRequest();

  if (activeRequest) {
    throw new ApplicationError(
      "CONFLICT",
      "This garment already has an active change request.",
    );
  }

  let details;

  try {
    details =
      normalizeChangeRequestDetails({
        requestedBy:
          input.requestedBy,
        origin:
          "BUSINESS_RECORDED",
        requestChannel:
          input.requestChannel,
        description:
          input.description,
        requestedAt:
          input.requestedAt,
        baselineResolutionOccurredAt:
          baselineResolution
            .occurredAt,
        now:
          new Date(),
      });
  } catch (error) {
    if (
      error instanceof Error
    ) {
      throw new ApplicationError(
        "CONFLICT",
        error.message,
      );
    }

    throw error;
  }

  const created =
    await session
      .createChangeRequest({
        businessId:
          input.businessId,
        clientId:
          input.clientId,
        orderId:
          input.orderId,
        garmentId:
          input.garmentId,
        baselineAgreementVersionId:
          latestAgreement.id,
        recordedByMembershipId:
          input
            .recordedByMembershipId,
        ...details,
      });

  await session
    .revokeOtherRequestChangeGrants(
      input.clientId,
      null,
      new Date(),
    );

  return created;
}
