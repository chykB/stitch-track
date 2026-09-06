import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "../../shared/composition/auth";
import {
  SignInForm,
} from "../../shared/presentation/auth/sign-in-form";

export default async function SignInPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/app");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">
          StitchTrack
        </p>

        <h1>Sign in</h1>

        <p className="auth-introduction">
          Access your tailoring workspace.
        </p>

        <SignInForm />
      </section>
    </main>
  );
}
