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
  OrderRepository,
} from "../../../order/application/ports/order-repository";
import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import {
  assertClientPortalGrantUsable,
} from "../../domain/client-portal-grant";
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

export type GetRequestChangePortalViewRequest =
  Readonly<{
    rawToken: string;
  }>;

export type RequestChangePortalAgreementView =
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

export type RequestChangePortalView =
  Readonly<{
    purpose:
      "REQUEST_CHANGE";
    clientName: string;
    garmentName: string;
    currentAgreement:
      RequestChangePortalAgreementView;
  }>;

function unavailable():
  never {
  throw new ApplicationError(
    "NOT_FOUND",
    PORTAL_UNAVAILABLE_MESSAGE,
  );
}

export async function getRequestChangePortalView(
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
  clientPortalReadRepository:
    ClientPortalReadRepository,
  changeControlLifecycleRepository:
    ChangeControlLifecycleRepository,
  clientPortalTokenService:
    ClientPortalTokenService,
  request:
    GetRequestChangePortalViewRequest,
): Promise<RequestChangePortalView> {
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
      "REQUEST_CHANGE",
      readAt,
    );
  } catch {
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

  if (activeRequest) {
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

  const resolution =
    await agreementResolutionRepository
      .findForVersion({
        businessId:
          grant.businessId,
        agreementVersionId:
          latestAgreement.id,
      });

  if (
    !resolution ||
    resolution.businessId !==
      grant.businessId ||
    resolution
      .agreementVersionId !==
      latestAgreement.id ||
    resolution.outcome !==
      "APPROVED"
  ) {
    unavailable();
  }

  return {
    purpose:
      "REQUEST_CHANGE",
    clientName:
      client.name,
    garmentName:
      garment.name,
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
        latestAgreement.priceAmount,
      currency:
        latestAgreement.currency,
      deliveryDate:
        latestAgreement.deliveryDate,
      note:
        latestAgreement.note,
    },
  };
}
