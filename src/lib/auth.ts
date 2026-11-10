import { createHmac, timingSafeEqual } from 'node:crypto';
import type { APIContext } from 'astro';
import { env } from './env';

export const SESSION_COOKIE = 'apothecary_session';
/** Readable by the page so it knows to load the editor. Grants nothing on its own. */
export const FLAG_COOKIE = 'apothecary_admin';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// The signing key is derived from the password, so changing the password signs everyone out.
const key = () => {
  const pw = env('ADMIN_PASSWORD');
  if (!pw) throw new Error('ADMIN_PASSWORD is not set');
  return createHmac('sha256', 'apothecary-session-v1').update(pw).digest();
};
const sign = (payload: string) => createHmac('sha256', key()).update(payload).digest('base64url');

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkPassword(attempt: string) {
  const pw = env('ADMIN_PASSWORD');
  if (!pw) return false;
  const a = createHmac('sha256', 'cmp').update(attempt).digest('hex');
  const b = createHmac('sha256', 'cmp').update(pw).digest('hex');
  return safeEqual(a, b);
}

export function startSession(ctx: APIContext) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const token = `${exp}.${sign(String(exp))}`;
  const secure = ctx.url.protocol === 'https:';
  ctx.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: MAX_AGE });
  ctx.cookies.set(FLAG_COOKIE, '1', { httpOnly: false, secure, sameSite: 'strict', path: '/', maxAge: MAX_AGE });
}

export function endSession(ctx: APIContext) {
  ctx.cookies.delete(SESSION_COOKIE, { path: '/' });
  ctx.cookies.delete(FLAG_COOKIE, { path: '/' });
}

export function isAuthed(ctx: APIContext) {
  const token = ctx.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  try {
    return safeEqual(sig, sign(exp));
  } catch {
    return false;
  }
}

/** Reject cross-site requests and unauthenticated callers. Returns a Response to send, or null to continue. */
export function guard(ctx: APIContext): Response | null {
  const origin = ctx.request.headers.get('origin');
  if (origin && origin !== ctx.url.origin) return json({ error: 'Bad origin' }, 403);
  if (!isAuthed(ctx)) return json({ error: 'Not signed in' }, 401);
  return null;
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
