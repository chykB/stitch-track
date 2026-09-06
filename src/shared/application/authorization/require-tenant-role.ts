import { ApplicationError } from "../errors/application-error";
import type {
  TenantContext,
  TenantRole,
} from "../tenancy/tenant-context";

export type AllowedTenantRoles = readonly [
  TenantRole,
  ...TenantRole[],
];

export function requireTenantRole(
  tenantContext: TenantContext,
  allowedRoles: AllowedTenantRoles,
): void {
  if (!allowedRoles.includes(tenantContext.role)) {
    throw new ApplicationError(
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
}
