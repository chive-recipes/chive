// ── OAuth Callback Page ─────────────────────────────────────────────────────
//
// Rendered at /oauth/callback. Shows a loading indicator while the auth
// service processes the authorization code from the URL.
//
// In practice, the AuthProvider's init() call handles the actual token
// exchange (via BrowserOAuthClient.init()). This page just needs to exist
// as the redirect target and show appropriate feedback.

import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { useAuth } from "../hooks/useAuth";

export function OAuthCallbackPage() {
  const { user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If auth initialization is complete and we have a user, redirect to home.
    if (!isLoading && user) {
      route("/", true);
      return;
    }

    // If auth initialization is complete but no user, something went wrong.
    if (!isLoading && !user) {
      // Check URL for error params (the PDS may redirect back with an error)
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error");
      const errorDesc = params.get("error_description");

      if (oauthError) {
        setError(errorDesc || `Authentication failed: ${oauthError}`);
      } else {
        setError("Authentication failed. Please try again.");
      }
    }
  }, [isLoading, user]);

  if (error) {
    return (
      <div class="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div class="border-2 border-red-400 rounded-2xl p-8 max-w-md w-full text-center shadow-[4px_4px_0px_#fca5a5]">
          <div class="text-4xl mb-4">⚠️</div>
          <h1 class="text-xl font-heading text-slate-800 mb-2">
            Sign-in Failed
          </h1>
          <p class="text-slate-500 font-body mb-6">{error}</p>
          <a
            href="/"
            class="inline-block bg-emerald text-white font-brand px-6 py-2 rounded-xl border-2 border-forest shadow-[4px_4px_0px_#1e8449] hover:shadow-[2px_2px_0px_#1e8449] hover:translate-y-[2px] transition-all no-underline"
          >
            Back to Chive
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div class="border-2 border-emerald rounded-2xl p-8 max-w-md w-full text-center shadow-[4px_4px_0px_#ebf7ed]">
        <div class="w-8 h-8 border-3 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h1 class="text-xl font-heading text-emerald mb-2">
          Signing you in...
        </h1>
        <p class="text-slate-400 font-body text-sm">
          Completing authentication with Bluesky
        </p>
      </div>
    </div>
  );
}
