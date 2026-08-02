// ── Auth Context Provider ───────────────────────────────────────────────────
//
// Wraps the app and initializes auth on mount.

import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { AuthContext, useAuthState } from "../hooks/useAuth";

interface AuthProviderProps {
  children: ComponentChildren;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, setUser, isLoading, setIsLoading, handleSignIn, handleSignOut } =
    useAuthState();

  // On mount: initialize the auth service and attempt session restoration.
  // If the URL contains OAuth callback params, initAuth() will also handle
  // the token exchange.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { initAuth } = await import("../lib/auth");
        const restored = await initAuth();
        if (!cancelled) {
          setUser(restored);
          if (restored?.did) {
            const { registerTrackedUser } = await import("../lib/tracking");
            void registerTrackedUser(restored.did).catch(console.error);
          }
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        // Non-fatal: the app works fine without auth
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
