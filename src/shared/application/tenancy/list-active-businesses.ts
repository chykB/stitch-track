import { ApplicationError } from "../errors/application-error";
import type {
  ActiveBusinessAccess,
  ActiveBusinessReader,
} from "./active-business-reader";

export async function listActiveBusinessesForUser(
  reader: ActiveBusinessReader,
  authenticatedUserId: string | null,
): Promise<readonly ActiveBusinessAccess[]> {
  if (!authenticatedUserId) {
    throw new ApplicationError(
      "UNAUTHORIZED",
      "Authentication is required.",
    );
  }

  return reader.listForUser(
    authenticatedUserId,
  );
}
