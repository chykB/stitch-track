"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "./auth-client";

export function SignOutButton() {
  const router = useRouter();

  const [isSigningOut, setIsSigningOut] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    setErrorMessage(null);

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/sign-in");
          router.refresh();
        },
        onError: () => {
          setErrorMessage(
            "Unable to sign out. Please try again.",
          );
        },
      },
    });

    setIsSigningOut(false);
  }

  return (
    <div className="sign-out-control">
      <button
        className="secondary-button"
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut
          ? "Signing out..."
          : "Sign out"}
      </button>

      {errorMessage ? (
        <p
          className="sign-out-error"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
