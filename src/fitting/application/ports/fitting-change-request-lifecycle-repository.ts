import type {
  BusinessRecordedChangeRequestLifecycleSession,
} from "../../../change-control/application/ports/change-control-lifecycle-repository";
import type {
  FittingOutcome,
  FittingSession,
} from "../../domain/fitting";
import type {
  FittingChangeRequestLink,
} from "../../domain/fitting-change-request-link";

export type FittingChangeRequestLifecycleScope =
  Readonly<{
    businessId: string;
    garmentId: string;
  }>;

export type CreateFittingChangeRequestLinkData =
  Readonly<{
    businessId: string;
    fittingSessionId: string;
    changeRequestId: string;
    createdByMembershipId:
      string;
  }>;

export interface FittingChangeRequestLifecycleSession
  extends
    BusinessRecordedChangeRequestLifecycleSession {
  findFittingSessionById(
    fittingSessionId: string,
  ): Promise<FittingSession | null>;

  findOutcomeForSession(
    fittingSessionId: string,
  ): Promise<FittingOutcome | null>;

  createFittingChangeRequestLink(
    data:
      CreateFittingChangeRequestLinkData,
  ): Promise<FittingChangeRequestLink>;
}

export interface FittingChangeRequestLifecycleRepository {
  withGarmentLifecycle<T>(
    scope:
      FittingChangeRequestLifecycleScope,
    operation: (
      session:
        FittingChangeRequestLifecycleSession,
    ) => Promise<T>,
  ): Promise<T>;
}
