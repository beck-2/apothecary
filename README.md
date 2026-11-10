# Apothecary

A cozy cabinet of herbs, teas, and potions, built with [Astro](https://astro.build) and [Keystatic](https://keystatic.com) and deployed on Vercel. See [plan.md](plan.md) for the full plan.

## Run locally

```bash
npm install
npm run dev
```

- Site: http://localhost:4321
- Editor: http://localhost:4321/keystatic. Locally, saving writes straight to the files in `src/content/`.

## Where things live

| What | Where |
|---|---|
| Herbs (one YAML file each) | `src/content/herbs/` |
| Potions | `src/content/potions/` |
| Herb illustrations | `src/assets/herbs/` (optimized automatically at build) |
| Editor fields | `keystatic.config.ts` |
| Site validation schema | `src/content.config.ts` (keep in sync with the editor fields) |

## Editing in the app

Tap the faint ☆ in the top-right corner and enter the password. The star fills in (★), and you can add, edit, and delete jars and potions right on the page. Tap ★ again to lock.

- **On the live site**, every save is a commit to this repo (`main`), and Vercel redeploys in about a minute.
- **Locally** (`npm run dev`), saves write straight to `src/content/` and the page reloads.

### One-time setup on Vercel

Add these under Project → Settings → Environment Variables (Production), then redeploy:

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD` | Your editing password. Changing it signs out every browser. |
| `GITHUB_TOKEN` | A [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) limited to **only** the `apothecary` repo, with **Repository permissions → Contents: Read and write**. |

Optional: `GITHUB_REPO` (default `beck-2/apothecary`) and `GITHUB_BRANCH` (default `main`).

For local editing, put `ADMIN_PASSWORD=...` in a `.env` file (it's gitignored).

### How it works

- `src/pages/api/login.ts` checks the password and sets a signed, httpOnly session cookie (30 days).
- `src/pages/api/save.ts` and `delete.ts` validate input against `src/lib/schema.ts` and commit through `src/lib/store.ts`.
- The editor UI (`src/admin/`) is only downloaded after you unlock, so visitors never load it.
- Keystatic (`/keystatic`) still works for local editing in `npm run dev`.

## Image credits

Herb illustrations are public-domain botanical plates. Each herb's page credits the artist, the source, and the license.
