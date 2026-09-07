import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { z } from "zod";

import {
  ApplicationError,
} from "../../../shared/application/errors/application-error";
import {
  listActiveBusinessesForUser,
} from "../../../shared/application/tenancy/list-active-businesses";
import {
  resolveCurrentTenantContext,
} from "../../../shared/composition/current-tenant";
import {
  prismaActiveBusinessReader,
} from "../../../shared/infrastructure/tenancy/prisma-active-business-reader";
import {
  CreateClientForm,
} from "../../../client/presentation/create-client-form";

type BusinessWorkspacePageProps =
  Readonly<{
    params: Promise<{
      businessId: string;
    }>;
  }>;

const businessIdSchema =
  z.string().uuid();

export default async function BusinessWorkspacePage({
  params,
}: BusinessWorkspacePageProps) {
  const {
    businessId,
  } = await params;

  const parsedBusinessId =
    businessIdSchema.safeParse(
      businessId,
    );

  if (!parsedBusinessId.success) {
    notFound();
  }

  let tenantContext;

  try {
    tenantContext =
      await resolveCurrentTenantContext(
        parsedBusinessId.data,
        [
          "OWNER",
          "MEMBER",
        ],
      );
  } catch (error) {
    if (
      error instanceof ApplicationError
    ) {
      if (
        error.code === "UNAUTHORIZED"
      ) {
        redirect("/sign-in");
      }

      if (
        error.code === "FORBIDDEN"
      ) {
        notFound();
      }
    }

    throw error;
  }

  const businesses =
    await listActiveBusinessesForUser(
      prismaActiveBusinessReader,
      tenantContext.userId,
    );

  const selectedBusiness =
    businesses.find(
      (business) =>
        business.businessId ===
        tenantContext.businessId,
    );

  if (!selectedBusiness) {
    notFound();
  }

  return (
    <section className="workspace-card">
      <Link
        className="workspace-back-link"
        href="/app"
      >
        ← Switch business
      </Link>

      <p className="eyebrow">
        Selected business
      </p>

      <h1>
        {selectedBusiness.businessName}
      </h1>

      <p className="workspace-note">
        Your membership has been verified
        on the server.
      </p>

      <div className="workspace-summary">
        <div>
          <span className="summary-label">
            Access
          </span>

          <strong>
            {selectedBusiness.role ===
            "OWNER"
              ? "Owner"
              : "Member"}
          </strong>
        </div>

        <div>
          <span className="summary-label">
            V0.3 workflow
          </span>

          <strong>
            Client → Order → Garment
          </strong>
        </div>
      </div>

      <CreateClientForm
        businessId={
          tenantContext.businessId
        }
      />
    </section>
  );
}
