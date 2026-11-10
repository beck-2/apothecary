import type { APIRoute } from 'astro';
import { endSession, json } from '../../lib/auth';
export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  endSession(ctx);
  return json({ ok: true });
};
