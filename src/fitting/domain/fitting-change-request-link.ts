export type FittingChangeRequestLink =
  Readonly<{
    businessId: string;
    fittingSessionId: string;
    changeRequestId: string;
    createdByMembershipId:
      string;
    createdAt: Date;
  }>;
