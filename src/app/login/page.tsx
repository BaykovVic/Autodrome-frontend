import { Suspense } from "react";

import { LoginScreen } from "./_components/LoginScreen";

/**
 * `/login` lives outside the `(shell)` group, so it is never gated by
 * the session gate — an unauthenticated operator can reach it. The
 * Suspense boundary satisfies `useSearchParams()` during static
 * generation.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
