import type {
  AgreementResolution,
} from "../../domain/agreement-resolution";

export type FindAgreementResolutionForVersion =
  Readonly<{
    businessId: string;
    agreementVersionId: string;
  }>;

export interface AgreementResolutionRepository {
  findForVersion(
    lookup:
      FindAgreementResolutionForVersion,
  ): Promise<AgreementResolution | null>;
}
