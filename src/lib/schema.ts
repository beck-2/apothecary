import { z } from 'astro/zod';

/** Shapes of the YAML files in src/content. Shared by the content collections and the editing API. */
const text = z.string().nullish().transform((v) => v ?? '');
const slugList = z.array(z.string()).default([]);

export const CATEGORIES = ['herb', 'spice', 'tea', 'root', 'flower', 'fungus', 'seed', 'supplement'] as const;
export const STATUSES = ['growing', 'collected', 'wishlist'] as const;
export const POTION_TYPES = ['beverage', 'stew', 'syrup', 'tincture', 'other'] as const;

export const herbFields = {
  name: z.string().trim().min(1),
  latin: text,
  aliases: z.array(z.string()).default([]),
  category: z.string().default('herb'),
  status: z.enum(STATUSES).default('collected'),
  jarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#d9c7a0'),
  origin: text,
  intendedUse: text,
  blurb: text,
  evidence: z.coerce.number().int().min(0).max(3),
  evidenceSummary: text,
  sources: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
  psychoactive: z.boolean().default(false),
  legal: text,
  growing: z
    .object({ zones: text, sun: text, water: text, soil: text, propagation: text, harvest: text })
    .partial()
    .default({}),
  history: text,
  culture: text,
  preparations: z.array(z.object({ method: z.string(), notes: text })).default([]),
  risks: text,
  pairsWith: slugList,
  imageAlt: text,
  imageCredit: z.object({ artist: text, work: text, url: text, license: text }).partial().nullish(),
  draft: z.boolean().default(true),
};

export const potionFields = {
  name: z.string().trim().min(1),
  type: z.enum(POTION_TYPES),
  ingredients: z
    .array(z.object({ herb: z.string().nullish(), other: text, amount: text }))
    .default([]),
  method: text,
  notes: text,
  made: z.coerce.date().nullish(),
  rating: z.number().int().min(1).max(5).nullish(),
};

/** What the editing API accepts (image is a repo-relative path string, set by the server). */
export const herbInput = z.object({ ...herbFields, image: z.string().nullish() });
export const potionInput = z.object({ ...potionFields, made: z.string().nullish() });

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
