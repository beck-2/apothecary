import type { APIRoute } from 'astro';
import { guard, json } from '../../lib/auth';
import { readText } from '../../lib/store';
import { fileFor, isCollection, parseYaml, validSlug } from '../../lib/items';
export const prerender = false;

/** Fetch the latest saved version of one item (from GitHub, so it includes edits not yet deployed). */
export const GET: APIRoute = async (ctx) => {
  const denied = guard(ctx);
  if (denied) return denied;
  const c = ctx.url.searchParams.get('collection');
  const slug = ctx.url.searchParams.get('slug');
  if (!isCollection(c) || !validSlug(slug)) return json({ error: 'Bad request' }, 400);
  try {
    const text = await readText(fileFor(c, slug));
    if (text === null) return json({ error: 'Not found' }, 404);
    return json({ slug, data: parseYaml(text) });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
};
