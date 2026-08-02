# Chive — Frontend Engineering Guide

Everything a frontend engineer needs to build a client against the Chive recipe dataset on Bluesky.

---

## What Is This

Chive is a recipe dataset published to [Bluesky](https://bsky.app) via the [AT Protocol](https://atproto.com). We have ~3,300 recipes — each with a full-size image, thumbnail, ingredients, steps, nutrition data, and metadata — stored as custom ATProto records under a Bluesky account.

**There is no proprietary API.** All recipe data is fetched from public ATProto endpoints. No authentication is required to read. No backend is needed. A static Vite + Preact app can query Bluesky directly from the browser.

---

## Key Identifiers

| What | Value |
|---|---|
| Bluesky handle | `@getchive.bsky.social` |
| DID (stable identity) | `did:plc:jp6ebt246qu4imwxgv6akfm4` |
| Collection NSID | `com.chive.recipe` |
| Image CDN base | `https://cdn.bsky.app/img` |

> **Always use the DID, not the handle**, for API calls. The DID is immutable. The handle could change.

---

## Fetching Recipes

### List all recipes (paginated)

```
GET https://bsky.social/xrpc/com.atproto.repo.listRecords
    ?repo=did:plc:jp6ebt246qu4imwxgv6akfm4
    &collection=com.chive.recipe
    &limit=100
    &cursor=<optional, from previous response>
```

No auth required. Returns up to 100 records per page with a `cursor` string for the next page. When `cursor` is absent from the response, you've reached the end.

**TypeScript example:**

```ts
const DID = "did:plc:jp6ebt246qu4imwxgv6akfm4";
const COLLECTION = "com.chive.recipe";
const XRPC = "https://bsky.social/xrpc";

interface ListResponse {
  records: { uri: string; cid: string; value: ChiveRecipe }[];
  cursor?: string;
}

async function fetchAllRecipes(): Promise<ChiveRecipe[]> {
  const all: ChiveRecipe[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({
      repo: DID,
      collection: COLLECTION,
      limit: "100",
    });
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`${XRPC}/com.atproto.repo.listRecords?${params}`);
    const data: ListResponse = await res.json();

    for (const record of data.records) {
      all.push(record.value);
    }
    cursor = data.cursor;
  } while (cursor);

  return all;
}
```

### Fetch a single recipe by rkey

```
GET https://bsky.social/xrpc/com.atproto.repo.getRecord
    ?repo=did:plc:jp6ebt246qu4imwxgv6akfm4
    &collection=com.chive.recipe
    &rkey=feb673ec86b78df1
```

The `rkey` is the last segment of the AT URI. Given:
```
at://did:plc:jp6ebt246qu4imwxgv6akfm4/com.chive.recipe/feb673ec86b78df1
                                                        ^^^^^^^^^^^^^^^^
                                                        this is the rkey
```

---

## Recipe Schema

Every record has `$type: "com.chive.recipe"`. Below is the full TypeScript interface:

```ts
interface ChiveRecipe {
  $type: "com.chive.recipe";

  // ── Always present ──────────────────────────────────────────────────
  name: string;                // Recipe title
  description: string;         // 1-3 sentence editorial description
  ingredients: string[];       // e.g. ["2 cups flour", "1 tsp salt"]
  steps: string[];             // Ordered preparation steps (prose, not structured)
  image: BlobRef;              // Full-size image (typically 1200×800 WebP, ~50-80KB)
  thumbnail: BlobRef;          // Thumbnail image (450×300 WebP, ~8-16KB)
  createdAt: string;           // ISO 8601 timestamp

  // ── Optional ────────────────────────────────────────────────────────
  cuisine?: string;            // Lowercase: "american", "mexican", "italian", etc.
  tags?: string[];             // Lowercase: ["dinner"], ["snack", "appetizer"]
  yield?: string;              // Serving count as string: "4", "6", "12"
  times?: {
    prep?: string;             // ISO 8601 duration: "PT15M", "PT1H30M"
    cook?: string;
    total?: string;
  };
  nutrition?: {
    calories?: string;              // "619 kcal"
    fatContent?: string;            // "39 g"
    saturatedFatContent?: string;
    unsaturatedFatContent?: string;
    carbohydrateContent?: string;
    fiberContent?: string;
    sugarContent?: string;
    proteinContent?: string;
    sodiumContent?: string;
    cholesterolContent?: string;
    servingSize?: string;           // "6 servings"
  };
}

interface BlobRef {
  $type: "blob";
  ref: { $link: string };      // CID (content-addressed hash)
  mimeType: "image/webp";
  size: number;                // bytes
}
```

### Field Coverage (from production data)

| Field | Coverage | Notes |
|---|---|---|
| `name` | 100% | Always present, always non-empty |
| `description` | 100% | 1-3 sentences |
| `ingredients` | 100% | Array of strings, typically 5-25 items |
| `steps` | 100% | Array of strings, typically 3-12 items |
| `image` | 100% | Full-size WebP blob |
| `thumbnail` | 100% | Thumbnail WebP blob |
| `cuisine` | ~94% | Lowercase string |
| `tags` | ~97% | Array of lowercase strings |
| `yield` | ~98% | String representation of serving count |
| `times` | ~95% | At least one of prep/cook/total |
| `nutrition` | ~60% | Full or partial nutrition info |

---

## Image Handling

Images are stored as ATProto blobs. You do NOT need to fetch raw blobs — Bluesky's CDN serves them over HTTPS.

### Constructing image URLs

Given a blob's CID (from `image.ref.$link` or `thumbnail.ref.$link`):

```ts
const DID = "did:plc:jp6ebt246qu4imwxgv6akfm4";

function imageUrl(cid: string, size: "fullsize" | "thumbnail" = "fullsize"): string {
  const feed = size === "thumbnail" ? "feed_thumbnail" : "feed_fullsize";
  return `https://cdn.bsky.app/img/${feed}/plain/${DID}/${cid}@jpeg`;
}

// Usage
const recipe: ChiveRecipe = /* ... */;
const heroImg = imageUrl(recipe.image.ref.$link, "fullsize");
const thumbImg = imageUrl(recipe.thumbnail.ref.$link, "thumbnail");
```

### Image formats

The `@jpeg` suffix on the CDN URL tells the CDN to transcode the blob to JPEG. You can also use `@png` or `@webp`. The source images are WebP, so `@webp` avoids a transcode.

### CDN image sizing

| CDN path | Max dimensions | Use case |
|---|---|---|
| `feed_fullsize` | 2000px | Hero images, detail pages |
| `feed_thumbnail` | 1000px | Cards, grid views, lists |

Both paths preserve aspect ratio. Our full-size originals are 1200×800 and thumbnails are 450×300, so they'll always be served at original resolution.

---

## Practical Considerations

### Caching

ATProto records are content-addressed (each has a CID). The CID changes when the record is updated. You can cache aggressively by CID. For the full collection, consider:

- **On first load**: Fetch all records via `listRecords` (paginated). At 3,300 recipes this is about 34 API calls (100/page). Total payload is roughly 3-5MB of JSON.
- **Caching strategy**: Store records in IndexedDB or localStorage, keyed by AT URI. On subsequent visits, only refetch if stale.

### Rate Limits

The public XRPC endpoints have generous rate limits for reads:

- `listRecords`: No documented hard limit for unauthenticated reads, but be reasonable
- Fetching all 3,300 recipes serially takes about 34 requests — this is fine
- Image CDN has no known rate limiting for normal usage

### Routing with rkeys

The rkey (16-char hex string) makes a clean URL slug:

```
/recipe/feb673ec86b78df1   →   Pot Roast
/recipe/6b3cb6fca5af3040   →   Pressure Cooker Chicken and Rice Soup
```

These are stable and permanent — they derive from a content hash and will never change.

### Parsing ISO 8601 Durations

The `times.prep`, `times.cook`, and `times.total` fields use ISO 8601 durations. Common patterns:

```
PT15M       → 15 minutes
PT1H30M     → 1 hour 30 minutes
PT250M      → 250 minutes (≈ 4 hrs 10 min)
PT0M        → 0 minutes (edge case — treat as "not specified")
```

Quick parser:

```ts
function parseDuration(iso: string): { hours: number; minutes: number } {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return { hours: 0, minutes: 0 };
  const totalMin = (parseInt(match[1] || "0") * 60) + parseInt(match[2] || "0");
  return { hours: Math.floor(totalMin / 60), minutes: totalMin % 60 };
}
```

### Search and Filtering

ATProto does not provide server-side search or filtering. All filtering must be done client-side. Practical approaches:

- **Preload all records** on app init and build a client-side index
- **Filter by**: `cuisine`, `tags`, `times.total` (cook time), presence of `nutrition`
- **Search by**: substring match on `name`, `description`, `ingredients`
- Consider [Fuse.js](https://fusejs.io/) or [MiniSearch](https://lucaong.github.io/minisearch/) for fuzzy search over the preloaded dataset

---

## Quick Verification

Test that everything works by pasting this into a browser console:

```js
fetch("https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=did:plc:jp6ebt246qu4imwxgv6akfm4&collection=com.chive.recipe&limit=3")
  .then(r => r.json())
  .then(data => {
    for (const r of data.records) {
      const v = r.value;
      const cid = v.thumbnail.ref.$link;
      const img = `https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:jp6ebt246qu4imwxgv6akfm4/${cid}@jpeg`;
      console.log(`${v.name} — ${v.ingredients.length} ingredients — ${img}`);
    }
  });
```

---

## Live Endpoints (copy-paste ready)

```bash
# List first 5 recipes
curl -s "https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=did:plc:jp6ebt246qu4imwxgv6akfm4&collection=com.chive.recipe&limit=5" | jq '.records[].value.name'

# Fetch a specific recipe
curl -s "https://bsky.social/xrpc/com.atproto.repo.getRecord?repo=did:plc:jp6ebt246qu4imwxgv6akfm4&collection=com.chive.recipe&rkey=feb673ec86b78df1" | jq '.value'

# Get a recipe image URL (copy CID from above, open in browser)
# https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:jp6ebt246qu4imwxgv6akfm4/bafkreid6cxk2mktdlgzadgplspddodnur2cvnsy5czevges5tn3fb44vzy@jpeg
```
