import type {
  AgreementHistoryEntry,
} from "../../domain/fitting-baseline";
import type {
  FittingOutcome,
  FittingOutcomeDetails,
  FittingSession,
} from "../../domain/fitting";
import type {
  FittingAdjustment,
  FittingAdjustmentResolution,
  FittingAdjustmentResolutionDetails,
} from "../../domain/fitting-adjustment";
import type {
  CreateFittingSessionData,
} from "./fitting-session-repository";

export type FittingLifecycleScope =
  Readonly<{
    businessId: string;
    garmentId: string;
  }>;

export type CreateFittingAdjustmentData =
  Readonly<{
    businessId: string;
    clientId: string;
    orderId: string;
    garmentId: string;
    fittingSessionId: string;
    description: string;
    recordedByMembershipId:
      string;
  }>;

export type CreateFittingAdjustmentResolutionData =
  FittingAdjustmentResolutionDetails &
    Readonly<{
      businessId: string;
      fittingAdjustmentId: string;
      recordedByMembershipId:
        string;
    }>;

export type CreateFittingOutcomeData =
  FittingOutcomeDetails &
    Readonly<{
      businessId: string;
      fittingSessionId: string;
      recordedByMembershipId:
        string;
    }>;

export interface FittingLifecycleSession {
  createSession(
    data: CreateFittingSessionData,
  ): Promise<FittingSession>;

  findFittingSessionById(
    fittingSessionId: string,
  ): Promise<FittingSession | null>;

  findOutcomeForSession(
    fittingSessionId: string,
  ): Promise<FittingOutcome | null>;

  listAgreementHistory():
    Promise<
      readonly AgreementHistoryEntry[]
    >;

  createOutcome(
    data: CreateFittingOutcomeData,
  ): Promise<FittingOutcome>;

  createAdjustment(
    data: CreateFittingAdjustmentData,
  ): Promise<FittingAdjustment>;

  findAdjustmentById(
    fittingAdjustmentId: string,
  ): Promise<FittingAdjustment | null>;

  findAdjustmentResolution(
    fittingAdjustmentId: string,
  ): Promise<
    FittingAdjustmentResolution | null
  >;

  createAdjustmentResolution(
    data:
      CreateFittingAdjustmentResolutionData,
  ): Promise<
    FittingAdjustmentResolution
  >;
}

export interface FittingLifecycleRepository {
  withGarmentLifecycle<T>(
    scope: FittingLifecycleScope,
    operation: (
      session:
        FittingLifecycleSession,
    ) => Promise<T>,
  ): Promise<T>;
}
