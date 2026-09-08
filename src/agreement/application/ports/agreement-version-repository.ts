import type {
  AgreementVersion,
} from "../../domain/agreement-version";

export type FindAgreementVersionById =
  Readonly<{
    businessId: string;
    agreementVersionId: string;
  }>;

export type ListAgreementVersionsForGarment =
  Readonly<{
    businessId: string;
    garmentId: string;
  }>;

export interface AgreementVersionRepository {
  findById(
    lookup: FindAgreementVersionById,
  ): Promise<AgreementVersion | null>;

  listForGarment(
    lookup:
      ListAgreementVersionsForGarment,
  ): Promise<readonly AgreementVersion[]>;
}
