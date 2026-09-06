import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "../shared/composition/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  redirect(
    session
      ? "/app"
      : "/sign-in",
  );
}
