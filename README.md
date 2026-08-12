# Chive

Chive is a lightweight, open-source recipe app powered by the
[AT Protocol](https://atproto.com/). Recipe records live in their authors'
ATProto repositories; Chive serves a static web application that reads those
records directly from the network.

## Architecture

This repository is intentionally limited to the public application boundary:

- the Preact/Vite web application;
- the static recipe discovery index at `public/index.json`;
- CI and static-site deployment configuration.

The polling implementation and its infrastructure access live in the private
`chive-recipes/chive-indexer` repository. That repository opens reviewable pull
requests containing only generated `public/index.json` changes. The private
indexer discovers repositories that publish `com.chive.recipe` through
ATProto's `com.atproto.sync.listReposByCollection` API; authors do not need to
register with or visit Chive. The website ships entirely as static assets and
clients fetch full recipe records from ATProto.

## Development

Requirements: Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Useful checks:

```sh
npm run build
npm run test
npm run test:e2e
```

## Deployment

Pushes to `main` build and deploy the project to the existing Cloudflare Pages
project named `chive`. The `production` GitHub environment needs:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` scoped to deploy the `chive` Pages project

No server-side function or database binding is required; the deployed output
is the static `dist` directory.

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
