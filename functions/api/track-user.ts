import {
  ServiceAuthError,
  verifyTrackingToken,
} from "../lib/service-auth";

export interface Env {
  DB: D1Database;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: JSON_HEADERS });
}

function isSupportedDid(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 256) return false;
  if (/^did:plc:[a-z2-7]{24}$/.test(value)) return true;
  if (!value.startsWith("did:web:")) return false;

  const encodedAuthority = value.slice("did:web:".length);
  if (!encodedAuthority || encodedAuthority.includes(":")) return false;

  try {
    const authority = decodeURIComponent(encodedAuthority);
    return /^[A-Za-z0-9.-]+$/.test(authority) && authority.includes(".");
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let data: { did?: unknown };
  try {
    const contentLength = Number(
      context.request.headers.get("Content-Length") ?? "0",
    );
    if (contentLength > 1024) {
      return jsonResponse(413, { error: "Request body is too large" });
    }

    const body = await context.request.text();
    if (body.length > 1024) {
      return jsonResponse(413, { error: "Request body is too large" });
    }
    data = JSON.parse(body) as { did?: unknown };
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  if (!isSupportedDid(data.did)) {
    return jsonResponse(400, { error: "Invalid DID" });
  }

  const authHeader = context.request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  try {
    await verifyTrackingToken(authHeader.slice("Bearer ".length), data.did);
  } catch (error) {
    console.warn("User registration authentication failed", error);
    return jsonResponse(401, {
      error: "Invalid authentication proof",
      code:
        error instanceof ServiceAuthError ? error.code : "verification_failed",
    });
  }

  try {
    await context.env.DB.prepare(
      "INSERT OR IGNORE INTO tracked_users (did) VALUES (?)",
    )
      .bind(data.did)
      .run();

    return jsonResponse(200, { success: true });
  } catch (error) {
    console.error("User registration storage failed", error);
    return jsonResponse(500, { error: "Registration could not be stored" });
  }
};
