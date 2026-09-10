import type {
  Prisma,
} from "../../generated/prisma/client";
import {
  agreementVersionInclude,
  toAgreementResolution,
  toAgreementVersion,
  toDatabaseDate,
} from "../../agreement/infrastructure/prisma-agreement-mappers";
import type {
  ChangeControlLifecycleRepository,
  ChangeControlLifecycleScope,
  ChangeControlLifecycleSession,
  CreateAppliedAgreementResolutionData,
  CreateAppliedAgreementVersionData,
  CreateChangeProposalDecisionData,
  CreateChangeProposalVersionData,
  CreateChangeRequestClosureData,
  CreateChangeRequestData,
} from "../application/ports/change-control-lifecycle-repository";
import { prisma } from "../../shared/database/prisma";
import {
  changeProposalVersionInclude,
  toChangeProposalDecision,
  toChangeProposalVersion,
  toChangeRequest,
  toChangeRequestClosure,
} from "./prisma-change-control-mappers";

type TransactionClient =
  Prisma.TransactionClient;

function assertChangeRequestScope(
  scope:
    ChangeControlLifecycleScope,
  data:
    CreateChangeRequestData,
): void {
  if (
    data.businessId !==
      scope.businessId ||
    data.garmentId !==
      scope.garmentId
  ) {
    throw new Error(
      "Change request does not match the active garment lifecycle scope.",
    );
  }
}

function assertChangeProposalScope(
  scope:
    ChangeControlLifecycleScope,
  data:
    CreateChangeProposalVersionData,
): void {
  if (
    data.businessId !==
      scope.businessId ||
    data.garmentId !==
      scope.garmentId
  ) {
    throw new Error(
      "Change proposal does not match the active garment lifecycle scope.",
    );
  }
}

function assertChangeDecisionScope(
  scope:
    ChangeControlLifecycleScope,
  data:
    CreateChangeProposalDecisionData,
): void {
  if (
    data.businessId !==
    scope.businessId
  ) {
    throw new Error(
      "Change proposal decision does not match the active garment lifecycle scope.",
    );
  }
}

function assertAppliedAgreementScope(
  scope:
    ChangeControlLifecycleScope,
  data:
    CreateAppliedAgreementVersionData,
): void {
  if (
    data.businessId !==
      scope.businessId ||
    data.garmentId !==
      scope.garmentId
  ) {
    throw new Error(
      "Applied agreement version does not match the active garment lifecycle scope.",
    );
  }
}

function assertAppliedResolutionScope(
  scope:
    ChangeControlLifecycleScope,
  data:
    CreateAppliedAgreementResolutionData,
): void {
  if (
    data.businessId !==
    scope.businessId
  ) {
    throw new Error(
      "Applied agreement resolution does not match the active garment lifecycle scope.",
    );
  }
}

function assertClosureScope(
  scope:
    ChangeControlLifecycleScope,
  data:
    CreateChangeRequestClosureData,
): void {
  if (
    data.businessId !==
    scope.businessId
  ) {
    throw new Error(
      "Change request closure does not match the active garment lifecycle scope.",
    );
  }
}

function createLifecycleSession(
  transaction:
    TransactionClient,
  scope:
    ChangeControlLifecycleScope,
): ChangeControlLifecycleSession {
  return {
    async findLatestAgreementVersion() {
      const record =
        await transaction
          .agreementVersion
          .findFirst({
            where: {
              businessId:
                scope.businessId,
              garmentId:
                scope.garmentId,
            },
            include:
              agreementVersionInclude,
            orderBy: [
              {
                revisionNumber:
                  "desc",
              },
              {
                id:
                  "desc",
              },
            ],
          });

      return record
        ? toAgreementVersion(
            record,
          )
        : null;
    },

    async findAgreementResolutionForVersion(
      agreementVersionId,
    ) {
      const record =
        await transaction
          .agreementResolution
          .findFirst({
            where: {
              businessId:
                scope.businessId,
              agreementVersionId,
              agreementVersion: {
                garmentId:
                  scope.garmentId,
              },
            },
          });

      return record
        ? toAgreementResolution(
            record,
          )
        : null;
    },

    async findActiveChangeRequest() {
      const record =
        await transaction
          .changeRequest
          .findFirst({
            where: {
              businessId:
                scope.businessId,
              garmentId:
                scope.garmentId,
              activeSlot:
                "ACTIVE",
            },
          });

      return record
        ? toChangeRequest(
            record,
          )
        : null;
    },

    async findLatestProposalForRequest(
      changeRequestId,
    ) {
      const record =
        await transaction
          .changeProposalVersion
          .findFirst({
            where: {
              businessId:
                scope.businessId,
              garmentId:
                scope.garmentId,
              changeRequestId,
            },
            include:
              changeProposalVersionInclude,
            orderBy: [
              {
                revisionNumber:
                  "desc",
              },
              {
                id:
                  "desc",
              },
            ],
          });

      return record
        ? toChangeProposalVersion(
            record,
          )
        : null;
    },

    async findDecisionForProposal(
      changeProposalVersionId,
    ) {
      const record =
        await transaction
          .changeProposalDecision
          .findFirst({
            where: {
              businessId:
                scope.businessId,
              changeProposalVersionId,
              changeProposalVersion: {
                garmentId:
                  scope.garmentId,
              },
            },
          });

      return record
        ? toChangeProposalDecision(
            record,
          )
        : null;
    },

    async findClosureForRequest(
      changeRequestId,
    ) {
      const record =
        await transaction
          .changeRequestClosure
          .findFirst({
            where: {
              businessId:
                scope.businessId,
              changeRequestId,
              changeRequest: {
                garmentId:
                  scope.garmentId,
              },
            },
          });

      return record
        ? toChangeRequestClosure(
            record,
          )
        : null;
    },

    async createChangeRequest(data) {
      assertChangeRequestScope(
        scope,
        data,
      );

      const record =
        await transaction
          .changeRequest
          .create({
            data: {
              businessId:
                data.businessId,
              clientId:
                data.clientId,
              orderId:
                data.orderId,
              garmentId:
                data.garmentId,
              baselineAgreementVersionId:
                data
                  .baselineAgreementVersionId,
              requestedBy:
                data.requestedBy,
              origin:
                data.origin,
              requestChannel:
                data.requestChannel,
              description:
                data.description,
              requestedAt:
                data.requestedAt,
              recordedByMembershipId:
                data
                  .recordedByMembershipId,
            },
          });

      return toChangeRequest(
        record,
      );
    },

    async createChangeProposalVersion(
      data,
    ) {
      assertChangeProposalScope(
        scope,
        data,
      );

      const proposal =
        await transaction
          .changeProposalVersion
          .create({
            data: {
              businessId:
                data.businessId,
              changeRequestId:
                data.changeRequestId,
              clientId:
                data.clientId,
              orderId:
                data.orderId,
              garmentId:
                data.garmentId,
              baselineAgreementVersionId:
                data
                  .baselineAgreementVersionId,
              revisionNumber:
                data.revisionNumber,
              supersedesChangeProposalVersionId:
                data
                  .supersedesChangeProposalVersionId,
              measurementVersionId:
                data
                  .measurementVersionId,
              designSummary:
                data.designSummary,
              fabricDescription:
                data
                  .fabricDescription,
              quantity:
                data.quantity,
              priceAmount:
                data.priceAmount,
              currency:
                data.currency,
              deliveryDate:
                toDatabaseDate(
                  data.deliveryDate,
                ),
              note:
                data.note,
              rationale:
                data.rationale,
              createdByMembershipId:
                data
                  .createdByMembershipId,
            },
          });

      if (
        data.styleReferenceIds
          .length > 0
      ) {
        await transaction
          .changeProposalStyleReference
          .createMany({
            data:
              data.styleReferenceIds
                .map(
                  (
                    styleReferenceId,
                  ) => ({
                    businessId:
                      data.businessId,
                    changeProposalVersionId:
                      proposal.id,
                    styleReferenceId,
                    garmentId:
                      data.garmentId,
                  }),
                ),
          });
      }

      const persisted =
        await transaction
          .changeProposalVersion
          .findFirstOrThrow({
            where: {
              id:
                proposal.id,
              businessId:
                scope.businessId,
              garmentId:
                scope.garmentId,
            },
            include:
              changeProposalVersionInclude,
          });

      return toChangeProposalVersion(
        persisted,
      );
    },

    async createChangeProposalDecision(
      data,
    ) {
      assertChangeDecisionScope(
        scope,
        data,
      );

      const proposal =
        await transaction
          .changeProposalVersion
          .findFirst({
            where: {
              id:
                data
                  .changeProposalVersionId,
              businessId:
                scope.businessId,
              garmentId:
                scope.garmentId,
            },
            select: {
              id: true,
            },
          });

      if (!proposal) {
        throw new Error(
          "Change proposal does not belong to the active garment lifecycle scope.",
        );
      }

      const record =
        await transaction
          .changeProposalDecision
          .create({
            data: {
              businessId:
                data.businessId,
              changeProposalVersionId:
                data
                  .changeProposalVersionId,
              outcome:
                data.outcome,
              occurredAt:
                data.occurredAt,
              clientNameSnapshot:
                data
                  .clientNameSnapshot,
              decisionSource:
                data.decisionSource,
              clientDecisionChannel:
                data
                  .clientDecisionChannel,
              evidenceNote:
                data.evidenceNote,
              recordedByMembershipId:
                data
                  .recordedByMembershipId,
              portalGrantId:
                data.portalGrantId,
            },
          });

      return toChangeProposalDecision(
        record,
      );
    },

    async createAppliedAgreementVersion(
      data,
    ) {
      assertAppliedAgreementScope(
        scope,
        data,
      );

      const version =
        await transaction
          .agreementVersion
          .create({
            data: {
              businessId:
                data.businessId,
              clientId:
                data.clientId,
              orderId:
                data.orderId,
              garmentId:
                data.garmentId,
              revisionNumber:
                data.revisionNumber,
              measurementVersionId:
                data
                  .measurementVersionId,
              designSummary:
                data.designSummary,
              fabricDescription:
                data
                  .fabricDescription,
              quantity:
                data.quantity,
              priceAmount:
                data.priceAmount,
              currency:
                data.currency,
              deliveryDate:
                toDatabaseDate(
                  data.deliveryDate,
                ),
              note:
                data.note,
              supersedesAgreementVersionId:
                data
                  .supersedesAgreementVersionId,
            },
          });

      if (
        data.styleReferenceIds
          .length > 0
      ) {
        await transaction
          .agreementStyleReference
          .createMany({
            data:
              data.styleReferenceIds
                .map(
                  (
                    styleReferenceId,
                  ) => ({
                    businessId:
                      data.businessId,
                    agreementVersionId:
                      version.id,
                    styleReferenceId,
                    garmentId:
                      data.garmentId,
                  }),
                ),
          });
      }

      const persisted =
        await transaction
          .agreementVersion
          .findFirstOrThrow({
            where: {
              id:
                version.id,
              businessId:
                scope.businessId,
              garmentId:
                scope.garmentId,
            },
            include:
              agreementVersionInclude,
          });

      return toAgreementVersion(
        persisted,
      );
    },

    async createAppliedAgreementResolution(
      data,
    ) {
      assertAppliedResolutionScope(
        scope,
        data,
      );

      const agreementVersion =
        await transaction
          .agreementVersion
          .findFirst({
            where: {
              id:
                data
                  .agreementVersionId,
              businessId:
                scope.businessId,
              garmentId:
                scope.garmentId,
            },
            select: {
              id: true,
            },
          });

      if (!agreementVersion) {
        throw new Error(
          "Applied agreement version does not belong to the active garment lifecycle scope.",
        );
      }

      const record =
        await transaction
          .agreementResolution
          .create({
            data: {
              businessId:
                data.businessId,
              agreementVersionId:
                data
                  .agreementVersionId,
              outcome:
                data.outcome,
              occurredAt:
                data.occurredAt,
              clientNameSnapshot:
                data
                  .clientNameSnapshot,
              clientDecisionChannel:
                data
                  .clientDecisionChannel,
              evidenceNote:
                data.evidenceNote,
              recordedByMembershipId:
                data
                  .recordedByMembershipId,
            },
          });

      return toAgreementResolution(
        record,
      );
    },

    async createChangeRequestClosure(
      data,
    ) {
      assertClosureScope(
        scope,
        data,
      );

      const request =
        await transaction
          .changeRequest
          .findFirst({
            where: {
              id:
                data.changeRequestId,
              businessId:
                scope.businessId,
              garmentId:
                scope.garmentId,
            },
            select: {
              id: true,
            },
          });

      if (!request) {
        throw new Error(
          "Change request does not belong to the active garment lifecycle scope.",
        );
      }

      const record =
        await transaction
          .changeRequestClosure
          .create({
            data: {
              businessId:
                data.businessId,
              changeRequestId:
                data.changeRequestId,
              outcome:
                data.outcome,
              reason:
                data.reason,
              occurredAt:
                data.occurredAt,
              recordedByMembershipId:
                data
                  .recordedByMembershipId,
            },
          });

      return toChangeRequestClosure(
        record,
      );
    },

    async releaseActiveChangeRequest(
      changeRequestId,
    ) {
      const result =
        await transaction
          .changeRequest
          .updateMany({
            where: {
              id:
                changeRequestId,
              businessId:
                scope.businessId,
              garmentId:
                scope.garmentId,
              activeSlot:
                "ACTIVE",
            },
            data: {
              activeSlot:
                null,
            },
          });

      if (result.count !== 1) {
        throw new Error(
          "Active change request could not be released from the garment lifecycle.",
        );
      }
    },
  };
}

export const prismaChangeControlLifecycleRepository:
  ChangeControlLifecycleRepository = {
    async withGarmentLifecycle(
      scope,
      operation,
    ) {
      return prisma.$transaction(
        async (transaction) => {
          const lockedGarments =
            await transaction
              .$queryRaw<
                Array<{
                  id: string;
                }>
              >`
                SELECT "id"
                FROM "garment"
                WHERE "id" =
                  ${scope.garmentId}::uuid
                  AND "businessId" =
                  ${scope.businessId}::uuid
                FOR UPDATE
              `;

          if (
            lockedGarments.length !==
            1
          ) {
            throw new Error(
              "Garment lifecycle scope could not be locked.",
            );
          }

          const session =
            createLifecycleSession(
              transaction,
              scope,
            );

          return operation(
            session,
          );
        },
      );
    },
  };
