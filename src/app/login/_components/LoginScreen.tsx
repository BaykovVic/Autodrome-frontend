"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { classifyError } from "@/api/error-taxonomy";
import { getApiAdapter } from "@/api/get-api-adapter";
import {
  setSessionTokens,
  type SessionTokens,
} from "@/api/session-tokens";
import { Button, Input } from "@/components";

import { liveLogin, type LoginCredentials } from "./liveLogin";
import styles from "./LoginScreen.module.css";

export type LoginAction = (
  credentials: LoginCredentials,
) => Promise<SessionTokens>;

function defaultLoginAction(
  credentials: LoginCredentials,
): Promise<SessionTokens> {
  return liveLogin(getApiAdapter({ mode: "live" }), credentials);
}

/**
 * Only allow same-origin internal redirects (`/path`), never
 * protocol-relative (`//host`) or absolute URLs — avoids an
 * open-redirect from a crafted `?redirect=` param.
 */
function safeRedirect(target: string | null): string {
  if (target && target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }
  return "/dashboard";
}

/**
 * Login-appropriate copy over the shared taxonomy: a 401/403 on the
 * login form means bad credentials (not "auth not configured"), 422
 * is a field problem, everything else keeps the taxonomy description.
 */
function loginErrorMessage(error: unknown): string {
  const classification = classifyError(error);
  if (
    classification.category === "unauthorized" ||
    classification.category === "forbidden"
  ) {
    return "Invalid login or password.";
  }
  if (classification.category === "validation") {
    return "Check the login and password fields.";
  }
  return classification.description;
}

type Props = {
  /** Injected login action (tests). Defaults to the live endpoint. */
  loginAction?: LoginAction;
  /** Injected session sink (tests). Defaults to the token store. */
  onAuthenticated?: (tokens: SessionTokens) => void;
};

export function LoginScreen({
  loginAction = defaultLoginAction,
  onAuthenticated = setSessionTokens,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTarget = safeRedirect(params.get("redirect"));

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (login.trim() === "" || password === "") {
      setValidation("Enter both login and password.");
      return;
    }
    setValidation(null);
    setPending(true);
    try {
      const tokens = await loginAction({
        login: login.trim(),
        password,
      });
      onAuthenticated(tokens);
      router.push(redirectTarget);
    } catch (err) {
      setError(loginErrorMessage(err));
      setPending(false);
    }
  }

  return (
    <main className={styles.wrap} aria-label="Sign in">
      <form
        className={styles.card}
        onSubmit={onSubmit}
        aria-label="Sign in form"
        noValidate
      >
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Autodrome Web Operator Console</p>

        {validation ? (
          <p role="alert" className={styles.validation}>
            {validation}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}

        <Input
          label="Login"
          name="login"
          autoComplete="username"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          disabled={pending}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
