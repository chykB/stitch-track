import {
  getClientForTenant,
} from "../../client/application/use-cases/get-client";
import type {
  Client,
} from "../../client/domain/client";
import {
  prismaClientRepository,
} from "../../client/infrastructure/prisma-client-repository";
import {
  listMeasurementVersionsForTenant,
} from "../../measurement/application/use-cases/list-measurement-versions";
import type {
  MeasurementVersion,
} from "../../measurement/domain/measurement";
import {
  prismaMeasurementVersionRepository,
} from "../../measurement/infrastructure/prisma-measurement-version-repository";
import {
  getOrderForTenant,
} from "../../order/application/use-cases/get-order";
import type {
  Order,
} from "../../order/domain/order";
import {
  prismaOrderRepository,
} from "../../order/infrastructure/prisma-order-repository";
import {
  resolveCurrentTenantContext,
} from "../../shared/composition/current-tenant";
import {
  listStyleReferencesForTenant,
} from "../../style-reference/application/use-cases/list-style-references";
import type {
  StyleReference,
} from "../../style-reference/domain/style-reference";
import {
  prismaStyleReferenceRepository,
} from "../../style-reference/infrastructure/prisma-style-reference-repository";
import {
  getGarmentForTenant,
} from "../application/use-cases/get-garment";
import type {
  Garment,
} from "../domain/garment";
import {
  prismaGarmentRepository,
} from "../infrastructure/prisma-garment-repository";

export type GarmentRecord =
  Readonly<{
    client: Client;
    order: Order;
    garment: Garment;
    measurementVersions:
      readonly MeasurementVersion[];
    styleReferences:
      readonly StyleReference[];
  }>;

export async function getGarmentRecordForCurrentTenant(
  requestedBusinessId: string,
  garmentId: string,
): Promise<GarmentRecord> {
  const tenantContext =
    await resolveCurrentTenantContext(
      requestedBusinessId,
      [
        "OWNER",
        "MEMBER",
      ],
    );

  const garment =
    await getGarmentForTenant(
      prismaGarmentRepository,
      tenantContext,
      {
        garmentId,
      },
    );

  const order =
    await getOrderForTenant(
      prismaOrderRepository,
      tenantContext,
      {
        orderId:
          garment.orderId,
      },
    );

  const client =
    await getClientForTenant(
      prismaClientRepository,
      tenantContext,
      {
        clientId:
          order.clientId,
      },
    );

  const [
    measurementVersions,
    styleReferences,
  ] = await Promise.all([
    listMeasurementVersionsForTenant(
      prismaClientRepository,
      prismaMeasurementVersionRepository,
      tenantContext,
      {
        clientId:
          client.id,
      },
    ),

    listStyleReferencesForTenant(
      prismaGarmentRepository,
      prismaStyleReferenceRepository,
      tenantContext,
      {
        garmentId:
          garment.id,
      },
    ),
  ]);

  return {
    client,
    order,
    garment,
    measurementVersions,
    styleReferences,
  };
}
