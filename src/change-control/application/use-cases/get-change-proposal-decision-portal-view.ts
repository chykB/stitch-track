import type {
  AgreementResolutionRepository,
} from "../../../agreement/application/ports/agreement-resolution-repository";
import type {
  AgreementVersionRepository,
} from "../../../agreement/application/ports/agreement-version-repository";
import type {
  ClientRepository,
} from "../../../client/application/ports/client-repository";
import type {
  GarmentRepository,
} from "../../../garment/application/ports/garment-repository";
import type {
  MeasurementVersionRepository,
} from "../../../measurement/application/ports/measurement-version-repository";
import type {
  OrderRepository,
} from "../../../order/application/ports/order-repository";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import type {
  StyleReferenceRepository,
} from "../../../style-reference/application/ports/style-reference-repository";
import {
  assertClientPortalGrantUsable,
} from "../../domain/client-portal-grant";
import {
  deriveChangeRequestState,
} from "../../domain/change-request-lifecycle";
import type {
  ChangeControlHistoryRepository,
} from "../ports/change-control-history-repository";
import type {
  ChangeControlLifecycleRepository,
} from "../ports/change-control-lifecycle-repository";
import type {
  ClientPortalReadRepository,
} from "../ports/client-portal-read-repository";
import type {
  ClientPortalTokenService,
} from "../ports/client-portal-token-service";

const MAX_PORTAL_TOKEN_LENGTH =
  512;

const PORTAL_UNAVAILABLE_MESSAGE =
  "This portal link is unavailable.";

export type GetChangeProposalDecisionPortalViewRequest =
  Readonly<{
    rawToken: string;
  }>;

export type PortalAgreementTermsView =
  Readonly<{
    designSummary: string;
    fabricDescription:
      string | null;
    quantity: number;
    priceAmount: string;
    currency: string;
    deliveryDate: string;
    note: string | null;
  }>;

export type PortalMeasurementEntryView =
  Readonly<{
    label: string;
    value: string;
  }>;

export type PortalMeasurementView =
  Readonly<{
    measuredAt: Date;
    unit:
      | "CENTIMETER"
      | "INCH";
    note: string | null;
    entries:
      readonly PortalMeasurementEntryView[];
  }>;

export type PortalStyleReferenceView =
  Readonly<{
    sourceUrl: string;
    label: string | null;
    note: string | null;
  }>;

export type ChangeProposalDecisionPortalView =
  Readonly<{
    purpose:
      "DECIDE_CHANGE_PROPOSAL";
    clientName: string;
    garmentName: string;
    requestedChange: string;
    proposalRevision: number;
    rationale: string;
    currentAgreement:
      PortalAgreementTermsView;
    proposedAgreement:
      PortalAgreementTermsView;
    selectedMeasurement:
      PortalMeasurementView | null;
    selectedStyleReferences:
      readonly PortalStyleReferenceView[];
  }>;

function unavailable():
  never {
  throw new ApplicationError(
    "NOT_FOUND",
    PORTAL_UNAVAILABLE_MESSAGE,
  );
}

export async function getChangeProposalDecisionPortalView(
  clientRepository:
    ClientRepository,
  orderRepository:
    OrderRepository,
  garmentRepository:
    GarmentRepository,
  agreementVersionRepository:
    AgreementVersionRepository,
  agreementResolutionRepository:
    AgreementResolutionRepository,
  measurementVersionRepository:
    MeasurementVersionRepository,
  styleReferenceRepository:
    StyleReferenceRepository,
  clientPortalReadRepository:
    ClientPortalReadRepository,
  changeControlHistoryRepository:
    ChangeControlHistoryRepository,
  changeControlLifecycleRepository:
    ChangeControlLifecycleRepository,
  clientPortalTokenService:
    ClientPortalTokenService,
  request:
    GetChangeProposalDecisionPortalViewRequest,
): Promise<ChangeProposalDecisionPortalView> {
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

  const grant =
    await changeControlLifecycleRepository
      .findClientPortalGrantByTokenHash(
        tokenHash,
      );

  if (
    !grant ||
    grant.tokenHash !==
      tokenHash
  ) {
    unavailable();
  }

  const readAt =
    new Date();

  try {
    assertClientPortalGrantUsable(
      grant,
      "DECIDE_CHANGE_PROPOSAL",
      readAt,
    );
  } catch {
    unavailable();
  }

  if (
    !grant
      .changeProposalVersionId
  ) {
    unavailable();
  }

  const [
    client,
    order,
    garment,
  ] =
    await Promise.all([
      clientRepository.findById({
        businessId:
          grant.businessId,
        clientId:
          grant.clientId,
      }),

      orderRepository.findById({
        businessId:
          grant.businessId,
        orderId:
          grant.orderId,
      }),

      garmentRepository.findById({
        businessId:
          grant.businessId,
        garmentId:
          grant.garmentId,
      }),
    ]);

  if (
    !client ||
    !order ||
    !garment
  ) {
    unavailable();
  }

  if (
    client.businessId !==
      grant.businessId ||
    client.id !==
      grant.clientId ||
    order.businessId !==
      grant.businessId ||
    order.id !==
      grant.orderId ||
    order.clientId !==
      grant.clientId ||
    garment.businessId !==
      grant.businessId ||
    garment.id !==
      grant.garmentId ||
    garment.orderId !==
      grant.orderId
  ) {
    unavailable();
  }

  const [
    versions,
    activeRequest,
  ] =
    await Promise.all([
      agreementVersionRepository
        .listForGarment({
          businessId:
            grant.businessId,
          garmentId:
            grant.garmentId,
        }),

      clientPortalReadRepository
        .findActiveRequestForGarment({
          businessId:
            grant.businessId,
          garmentId:
            grant.garmentId,
        }),
    ]);

  if (
    !activeRequest ||
    activeRequest.businessId !==
      grant.businessId ||
    activeRequest.clientId !==
      grant.clientId ||
    activeRequest.orderId !==
      grant.orderId ||
    activeRequest.garmentId !==
      grant.garmentId
  ) {
    unavailable();
  }

  const latestAgreement =
    [...versions]
      .sort(
        (left, right) =>
          left.revisionNumber -
          right.revisionNumber,
      )
      .at(
        -1,
      );

  if (
    !latestAgreement ||
    latestAgreement.id !==
      activeRequest
        .baselineAgreementVersionId ||
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
    await agreementResolutionRepository
      .findForVersion({
        businessId:
          grant.businessId,
        agreementVersionId:
          latestAgreement.id,
      });

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

  const [
    proposals,
    closure,
  ] =
    await Promise.all([
      changeControlHistoryRepository
        .listProposalsForRequest({
          businessId:
            grant.businessId,
          changeRequestId:
            activeRequest.id,
        }),

      changeControlHistoryRepository
        .findClosureForRequest({
          businessId:
            grant.businessId,
          changeRequestId:
            activeRequest.id,
        }),
    ]);

  if (closure) {
    unavailable();
  }

  const orderedProposals =
    [...proposals]
      .sort(
        (left, right) =>
          left.revisionNumber -
          right.revisionNumber,
      );

  if (
    orderedProposals.length ===
      0
  ) {
    unavailable();
  }

  for (
    let index = 0;
    index <
      orderedProposals.length;
    index += 1
  ) {
    const proposal =
      orderedProposals[
        index
      ];

    const previousProposal =
      index === 0
        ? null
        : orderedProposals[
            index - 1
          ];

    if (
      proposal.businessId !==
        grant.businessId ||
      proposal.changeRequestId !==
        activeRequest.id ||
      proposal.clientId !==
        grant.clientId ||
      proposal.orderId !==
        grant.orderId ||
      proposal.garmentId !==
        grant.garmentId ||
      proposal
        .baselineAgreementVersionId !==
        latestAgreement.id ||
      proposal.revisionNumber !==
        index + 1 ||
      proposal
        .supersedesChangeProposalVersionId !==
        (
          previousProposal
            ?.id ??
          null
        )
    ) {
      unavailable();
    }
  }

  const latestProposal =
    orderedProposals.at(
      -1,
    );

  if (
    !latestProposal ||
    latestProposal.id !==
      grant
        .changeProposalVersionId
  ) {
    unavailable();
  }

  for (
    let index = 0;
    index <
      orderedProposals.length;
    index += 1
  ) {
    const proposal =
      orderedProposals[
        index
      ];

    const decision =
      await changeControlHistoryRepository
        .findDecisionForProposal({
          businessId:
            grant.businessId,
          changeProposalVersionId:
            proposal.id,
        });

    const isLatest =
      index ===
      orderedProposals.length -
        1;

    if (isLatest) {
      if (decision) {
        unavailable();
      }

      continue;
    }

    if (
      !decision ||
      decision.businessId !==
        grant.businessId ||
      decision
        .changeProposalVersionId !==
        proposal.id ||
      decision.outcome !==
        "REJECTED"
    ) {
      unavailable();
    }
  }

  try {
    const state =
      deriveChangeRequestState(
        latestProposal,
        null,
        null,
      );

    if (
      state !==
      "AWAITING_CLIENT"
    ) {
      unavailable();
    }
  } catch {
    unavailable();
  }

  let selectedMeasurement:
    PortalMeasurementView | null =
      null;

  if (
    latestProposal
      .measurementVersionId
  ) {
    const measurement =
      await measurementVersionRepository
        .findById({
          businessId:
            grant.businessId,
          measurementVersionId:
            latestProposal
              .measurementVersionId,
        });

    if (
      !measurement ||
      measurement.businessId !==
        grant.businessId ||
      measurement.clientId !==
        grant.clientId
    ) {
      unavailable();
    }

    selectedMeasurement = {
      measuredAt:
        new Date(
          measurement
            .measuredAt
            .getTime(),
        ),
      unit:
        measurement.unit,
      note:
        measurement.note,
      entries:
        measurement.entries.map(
          (entry) => ({
            label:
              entry.label,
            value:
              entry.value,
          }),
        ),
    };
  }

  const selectedStyleReferences =
    await Promise.all(
      latestProposal
        .styleReferenceIds
        .map(
          async (
            styleReferenceId,
          ): Promise<
            PortalStyleReferenceView
          > => {
            const styleReference =
              await styleReferenceRepository
                .findById({
                  businessId:
                    grant.businessId,
                  styleReferenceId,
                });

            if (
              !styleReference ||
              styleReference.businessId !==
                grant.businessId ||
              styleReference.garmentId !==
                grant.garmentId
            ) {
              unavailable();
            }

            return {
              sourceUrl:
                styleReference
                  .sourceUrl,
              label:
                styleReference.label,
              note:
                styleReference.note,
            };
          },
        ),
    );

  return {
    purpose:
      "DECIDE_CHANGE_PROPOSAL",
    clientName:
      client.name,
    garmentName:
      garment.name,
    requestedChange:
      activeRequest.description,
    proposalRevision:
      latestProposal
        .revisionNumber,
    rationale:
      latestProposal.rationale,
    currentAgreement: {
      designSummary:
        latestAgreement
          .designSummary,
      fabricDescription:
        latestAgreement
          .fabricDescription,
      quantity:
        latestAgreement.quantity,
      priceAmount:
        latestAgreement
          .priceAmount,
      currency:
        latestAgreement.currency,
      deliveryDate:
        latestAgreement
          .deliveryDate,
      note:
        latestAgreement.note,
    },
    proposedAgreement: {
      designSummary:
        latestProposal
          .designSummary,
      fabricDescription:
        latestProposal
          .fabricDescription,
      quantity:
        latestProposal.quantity,
      priceAmount:
        latestProposal
          .priceAmount,
      currency:
        latestProposal.currency,
      deliveryDate:
        latestProposal
          .deliveryDate,
      note:
        latestProposal.note,
    },
    selectedMeasurement,
    selectedStyleReferences,
  };
}
