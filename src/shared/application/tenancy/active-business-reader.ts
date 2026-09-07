import type {
  TenantRole,
} from "./tenant-context";

export type ActiveBusinessAccess = Readonly<{
  membershipId: string;
  businessId: string;
  businessName: string;
  role: TenantRole;
}>;

export interface ActiveBusinessReader {
  listForUser(
    userId: string,
  ): Promise<readonly ActiveBusinessAccess[]>;
}
