# Chive

Chive is a lightweight, open-source recipe app powered by the
[AT Protocol](https://atproto.com/). Recipe records live in their authors'
ATProto repositories; Chive serves a static web application that reads those
records directly from the network.

## Architecture

This repository is intentionally limited to the public application boundary:

- the Preact/Vite web application;
- the static recipe discovery index at `public/index.json`;
- the Cloudflare Pages Function that registers signed-in users for indexing;
- CI and static-site deployment configuration.

The polling implementation and its infrastructure access live in the private
`chive-recipes/chive-indexer` repository. That repository opens reviewable pull
requests containing only generated `public/index.json` changes. The website
continues to ship as static assets and clients fetch full recipe records from
ATProto.

The registration endpoint accepts a short-lived ATProto service-auth token
signed by the user's DID key. OAuth access tokens and DPoP keys remain in the
browser and are never sent to Chive.

The endpoint is public by design: its source contains no credentials or
indexing policy. It accepts only proofs scoped to
`did:web:chive.pages.dev#chive_tracker` and `com.chive.actor.track`, then stores
the authenticated DID in D1. The private indexer has read-only access to that
registration data.

## Development

Requirements: Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Useful checks:

```sh
npm run build
npm run typecheck:worker
npm run test
npm run test:e2e
```

The app can run without Cloudflare locally. User registration requires a Pages
environment with a D1 binding named `DB`.

The D1 schema lives in `migrations/`. Apply migrations when provisioning a new
database with `npx wrangler d1 migrations apply chive_users --remote`; the
request handler deliberately does not run schema changes.

After changing OAuth scopes, existing users must sign out and back in before
their PDS can issue a proof carrying the new permission.

## Deployment

Pushes to `main` build and deploy the project to the existing Cloudflare Pages
project named `chive`. The `production` GitHub environment needs:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` scoped to deploy the `chive` Pages project

The D1 database is bound as `DB` in `wrangler.toml`. A deployment token does
not grant the browser or the Pages Function direct Cloudflare API access.

## Generated data

`public/index.json` is generated data and contains only the compact discovery
fields needed by the browser:

```json
{"t":"Recipe title","id":"at://did:example:alice/com.chive.recipe/key","c":"cuisine","g":["tag"]}
```

Do not hand-edit this file. Index updates arrive as pull requests from the
private indexer repository and must pass the same CI checks as application
changes.

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
