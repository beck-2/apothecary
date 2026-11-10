import type { APIRoute } from 'astro';
import { checkPassword, startSession, json } from '../../lib/auth';
export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const origin = ctx.request.headers.get('origin');
  if (origin && origin !== ctx.url.origin) return json({ error: 'Bad origin' }, 403);
  const { password } = await ctx.request.json().catch(() => ({}));
  if (typeof password === 'string' && checkPassword(password)) {
    startSession(ctx);
    return json({ ok: true });
  }
  await new Promise((r) => setTimeout(r, 800)); // slow down guessing
  return json({ error: 'Nope' }, 401);
};
