import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import {
  assertClientPortalGrantUsable,
  type ClientPortalGrant,
} from "../../domain/client-portal-grant";
import {
  normalizeChangeRequestDetails,
  type ChangeRequest,
} from "../../domain/change-request";
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";
import type {
  ClientPortalTokenService,
} from "../ports/client-portal-token-service";

const MAX_PORTAL_TOKEN_LENGTH =
  512;

const PORTAL_UNAVAILABLE_MESSAGE =
  "This portal link is unavailable.";

export type CreateChangeRequestFromPortalRequest =
  Readonly<{
    rawToken: string;
    description: string;
  }>;

function unavailable():
  never {
  throw new ApplicationError(
    "NOT_FOUND",
    PORTAL_UNAVAILABLE_MESSAGE,
  );
}

function toConflict(
  error: unknown,
): never {
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

function assertAuthoritativeGrant(
  discovered:
    ClientPortalGrant,
  locked:
    ClientPortalGrant,
  tokenHash: string,
): void {
  if (
    locked.id !==
      discovered.id ||
    locked.businessId !==
      discovered.businessId ||
    locked.clientId !==
      discovered.clientId ||
    locked.orderId !==
      discovered.orderId ||
    locked.garmentId !==
      discovered.garmentId ||
    locked.tokenHash !==
      tokenHash
  ) {
    unavailable();
  }
}

export async function createChangeRequestFromPortal(
  changeControlLifecycleRepository:
    ChangeControlLifecycleRepository,
  clientPortalTokenService:
    ClientPortalTokenService,
  request:
    CreateChangeRequestFromPortalRequest,
): Promise<ChangeRequest> {
  if (
    request.rawToken.length ===
      0 ||
    request.rawToken.length >
      MAX_PORTAL_TOKEN_LENGTH
  ) {
    unavailable();
  }

  const tokenHash =
    clientPortalTokenService
      .hashToken(
        request.rawToken,
      );

  const discoveredGrant =
    await changeControlLifecycleRepository
      .findClientPortalGrantByTokenHash(
        tokenHash,
      );

  if (!discoveredGrant) {
    unavailable();
  }

  return changeControlLifecycleRepository
    .withGarmentLifecycle(
      {
        businessId:
          discoveredGrant.businessId,
        garmentId:
          discoveredGrant.garmentId,
      },
      async (session) => {
        const grant =
          await session
            .findClientPortalGrantById(
              discoveredGrant.id,
            );

        if (!grant) {
          unavailable();
        }

        assertAuthoritativeGrant(
          discoveredGrant,
          grant,
          tokenHash,
        );

        const actionAt =
          new Date();

        try {
          assertClientPortalGrantUsable(
            grant,
            "REQUEST_CHANGE",
            actionAt,
          );
        } catch {
          unavailable();
        }

        const latestAgreement =
          await session
            .findLatestAgreementVersion();

        if (
          !latestAgreement ||
          latestAgreement.businessId !==
            grant.businessId ||
          latestAgreement.clientId !==
            grant.clientId ||
          latestAgreement.orderId !==
            grant.orderId ||
          latestAgreement.garmentId !==
            grant.garmentId
        ) {
          unavailable();
        }

        const baselineResolution =
          await session
            .findAgreementResolutionForVersion(
              latestAgreement.id,
            );

        if (
          !baselineResolution ||
          baselineResolution.businessId !==
            grant.businessId ||
          baselineResolution
            .agreementVersionId !==
            latestAgreement.id ||
          baselineResolution.outcome !==
            "APPROVED"
        ) {
          unavailable();
        }

        const activeRequest =
          await session
            .findActiveChangeRequest();

        if (activeRequest) {
          unavailable();
        }

        let details;

        try {
          details =
            normalizeChangeRequestDetails({
              requestedBy:
                "CLIENT",
              origin:
                "CLIENT_PORTAL",
              requestChannel:
                "PORTAL",
              description:
                request.description,
              requestedAt:
                actionAt,
              baselineResolutionOccurredAt:
                baselineResolution
                  .occurredAt,
              now:
                actionAt,
            });
        } catch (error) {
          return toConflict(
            error,
          );
        }

        const created =
          await session
            .createChangeRequest({
              businessId:
                grant.businessId,
              clientId:
                grant.clientId,
              orderId:
                grant.orderId,
              garmentId:
                grant.garmentId,
              baselineAgreementVersionId:
                latestAgreement.id,
              recordedByMembershipId:
                null,
              ...details,
            });

        try {
          await session
            .consumeClientPortalGrant(
              grant.id,
              actionAt,
            );
        } catch {
          unavailable();
        }

        await session
          .revokeOtherRequestChangeGrants(
            grant.clientId,
            grant.id,
            actionAt,
          );

        return created;
      },
    );
}
