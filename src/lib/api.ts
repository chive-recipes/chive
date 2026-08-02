// ── Chive ATProto API Layer ────────────────────────────────────────────────

export const DID = "did:plc:jp6ebt246qu4imwxgv6akfm4";
export const COLLECTION = "com.chive.recipe";
export const COLLECTION_COLLECTION = "com.chive.collection";
const XRPC = "https://bsky.social/xrpc";

// ── Types ──────────────────────────────────────────────────────────────────

export interface BlobRef {
  $type: "blob";
  ref: { $link: string };
  mimeType: "image/webp";
  size: number;
}

export interface ChiveRecipe {
  $type: "com.chive.recipe";
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  image: BlobRef;
  thumbnail: BlobRef;
  createdAt: string;
  cuisine?: string;
  tags?: string[];
  yield?: string;
  times?: {
    prep?: string;
    cook?: string;
    total?: string;
  };
  nutrition?: {
    calories?: string;
    fatContent?: string;
    saturatedFatContent?: string;
    unsaturatedFatContent?: string;
    carbohydrateContent?: string;
    fiberContent?: string;
    sugarContent?: string;
    proteinContent?: string;
    sodiumContent?: string;
    cholesterolContent?: string;
    servingSize?: string;
  };
}

export interface RecordEnvelope {
  uri: string;
  cid: string;
  value: ChiveRecipe;
}

export interface RecipeIndexEntry {
  id: string;
}

// ── Collection Types ───────────────────────────────────────────────────────

export interface CollectionRecipeRef {
  rkey: string;
}

export interface ChiveCollection {
  $type: "com.chive.collection";
  name: string;
  slug: string;
  description: string;
  emoji: string;
  sortOrder: number;
  recipes: CollectionRecipeRef[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionEnvelope {
  uri: string;
  cid: string;
  value: ChiveCollection;
}

// ── Bookmark Types (Using Native Likes) ────────────────────────────────────

export interface BskyLike {
  $type: "app.bsky.feed.like";
  subject: {
    uri: string;
    cid: string;
  };
  createdAt: string;
}

export interface LikeEnvelope {
  uri: string;
  cid: string;
  value: BskyLike;
}

// ── API Responses ──────────────────────────────────────────────────────────

interface ListResponse {
  records: RecordEnvelope[];
  cursor?: string;
}

interface CollectionListResponse {
  records: CollectionEnvelope[];
  cursor?: string;
}

// ── API Functions ──────────────────────────────────────────────────────────

/** Fetch one page of recipes. Returns records + next cursor. */
export async function fetchRecipes(
  limit = 100,
  cursor?: string,
  repo: string = DID
): Promise<{ records: RecordEnvelope[]; cursor?: string }> {
  const params = new URLSearchParams({
    repo,
    collection: COLLECTION,
    limit: String(limit),
  });
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`${XRPC}/com.atproto.repo.listRecords?${params}`);
  if (!res.ok) throw new Error(`listRecords failed: ${res.status}`);
  const data: ListResponse = await res.json();
  return { records: data.records, cursor: data.cursor };
}

/** Fetch a single recipe by rkey. */
export async function fetchRecipe(rkey: string, did: string = DID): Promise<RecordEnvelope> {
  const params = new URLSearchParams({
    repo: did,
    collection: COLLECTION,
    rkey,
  });
  const res = await fetch(`${XRPC}/com.atproto.repo.getRecord?${params}`);
  if (!res.ok) throw new Error(`getRecord failed: ${res.status}`);
  return await res.json();
}

/**
 * Keep collection references that are present in the generated discovery
 * index. Collections are user-generated ATProto records and can temporarily
 * retain references to recipes that have since been deleted.
 */
export function filterIndexedRecipeRkeys(
  rkeys: string[],
  index: RecipeIndexEntry[],
  did: string = DID,
): string[] {
  const indexedUris = new Set(index.map((entry) => entry.id));
  return rkeys.filter((rkey) =>
    indexedUris.has(`at://${did}/${COLLECTION}/${rkey}`),
  );
}

/** Resolve a handle to a DID */
export async function resolveHandle(handle: string): Promise<string> {
  const res = await fetch(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`);
  if (!res.ok) throw new Error(`resolveHandle failed: ${res.status}`);
  const data = await res.json();
  return data.did;
}

export async function fetchRecipesByUris(
  uris: string[],
  onProgress?: (records: RecordEnvelope[]) => void
): Promise<RecordEnvelope[]> {
  if (uris.length === 0) return [];

  const results: RecordEnvelope[] = [];

  // Fetch and report progress for each recipe across decentralized repositories
  const promises = uris.map(async (uri) => {
    try {
      const rk = extractRkey(uri);
      const did = extractDid(uri);
      const recipe = await fetchRecipe(rk, did);
      results.push(recipe);
      if (onProgress) onProgress([...results]);
      return recipe;
    } catch (e) {
      console.error(`Failed to fetch recipe ${uri}:`, e);
      return null;
    }
  });

  await Promise.allSettled(promises);
  return results.filter((r): r is RecordEnvelope => r !== null);
}

// ── Collection API Functions ───────────────────────────────────────────────

/** Fetch all collections. Returns all collection records (typically < 20). */
export async function fetchCollections(): Promise<CollectionEnvelope[]> {
  const params = new URLSearchParams({
    repo: DID,
    collection: COLLECTION_COLLECTION,
    limit: "100",
  });

  const res = await fetch(`${XRPC}/com.atproto.repo.listRecords?${params}`);
  if (!res.ok) throw new Error(`listRecords (collections) failed: ${res.status}`);
  const data: CollectionListResponse = await res.json();

  // Sort by sortOrder then name
  return data.records.sort((a, b) => {
    if (a.value.sortOrder !== b.value.sortOrder) {
      return a.value.sortOrder - b.value.sortOrder;
    }
    return a.value.name.localeCompare(b.value.name);
  });
}

/** Fetch a single collection by slug (which is the rkey). */
export async function fetchCollectionBySlug(slug: string): Promise<CollectionEnvelope> {
  const params = new URLSearchParams({
    repo: DID,
    collection: COLLECTION_COLLECTION,
    rkey: slug,
  });
  const res = await fetch(`${XRPC}/com.atproto.repo.getRecord?${params}`);
  if (!res.ok) throw new Error(`getRecord (collection) failed: ${res.status}`);
  return await res.json();
}

// ── Write API Functions ────────────────────────────────────────────────────

/** Upload a blob to ATProto. Requires an authenticated fetch handler. */
export async function uploadBlob(
  handler: (pathname: string, init?: RequestInit) => Promise<Response>,
  blob: Blob
): Promise<BlobRef> {
  const res = await handler("/xrpc/com.atproto.repo.uploadBlob", {
    method: "POST",
    headers: {
      "Content-Type": blob.type,
    },
    body: blob,
  });

  if (!res.ok) {
    throw new Error(`uploadBlob failed: ${res.status}`);
  }

  const data = await res.json();
  return data.blob;
}

/** Create a new recipe record on ATProto. */
export async function publishRecipe(
  handler: (pathname: string, init?: RequestInit) => Promise<Response>,
  did: string,
  recipeData: Omit<ChiveRecipe, "$type" | "createdAt">
): Promise<RecordEnvelope> {
  const record: ChiveRecipe = {
    $type: "com.chive.recipe",
    createdAt: new Date().toISOString(),
    ...recipeData,
  };

  const res = await handler("/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: did,
      collection: COLLECTION,
      record: record,
    }),
  });

  if (!res.ok) {
    throw new Error(`createRecord failed: ${res.status}`);
  }

  const data = await res.json();
  
  return {
    uri: data.uri,
    cid: data.cid,
    value: record,
  };
}

/** Delete a recipe record from ATProto. */
export async function deleteRecipe(
  handler: (pathname: string, init?: RequestInit) => Promise<Response>,
  did: string,
  rkey: string
): Promise<void> {
  const res = await handler("/xrpc/com.atproto.repo.deleteRecord", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: did,
      collection: COLLECTION,
      rkey: rkey,
    }),
  });

  if (!res.ok) {
    throw new Error(`deleteRecord failed: ${res.status}`);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a Bluesky CDN image URL from a blob CID. */
export function imageUrl(
  cid: string,
  size: "fullsize" | "thumbnail" = "fullsize",
  did: string = DID
): string {
  const feed = size === "thumbnail" ? "feed_thumbnail" : "feed_fullsize";
  return `https://cdn.bsky.app/img/${feed}/plain/${did}/${cid}@webp`;
}

/** Parse ISO 8601 duration (e.g. "PT1H30M") → total minutes. */
function parseDurationMinutes(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return parseInt(match[1] || "0") * 60 + parseInt(match[2] || "0");
}

/** Format ISO 8601 duration → human-readable string ("1h 30m", "25m"). */
export function formatDuration(iso: string): string {
  const total = parseDurationMinutes(iso);
  if (total === 0) return "";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** Extract the rkey (last segment) from an AT URI. */
export function extractRkey(uri: string): string {
  return uri.split("/").at(-1) ?? uri;
}

/** Extract the DID from an AT URI. */
export function extractDid(uri: string): string {
  if (uri.startsWith("at://")) {
    return uri.split("/")[2];
  }
  return uri;
}

/** Capitalize a cuisine/tag string. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
