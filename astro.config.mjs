// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

// Pages are prerendered (static). Only the Keystatic admin and its API run on demand.
export default defineConfig({
  site: 'https://apothecary.vercel.app',
  adapter: vercel({ imageService: true }),
  integrations: [react(), markdoc(), keystatic()],
});
