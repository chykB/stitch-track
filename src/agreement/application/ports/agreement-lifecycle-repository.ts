import type {
  AgreementResolution,
  AgreementResolutionDetails,
} from "../../domain/agreement-resolution";
import type {
  AgreementVersion,
  AgreementVersionDetails,
} from "../../domain/agreement-version";

export type AgreementLifecycleScope =
  Readonly<{
    businessId: string;
    garmentId: string;
  }>;

export type CreateAgreementVersionData =
  AgreementVersionDetails &
    Readonly<{
      businessId: string;
      clientId: string;
      orderId: string;
      garmentId: string;
      revisionNumber: number;
      supersedesAgreementVersionId:
        string | null;
    }>;

export type CreateAgreementResolutionData =
  AgreementResolutionDetails &
    Readonly<{
      businessId: string;
      agreementVersionId: string;
      recordedByMembershipId: string;
    }>;

export interface AgreementLifecycleSession {
  findLatestVersion():
    Promise<AgreementVersion | null>;

  findResolutionForVersion(
    agreementVersionId: string,
  ): Promise<AgreementResolution | null>;

  createVersion(
    data: CreateAgreementVersionData,
  ): Promise<AgreementVersion>;

  createResolution(
    data: CreateAgreementResolutionData,
  ): Promise<AgreementResolution>;
}

export interface AgreementLifecycleRepository {
  withGarmentLifecycle<T>(
    scope: AgreementLifecycleScope,
    operation: (
      session:
        AgreementLifecycleSession,
    ) => Promise<T>,
  ): Promise<T>;
}
