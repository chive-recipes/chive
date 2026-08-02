// ── Chive Bookmarks Service ─────────────────────────────────────────────────
//
// Handles ATProto interactions for cloud bookmarks (implemented as native Likes).

import { extractRkey, type LikeEnvelope } from "./api";

// ── Types ──────────────────────────────────────────────────────────────────

interface ListRecordsResponse {
  records: LikeEnvelope[];
  cursor?: string;
}

// ── API Functions ──────────────────────────────────────────────────────────

/**
 * Fetch all cloud bookmarks (likes on recipes) for the given DID.
 * Uses the authenticated fetchHandler to query the user's PDS.
 */
export async function fetchCloudBookmarks(
  did: string,
  fetchHandler: (pathname: string, init?: RequestInit) => Promise<Response>
): Promise<LikeEnvelope[]> {
  const records: LikeEnvelope[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const params = new URLSearchParams({
      repo: did,
      collection: "app.bsky.feed.like",
      limit: "100",
    });
    if (cursor) params.set("cursor", cursor);

    const url = `/xrpc/com.atproto.repo.listRecords?${params.toString()}`;
    const res = await fetchHandler(url, { method: "GET" });

    if (!res.ok) {
      console.error("Failed to fetch cloud bookmarks", await res.text());
      break;
    }

    const data: ListRecordsResponse = await res.json();
    
    // Filter to ONLY include likes that point to Chive recipes
    const chiveLikes = data.records.filter(record => 
      record.value.subject?.uri?.includes("/com.chive.recipe/")
    );
    
    records.push(...chiveLikes);

    if (data.cursor) {
      cursor = data.cursor;
    } else {
      break;
    }
  }

  return records;
}

/**
 * Create a new bookmark (like) record on the user's PDS.
 */
export async function createCloudBookmark(
  did: string,
  recipeUri: string,
  recipeCid: string,
  fetchHandler: (pathname: string, init?: RequestInit) => Promise<Response>
): Promise<string> {
  const record = {
    $type: "app.bsky.feed.like",
    subject: {
      uri: recipeUri,
      cid: recipeCid,
    },
    createdAt: new Date().toISOString(),
  };

  const res = await fetchHandler("/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.feed.like",
      record: record,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    alert(`ATProto Error: ${res.status} - ${errText}`);
    throw new Error(`Failed to create bookmark: ${errText}`);
  }

  const data = await res.json();
  // data.uri is the newly created record URI
  return data.uri;
}

/**
 * Delete a bookmark (like) record from the user's PDS.
 */
export async function deleteCloudBookmark(
  did: string,
  bookmarkUri: string,
  fetchHandler: (pathname: string, init?: RequestInit) => Promise<Response>
): Promise<void> {
  const rkey = extractRkey(bookmarkUri);

  const res = await fetchHandler("/xrpc/com.atproto.repo.deleteRecord", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.feed.like",
      rkey: rkey,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to delete bookmark: ${await res.text()}`);
  }
}
