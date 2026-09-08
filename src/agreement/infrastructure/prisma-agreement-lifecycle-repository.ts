import type {
  Prisma,
} from "../../generated/prisma/client";
import type {
  AgreementLifecycleRepository,
  AgreementLifecycleSession,
  AgreementLifecycleScope,
  CreateAgreementResolutionData,
  CreateAgreementVersionData,
} from "../application/ports/agreement-lifecycle-repository";
import { prisma } from "../../shared/database/prisma";
import {
  agreementVersionInclude,
  toAgreementResolution,
  toAgreementVersion,
  toDatabaseDate,
} from "./prisma-agreement-mappers";

type TransactionClient =
  Prisma.TransactionClient;

function assertVersionScope(
  scope:
    AgreementLifecycleScope,
  data:
    CreateAgreementVersionData,
): void {
  if (
    data.businessId !==
      scope.businessId ||
    data.garmentId !==
      scope.garmentId
  ) {
    throw new Error(
      "Agreement version does not match the active garment lifecycle scope.",
    );
  }
}

function assertResolutionScope(
  scope:
    AgreementLifecycleScope,
  data:
    CreateAgreementResolutionData,
): void {
  if (
    data.businessId !==
    scope.businessId
  ) {
    throw new Error(
      "Agreement resolution does not match the active garment lifecycle scope.",
    );
  }
}

function createLifecycleSession(
  transaction:
    TransactionClient,
  scope:
    AgreementLifecycleScope,
): AgreementLifecycleSession {
  return {
    async findLatestVersion() {
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

    async findResolutionForVersion(
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

    async createVersion(data) {
      assertVersionScope(
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

    async createResolution(data) {
      assertResolutionScope(
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
          "Agreement version does not belong to the active garment lifecycle scope.",
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
  };
}

export const prismaAgreementLifecycleRepository:
  AgreementLifecycleRepository = {
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
