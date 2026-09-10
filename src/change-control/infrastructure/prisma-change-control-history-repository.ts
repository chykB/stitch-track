import type {
  ChangeControlHistoryRepository,
} from "../application/ports/change-control-history-repository";
import { prisma } from "../../shared/database/prisma";
import {
  changeProposalVersionInclude,
  toChangeProposalDecision,
  toChangeProposalVersion,
  toChangeRequest,
  toChangeRequestClosure,
} from "./prisma-change-control-mappers";

export const prismaChangeControlHistoryRepository:
  ChangeControlHistoryRepository = {
    async listRequestsForGarment({
      businessId,
      garmentId,
    }) {
      const records =
        await prisma
          .changeRequest
          .findMany({
            where: {
              businessId,
              garmentId,
            },
            orderBy: [
              {
                requestedAt:
                  "asc",
              },
              {
                createdAt:
                  "asc",
              },
              {
                id:
                  "asc",
              },
            ],
          });

      return records.map(
        toChangeRequest,
      );
    },

    async listProposalsForRequest({
      businessId,
      changeRequestId,
    }) {
      const records =
        await prisma
          .changeProposalVersion
          .findMany({
            where: {
              businessId,
              changeRequestId,
            },
            include:
              changeProposalVersionInclude,
            orderBy: [
              {
                revisionNumber:
                  "asc",
              },
              {
                id:
                  "asc",
              },
            ],
          });

      return records.map(
        toChangeProposalVersion,
      );
    },

    async findDecisionForProposal({
      businessId,
      changeProposalVersionId,
    }) {
      const record =
        await prisma
          .changeProposalDecision
          .findFirst({
            where: {
              businessId,
              changeProposalVersionId,
            },
          });

      return record
        ? toChangeProposalDecision(
            record,
          )
        : null;
    },

    async findClosureForRequest({
      businessId,
      changeRequestId,
    }) {
      const record =
        await prisma
          .changeRequestClosure
          .findFirst({
            where: {
              businessId,
              changeRequestId,
            },
          });

      return record
        ? toChangeRequestClosure(
            record,
          )
        : null;
    },
  };
