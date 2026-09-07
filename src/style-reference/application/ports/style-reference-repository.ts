import type {
  StyleReference,
  StyleReferenceDetails,
} from "../../domain/style-reference";

export type CreateStyleReferenceData =
  StyleReferenceDetails &
    Readonly<{
      businessId: string;
      garmentId: string;
    }>;

export type FindStyleReferenceById =
  Readonly<{
    businessId: string;
    styleReferenceId: string;
  }>;

export type ListStyleReferencesForGarment =
  Readonly<{
    businessId: string;
    garmentId: string;
  }>;

export interface StyleReferenceRepository {
  create(
    data: CreateStyleReferenceData,
  ): Promise<StyleReference>;

  findById(
    lookup: FindStyleReferenceById,
  ): Promise<StyleReference | null>;

  listForGarment(
    lookup: ListStyleReferencesForGarment,
  ): Promise<readonly StyleReference[]>;
}
