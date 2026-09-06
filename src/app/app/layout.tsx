import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "../../shared/composition/auth";
import {
  SignOutButton,
} from "../../shared/presentation/auth/sign-out-button";

type AppLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function AppLayout({
  children,
}: AppLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-brand">
            StitchTrack
          </p>

          <p className="app-user">
            {session.user.name ||
              session.user.email}
          </p>
        </div>

        <SignOutButton />
      </header>

      <main className="app-content">
        {children}
      </main>
    </div>
  );
}
