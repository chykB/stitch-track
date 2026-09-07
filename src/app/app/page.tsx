import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  listActiveBusinessesForUser,
} from "../../shared/application/tenancy/list-active-businesses";
import { auth } from "../../shared/composition/auth";
import {
  prismaActiveBusinessReader,
} from "../../shared/infrastructure/tenancy/prisma-active-business-reader";

export default async function AppPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const businesses =
    await listActiveBusinessesForUser(
      prismaActiveBusinessReader,
      session.user.id,
    );

  return (
    <section className="workspace-card">
      <p className="eyebrow">
        Your businesses
      </p>

      <h1>Choose a workspace</h1>

      <p className="workspace-note">
        Select an active business to manage
        its tailoring work.
      </p>

      {businesses.length > 0 ? (
        <div className="business-list">
          {businesses.map((business) => (
            <Link
              className="business-link"
              href={`/app/${business.businessId}`}
              key={business.membershipId}
            >
              <span className="business-name">
                {business.businessName}
              </span>

              <span className="business-role">
                {business.role === "OWNER"
                  ? "Owner"
                  : "Member"}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>
            You do not currently have access
            to an active business.
          </p>
        </div>
      )}
    </section>
  );
}
