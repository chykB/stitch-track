export type ClientPortalGrantFormIssue =
  Readonly<{
    path: string;
    message: string;
  }>;

export type IssuedClientPortalGrantSummary =
  Readonly<{
    id: string;
    purpose:
      | "REQUEST_CHANGE"
      | "DECIDE_CHANGE_PROPOSAL";
    changeProposalVersionId:
      string | null;
    portalPath: string;
    expiresAt: string;
    createdAt: string;
  }>;

export type IssueClientPortalGrantActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly ClientPortalGrantFormIssue[];
    grant:
      IssuedClientPortalGrantSummary | null;
  }>;

export type RevokedClientPortalGrantSummary =
  Readonly<{
    id: string;
    purpose:
      | "REQUEST_CHANGE"
      | "DECIDE_CHANGE_PROPOSAL";
    changeProposalVersionId:
      string | null;
    revokedAt: string;
  }>;

export type RevokeClientPortalGrantActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";
    message: string | null;
    issues:
      readonly ClientPortalGrantFormIssue[];
    grant:
      RevokedClientPortalGrantSummary | null;
  }>;
