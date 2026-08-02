// ── Auth State Hook & Context ───────────────────────────────────────────────
//
// Preact context + hook for auth state. Follows the same pattern as useBookmarks.

import { createContext } from "preact";
import { useContext, useState, useCallback } from "preact/hooks";
import type { AuthUser } from "../lib/auth";

// ── Context shape ───────────────────────────────────────────────────────────

export interface AuthState {
  /** The currently authenticated user, or null if signed out. */
  user: AuthUser | null;
  /** True during initial session restoration on app boot. */
  isLoading: boolean;
  /** Initiate the OAuth sign-in flow with a Bluesky handle. */
  signIn: (handle: string) => Promise<void>;
  /** Sign out the current user. */
  signOut: () => Promise<void>;
}

const defaultState: AuthState = {
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
};

export const AuthContext = createContext<AuthState>(defaultState);

// ── Hook ────────────────────────────────────────────────────────────────────

/** Access auth state from any component in the tree. */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}

// ── State management (used by AuthProvider) ─────────────────────────────────

/** Internal hook used by AuthProvider to manage auth state. */
export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSignIn = useCallback(async (handle: string) => {
    const { signIn } = await import("../lib/auth");
    await signIn(handle);
    // signIn redirects the browser — this line is only reached if something
    // goes wrong (the SDK should throw in that case).
  }, []);

  const handleSignOut = useCallback(async () => {
    const { signOut } = await import("../lib/auth");
    await signOut();
    setUser(null);
  }, []);

  return {
    user,
    setUser,
    isLoading,
    setIsLoading,
    handleSignIn,
    handleSignOut,
  };
}
