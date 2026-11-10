import type { APIRoute } from 'astro';
import { guard, json } from '../../lib/auth';
import { commit, readText, storageMode, type Change } from '../../lib/store';
import { fileFor, isCollection, parseYaml, validSlug } from '../../lib/items';
export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const denied = guard(ctx);
  if (denied) return denied;
  const body = await ctx.request.json().catch(() => null);
  if (!body || !isCollection(body.collection) || !validSlug(body.slug)) return json({ error: 'Bad request' }, 400);
  const file = fileFor(body.collection, body.slug);
  try {
    const text = await readText(file);
    if (text === null) return json({ ok: true }); // already gone
    const data = parseYaml(text) ?? {};
    const changes: Change[] = [{ path: file, delete: true }];
    // Remove the herb's own uploaded illustration too, if it has one named after it.
    const own = `../../assets/herbs/${body.slug}.jpg`;
    if (body.collection === 'herbs' && data.image === own) changes.push({ path: `src/assets/herbs/${body.slug}.jpg`, delete: true });
    await commit(changes, `Remove ${body.collection === 'herbs' ? 'herb' : 'potion'}: ${data.name ?? body.slug}`);
    return json({ ok: true, mode: storageMode() });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
};
