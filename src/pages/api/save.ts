import type { APIRoute } from 'astro';
import { ZodError } from 'astro/zod';
import { guard, json } from '../../lib/auth';
import { commit, readText, storageMode, type Change } from '../../lib/store';
import { fileFor, isCollection, slugify, toYaml, validSlug } from '../../lib/items';
export const prerender = false;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Body: { collection, slug?, data, image? }
 * - slug omitted → create a new item (slug comes from the name). Slugs never change on edit.
 * - image: base64 JPEG (herbs only), stored at src/assets/herbs/<slug>.jpg
 */
export const POST: APIRoute = async (ctx) => {
  const denied = guard(ctx);
  if (denied) return denied;
  const body = await ctx.request.json().catch(() => null);
  if (!body || !isCollection(body.collection)) return json({ error: 'Bad request' }, 400);
  const c = body.collection;
  const data = { ...(body.data ?? {}) };

  try {
    let slug: string;
    const creating = !body.slug;
    if (creating) {
      const base = slugify(String(data.name ?? '')) || (c === 'herbs' ? 'herb' : 'potion');
      slug = base;
      for (let i = 2; (await readText(fileFor(c, slug))) !== null; i++) slug = `${base}-${i}`;
    } else {
      if (!validSlug(body.slug)) return json({ error: 'Bad slug' }, 400);
      slug = body.slug;
      if ((await readText(fileFor(c, slug))) === null) return json({ error: 'That item no longer exists' }, 404);
    }

    const changes: Change[] = [];
    if (c === 'herbs' && typeof body.image === 'string' && body.image) {
      const bytes = Math.floor((body.image.length * 3) / 4);
      if (bytes > MAX_IMAGE_BYTES) return json({ error: 'Image is too large (4 MB max)' }, 413);
      const imgPath = `src/assets/herbs/${slug}.jpg`;
      changes.push({ path: imgPath, base64: body.image });
      data.image = `../../assets/herbs/${slug}.jpg`;
    }
    if (c === 'herbs' && data.image === '') data.image = null;

    const { yaml, name } = toYaml(c, data);
    changes.push({ path: fileFor(c, slug), text: yaml });
    await commit(changes, `${creating ? 'Add' : 'Update'} ${c === 'herbs' ? 'herb' : 'potion'}: ${name}`);
    return json({ ok: true, slug, mode: storageMode() });
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.issues[0];
      return json({ error: `${first.path.join('.') || 'field'}: ${first.message}` }, 422);
    }
    return json({ error: (e as Error).message }, 500);
  }
};
