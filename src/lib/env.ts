/** Read a server-side env var at runtime (Vercel) or from .env (astro dev). */
export const env = (key: string): string | undefined =>
  (typeof process !== 'undefined' ? process.env[key] : undefined) || (import.meta.env as Record<string, string | undefined>)[key];
