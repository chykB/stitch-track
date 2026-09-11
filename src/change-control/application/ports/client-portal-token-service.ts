export type ClientPortalTokenMaterial =
  Readonly<{
    rawToken: string;
    tokenHash: string;
  }>;

export interface ClientPortalTokenService {
  issueToken():
    ClientPortalTokenMaterial;

  hashToken(
    rawToken: string,
  ): string;
}
