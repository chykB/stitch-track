import type { TenantRole } from "./tenant-context";

export type ActiveTenantMembership = Readonly<{
  membershipId: string;
  userId: string;
  businessId: string;
  role: TenantRole;
}>;

export interface TenantMembershipReader {
  findActiveMembership(input: {
    userId: string;
    businessId: string;
  }): Promise<ActiveTenantMembership | null>;
}
