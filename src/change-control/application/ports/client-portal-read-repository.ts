import type {
  ChangeRequest,
} from "../../domain/change-request";

export type FindActivePortalChangeRequestForGarment =
  Readonly<{
    businessId: string;
    garmentId: string;
  }>;

export interface ClientPortalReadRepository {
  findActiveRequestForGarment(
    lookup:
      FindActivePortalChangeRequestForGarment,
  ): Promise<ChangeRequest | null>;
}
