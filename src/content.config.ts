import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const text = z.string().nullish().transform((v) => v ?? '');

const herbs = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/herbs' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      latin: text,
      aliases: z.array(z.string()).default([]),
      category: z.string().default('herb'),
      status: z.enum(['growing', 'collected', 'wishlist']).default('collected'),
      jarColor: z.string().default('#d9c7a0'),
      origin: text,
      intendedUse: text,
      blurb: text,
      evidence: z.coerce.number().int().min(0).max(3),
      evidenceSummary: text,
      sources: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
      psychoactive: z.boolean().default(false),
      legal: text,
      growing: z
        .object({
          zones: text,
          sun: text,
          water: text,
          soil: text,
          propagation: text,
          harvest: text,
        })
        .partial()
        .default({}),
      history: text,
      culture: text,
      preparations: z.array(z.object({ method: z.string(), notes: text })).default([]),
      risks: text,
      pairsWith: z.array(reference('herbs')).default([]),
      image: image().nullish(),
      imageAlt: text,
      imageCredit: z
        .object({ artist: text, work: text, url: text, license: text })
        .partial()
        .nullish(),
      draft: z.boolean().default(true),
    }),
});

const potions = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/potions' }),
  schema: z.object({
    name: z.string(),
    type: z.enum(['beverage', 'stew', 'syrup', 'tincture', 'other']),
    ingredients: z
      .array(z.object({ herb: reference('herbs').nullish(), other: text, amount: text }))
      .default([]),
    method: text,
    notes: text,
    made: z.coerce.date().nullish(),
    rating: z.number().int().min(1).max(5).nullish(),
  }),
});

export const collections = { herbs, potions };
