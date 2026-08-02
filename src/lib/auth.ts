// ── Chive AT Protocol OAuth Service ─────────────────────────────────────────
//
// Singleton wrapper around @atproto/oauth-client-browser.
// All OAuth complexity lives here — no other file should import the SDK directly.

import {
  BrowserOAuthClient,
  type OAuthSession,
} from "@atproto/oauth-client-browser";

const XRPC = "https://public.api.bsky.app/xrpc";
const CHIVE_SERVICE_AUDIENCE = "did:web:chive.pages.dev#chive_tracker";
const TRACK_USER_METHOD = "com.chive.actor.track";
const TRACKING_OAUTH_SCOPE =
  "atproto transition:generic rpc:com.chive.actor.track?aud=did:web:chive.pages.dev%23chive_tracker";

// ── Public types ────────────────────────────────────────────────────────────

/** Minimal user profile surfaced to the UI. */
export interface AuthUser {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

// ── Singleton state ─────────────────────────────────────────────────────────

let client: BrowserOAuthClient | null = null;
let session: OAuthSession | null = null;

// ── Client initialization ───────────────────────────────────────────────────

/** Resolve the correct client_id for the current environment. */
function resolveClientId(): string {
  const { hostname, port } = window.location;

  // In local development (Vite dev server), the ATProto spec requires the 
  // loopback client ID to start strictly with "http://localhost" (no path).
  // The SDK's helper incorrectly appends the current path to the client ID.
  if (hostname === "127.0.0.1" || hostname === "localhost") {
    const loopback = `http://127.0.0.1${port ? `:${port}` : ""}`;
    const redirectUri = `${loopback}/oauth/callback`;
    const scope = TRACKING_OAUTH_SCOPE;
    return `http://localhost?redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  }

  // In production, point to the hosted client-metadata.json
  return "https://chive.pages.dev/client-metadata.json";
}

/** Initialize the OAuth client. Call once on app boot. */
async function getClient(): Promise<BrowserOAuthClient> {
  if (client) return client;

  const clientId = resolveClientId();

  client = await BrowserOAuthClient.load({
    clientId,
    handleResolver: "https://bsky.social",
  });

  return client;
}

// ── Profile fetching ────────────────────────────────────────────────────────

/**
 * Fetch the user's Bluesky profile using their authenticated session.
 * Uses the public AppView API (no auth required for getProfile), but we
 * keep it here since it's only called post-authentication.
 */
async function fetchProfile(did: string): Promise<AuthUser> {
  const params = new URLSearchParams({ actor: did });
  const res = await fetch(
    `${XRPC}/app.bsky.actor.getProfile?${params}`
  );

  if (!res.ok) {
    // Fallback: return minimal info from the DID alone
    return { did, handle: did };
  }

  const profile = await res.json();
  return {
    did,
    handle: profile.handle ?? did,
    displayName: profile.displayName || undefined,
    avatar: profile.avatar || undefined,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Attempt to restore a previous session on app boot.
 * Also handles the OAuth callback if the URL contains auth params.
 *
 * Returns the authenticated user profile, or null if no session exists.
 */
export async function initAuth(): Promise<AuthUser | null> {
  const c = await getClient();

  // init() does two things:
  // 1. If the URL has OAuth callback params, it completes the token exchange.
  // 2. Otherwise, it tries to restore a session from IndexedDB.
  const result = await c.init();

  if (!result?.session) return null;

  session = result.session;
  return fetchProfile(session.did);
}

/**
 * Initiate the OAuth sign-in flow. This will redirect the user to their
 * PDS authorization page. The page will not return — the browser navigates away.
 *
 * @param handle - The user's Bluesky handle (e.g. "alice.bsky.social")
 */
export async function signIn(handle: string): Promise<void> {
  const c = await getClient();

  // signIn() resolves the handle to a DID, discovers the user's PDS,
  // then redirects the browser to the PDS authorization endpoint.
  // This call never resolves — the page navigates away.
  await c.signIn(handle, {
    scope: TRACKING_OAUTH_SCOPE,
  });
}

/**
 * Sign out the current user. Clears the session from IndexedDB
 * and revokes the token on the PDS.
 */
export async function signOut(): Promise<void> {
  if (session) {
    try {
      await session.signOut();
    } catch (e) {
      // Best-effort: if revocation fails (e.g. network issue), still clear local state
      console.warn("Token revocation failed:", e);
    }
  }
  session = null;
}

/**
 * Get the authenticated fetch handler for making XRPC calls.
 * Returns null if no session is active.
 *
 * Usage:
 *   const handler = getSessionFetchHandler();
 *   if (handler) {
 *     const res = await handler("/xrpc/com.atproto.repo.createRecord", { method: "POST", ... });
 *   }
 */
export function getSessionFetchHandler(): ((pathname: string, init?: RequestInit) => Promise<Response>) | null {
  if (!session) return null;
  return session.fetchHandler.bind(session);
}

export function getCurrentDid(): string | null {
  return session?.did ?? null;
}

/**
 * Ask the user's PDS for a short-lived service-auth proof scoped to Chive's
 * registration endpoint. The OAuth access token and DPoP key never leave the
 * browser session.
 */
export async function getTrackingServiceToken(): Promise<string | null> {
  if (!session) return null;

  try {
    const params = new URLSearchParams({
      aud: CHIVE_SERVICE_AUDIENCE,
      lxm: TRACK_USER_METHOD,
      exp: String(Math.floor(Date.now() / 1000) + 60),
    });
    const response = await session.fetchHandler(
      `/xrpc/com.atproto.server.getServiceAuth?${params}`,
    );
    if (!response.ok) {
      let reason = response.statusText;
      try {
        const body = (await response.json()) as {
          error?: unknown;
          message?: unknown;
        };
        const error = typeof body.error === "string" ? body.error : undefined;
        const message = typeof body.message === "string" ? body.message : undefined;
        reason = [error, message].filter(Boolean).join(": ") || reason;
      } catch {
        // The status still gives us a useful, non-sensitive diagnostic.
      }
      console.warn(
        `Chive tracking authorization failed (${response.status}${reason ? `: ${reason}` : ""}). Sign out and back in to grant the current permission.`,
      );
      return null;
    }
    const data = (await response.json()) as { token?: unknown };
    return typeof data.token === "string" ? data.token : null;
  } catch (error) {
    console.warn("Chive tracking authorization request failed", error);
    return null;
  }
}
