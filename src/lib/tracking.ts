import { getTrackingServiceToken } from "./auth";

export async function registerTrackedUser(did: string): Promise<void> {
  const token = await getTrackingServiceToken();
  if (!token) return;

  const response = await fetch("/api/track-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ did }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { code?: unknown };
      if (typeof body.code === "string") detail = ` (${body.code})`;
    } catch {
      // Status alone remains a useful diagnostic for non-JSON responses.
    }
    console.warn(
      `Chive user registration failed: ${response.status}${detail}`,
    );
  }
}
