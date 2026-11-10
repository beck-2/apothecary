import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { herbFields, potionFields } from './lib/schema';

// Herb references (pairsWith, potion ingredients) are plain slugs so that deleting a
// herb in the editor can never break the build. Pages skip slugs that no longer exist.
const herbs = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/herbs' }),
  schema: ({ image }) => z.object({ ...herbFields, image: image().nullish() }),
});

const potions = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/potions' }),
  schema: z.object(potionFields),
});

export const collections = { herbs, potions };
