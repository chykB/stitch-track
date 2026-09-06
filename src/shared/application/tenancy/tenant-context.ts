export type TenantRole = "OWNER" | "MEMBER";

export type TenantContext = Readonly<{
  userId: string;
  businessId: string;
  membershipId: string;
  role: TenantRole;
}>;
