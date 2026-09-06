"use client";

import {
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { authClient } from "./auth-client";

export function SignInForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } =
        await authClient.signIn.email({
          email,
          password,
          rememberMe: true,
        });

      if (error) {
        setErrorMessage(
          "Unable to sign in with those credentials.",
        );
        return;
      }

      router.replace("/app");
      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to sign in right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="auth-form"
      onSubmit={handleSubmit}
    >
      <label className="auth-field">
        <span>Email</span>

        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />
      </label>

      <label className="auth-field">
        <span>Password</span>

        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
        />
      </label>

      {errorMessage ? (
        <p
          className="auth-error"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        className="primary-button"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Signing in..."
          : "Sign in"}
      </button>
    </form>
  );
}
