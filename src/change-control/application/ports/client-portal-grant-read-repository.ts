import type {
  ClientPortalGrantPurpose,
} from "../../domain/client-portal-grant";

export type ClientPortalGrantReadRecord =
  Readonly<{
    id: string;
    businessId: string;
    garmentId: string;
    purpose:
      ClientPortalGrantPurpose;
    changeProposalVersionId:
      string | null;
    expiresAt: Date;
    createdAt: Date;
  }>;

export type ListOutstandingClientPortalGrantsForGarmentLookup =
  Readonly<{
    businessId: string;
    garmentId: string;
  }>;

export interface ClientPortalGrantReadRepository {
  listOutstandingForGarment(
    lookup:
      ListOutstandingClientPortalGrantsForGarmentLookup,
  ): Promise<
    readonly ClientPortalGrantReadRecord[]
  >;
}
