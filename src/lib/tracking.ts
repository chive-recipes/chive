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
    console.warn(`Chive user registration failed: ${response.status}`);
  }
}
