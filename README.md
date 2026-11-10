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

## Editing on the live site (one-time setup)

On the deployed site, Keystatic saves by committing to this GitHub repo, and Vercel redeploys on each commit. To turn it on:

1. Run `npm run dev`, open http://localhost:4321/keystatic, and in the dashboard switch to GitHub mode to follow Keystatic's GitHub App setup. You can also follow the [Keystatic GitHub mode docs](https://keystatic.com/docs/github-mode).
2. Add the generated env vars (`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`) to the Vercel project.

## Image credits

Herb illustrations are public-domain botanical plates. Each herb's page credits the artist, the source, and the license.
