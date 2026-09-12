import type {
  FittingSession,
  FittingSessionDetails,
} from "../../domain/fitting";

export type CreateFittingSessionData =
  FittingSessionDetails &
    Readonly<{
      businessId: string;
      clientId: string;
      orderId: string;
      garmentId: string;
      createdByMembershipId:
        string;
    }>;

export interface FittingSessionRepository {
  create(
    data: CreateFittingSessionData,
  ): Promise<FittingSession>;
}
