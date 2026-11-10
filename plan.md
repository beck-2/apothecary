# Apothecary — Project Plan

## Goal

A cozy, aesthetic place to record the herbs and concoctions I collect and grow, and the combinations that work well together.

## Format

A one-page website where I can drop in and keep my recipes.

### Cabinet (home)
- A wooden apothecary cabinet with shelves of small labelled jars. Each jar holds one spice, herb, tea, supplement, or fungus.
- Clicking a jar opens a short **blurb card** with:
  - name, Latin name, and an illustration
  - **origin**: where it comes from
  - **intended use**: what it's traditionally or currently used for
  - an **evidence icon** showing how thoroughly it has been studied (scale below)
  - a link to the herb's full page
- Filters/shelves by category, evidence level, and "growing in my garden" vs. "in my collection".

### Herb pages (one per herb)
Each herb gets a full page with these sections:
1. **Growing instructions**: hardiness zone, sun, water, soil, propagation, harvest
2. **History**
3. **Cultural significance**
4. **Common preparations**: tea/infusion, decoction, tincture, culinary, smoke/incense, etc.
5. **Potential risks**: side effects, drug interactions, pregnancy, dosage limits, legal status
6. **Evidence summary**: what the research shows, with a few citations
7. **Image credit**: artist, source, license

### Potions tab
Records my favorite **beverages, stews, syrups** (and tinctures, etc.) made from the cabinet's ingredients.
- ingredients that link back to their jars, with amounts
- method, notes, date made, personal rating
- "pairs well with": good combinations show up on each herb's page as well

## Content scope
- **Mostly herbs and supplements that have been scientifically studied.**
- **Also herbs that matter in particular cultures but aren't backed by Western science.** These are recorded respectfully and labelled honestly with the evidence icon. The goal isn't to dismiss them.
- **Psychoactive plants are in scope.** They get extra attention to risks, interactions, and legal status.
- Claude writes the first-draft blurbs and pages. I'll rewrite them in my own voice later. Drafts should be marked so I can find the ones I haven't edited (`draft: true`).
- The site shows a short "not medical advice" note in the footer.

### Evidence scale (icon)
| Level | Icon idea | Meaning |
|---|---|---|
| 0 | 🕯️ candle | **Traditional / cultural use.** Little to no formal research |
| 1 | 🌱 sprout | **Preliminary.** Lab, animal, or small pilot studies |
| 2 | 🌿 sprig | **Emerging.** Some human RCTs, results mixed or small |
| 3 | 🌳 tree | **Well studied.** Multiple RCTs and/or meta-analyses |

(These emoji are placeholders until the hand-drawn icons exist.)

### Starter cabinet (approved 2026-11-09, 50 jars)
- **Well studied (3):** chamomile, peppermint, ginger, turmeric, lavender, green tea, matcha, black tea, St. John's wort, saffron, garlic, ginkgo, Panax ginseng, cacao, kava *(psychoactive)*, psilocybin mushrooms *(psychoactive)*, cannabis *(psychoactive)*
- **Emerging (2):** valerian, ashwagandha, lemon balm, elderberry, echinacea, holy basil (tulsi), lion's mane, reishi, rosemary, hibiscus, rhodiola, passionflower, milk thistle, nettle, fennel, licorice root, black seed, hawthorn, cinnamon, yerba mate
- **Preliminary (1):** calendula, rooibos, butterfly pea, mullein, lemongrass, elderflower, kratom *(psychoactive)*
- **Traditional / cultural (0):** mugwort *(mildly psychoactive)*, blue lotus *(psychoactive)*, wormwood, damiana, yarrow, white sage *(sacred to many Indigenous peoples; note overharvesting and ethical sourcing)*
- **Rejected:** cordyceps, skullcap, kanna, calea
- Evidence levels are first guesses and get checked when each page is written.

## Visuals
- Cozy palette: warm wood, parchment, amber glass, muted sage and plum. Serif display font plus a handwritten accent font for jar labels.
- The cabinet and jars are **SVG/CSS** shapes: tiny, sharp at any size, easy to recolor. Hand-drawn art can replace them later without changing the data.
- **Herb illustrations (for now):** public-domain or openly licensed *human-drawn* botanical illustrations, sourced mainly from:
  - Wikimedia Commons, e.g. *Köhler's Medizinal-Pflanzen* (1887), *Curtis's Botanical Magazine*, Thomé's *Flora von Deutschland* (1885)
  - Biodiversity Heritage Library (Flickr, public domain)
  - Every image records artist, source URL, and license in the data, and the credit is shown on the herb page.
- Later: swap in my own hand-drawn art by changing an image path. No code changes.

## Performance
- Static pages, very little JavaScript (only the jar popup and filters).
- Images go through an optimizer (resized, AVIF/WebP, lazy-loaded below the fold) and are served from Vercel's CDN.
- Target: Lighthouse performance ≥ 95 and first load under ~150 KB on the home page.

## Tech stack

Needs: deploy on Vercel, no heavy backend, a place to store **and edit** the apothecary data, fast graphics.

### ✅ Chosen (2026-11-09): Astro + Keystatic (content in the repo)
- **Astro**: a static site framework. It ships zero JS by default and adds small interactive "islands" (the jar popup) only where needed. Its built-in `<Image>` optimizes the illustrations. First-class Vercel adapter.
- **Keystatic**: a git-backed CMS. Gives me an `/keystatic` admin page with forms for herbs and potions. Saving commits the YAML/Markdown files to this GitHub repo, and Vercel redeploys automatically.
- **Data**: `src/content/herbs/*.mdoc` and `src/content/potions/*.mdoc`, validated by typed schemas.
- **Pros:** free, no database to run, full version history of every recipe edit, works offline, data stays readable as plain files forever.
- **Cons:** an edit takes ~1 minute to go live (it waits for the redeploy). Editing on the live site needs a one-time GitHub app setup.

### Alternative: Next.js + Supabase (or Neon Postgres)
- Real database, so edits show up instantly. Image uploads go to Supabase Storage.
- **Pros:** instant edits, easy to add features like multiple users or search later.
- **Cons:** more moving parts (auth, DB schema, env vars), a hosted DB to maintain, more JS shipped.

### Simplest: Astro + hand-edited Markdown/JSON
- Same as the recommended option without the admin UI. I edit files in GitHub or my editor.

**Decision:** Astro + Keystatic.

## Data model (draft)

```yaml
# herb
slug: chamomile
name: Chamomile
latin: Matricaria chamomilla
aliases: [German chamomile]
category: herb | spice | tea | supplement | fungus | resin
jar: { color: "#e8d9a8", label: "Chamomile", shelf: 1 }
status: growing | collected | wishlist
origin: "Southern & Eastern Europe, Western Asia"
intendedUse: "Calming tea for sleep and digestion"
blurb: "…"
evidence: { level: 3, summary: "…", sources: [ { title, url } ] }
psychoactive: false
legal: "…"            # when relevant
growing: { zones: "3–9", sun: "full", water: "moderate", soil: "…", propagation: "…", harvest: "…" }
history: "…"
culture: "…"
preparations: [ { method: "infusion", notes: "…" } ]
risks: "…"
pairsWith: [lavender, lemon-balm]
image: { src, alt, artist, source, license }
draft: true

# potion
slug: sleepy-time-tea
name: Sleepy Time Tea
type: beverage | stew | syrup | tincture | other
ingredients: [ { herb: chamomile, amount: "2 tsp" }, { herb: lavender, amount: "¼ tsp" } ]
method: "…"
notes: "…"
made: 2026-11-09
rating: 5
```

## Milestones
1. **Setup**: pick the stack, scaffold the project, deploy an empty site to Vercel.
2. **Data**: schemas plus the 16 starter herbs (draft blurbs and pages) and 2–3 example potions.
3. **Cabinet**: SVG cabinet and jars, blurb popup, evidence icons, filters.
4. **Herb pages**: full layout with all sections and image credits.
5. **Potions tab**: list and detail views, ingredient links, "pairs well with".
6. **Images**: source, credit, and optimize public-domain botanical illustrations.
7. **Editing**: Keystatic admin (or the chosen alternative) working on the live site.
8. **Polish**: mobile layout, accessibility, Lighthouse pass, favicon.
9. **Later**: hand-drawn art, my own rewritten blurbs, search, a seasonal garden log.
