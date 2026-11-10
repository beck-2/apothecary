import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { env } from './env';

/**
 * Where edits go. With GITHUB_TOKEN set (production), every save is one commit to the repo,
 * which triggers a Vercel redeploy. Without it, `astro dev` writes straight to the local files.
 */
export type Change = { path: string; text?: string; base64?: string; delete?: true };

const repo = () => env('GITHUB_REPO') || 'beck-2/apothecary';
const branch = () => env('GITHUB_BRANCH') || 'main';
const token = () => env('GITHUB_TOKEN');
export const storageMode = () => (token() ? 'github' : import.meta.env.DEV ? 'local' : 'none');

async function gh<T = any>(p: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`https://api.github.com/repos/${repo()}${p}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`GitHub ${init.method ?? 'GET'} ${p} → ${r.status} ${await r.text()}`);
  return r.status === 204 ? (null as T) : r.json();
}

export async function readText(file: string): Promise<string | null> {
  const mode = storageMode();
  if (mode === 'local') {
    try {
      return await readFile(path.join(process.cwd(), file), 'utf8');
    } catch {
      return null;
    }
  }
  if (mode === 'none') throw new Error('Editing is not configured (GITHUB_TOKEN is missing).');
  const r = await fetch(
    `https://api.github.com/repos/${repo()}/contents/${encodeURI(file)}?ref=${branch()}`,
    { headers: { Authorization: `Bearer ${token()}`, Accept: 'application/vnd.github.raw+json', 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store' }
  );
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub read ${file} → ${r.status}`);
  return r.text();
}

export async function commit(changes: Change[], message: string) {
  const mode = storageMode();
  if (mode === 'none') throw new Error('Editing is not configured (GITHUB_TOKEN is missing).');
  if (mode === 'local') {
    for (const c of changes) {
      const abs = path.join(process.cwd(), c.path);
      if (c.delete) await unlink(abs).catch(() => {});
      else {
        await mkdir(path.dirname(abs), { recursive: true });
        await writeFile(abs, c.base64 ? Buffer.from(c.base64, 'base64') : (c.text ?? ''));
      }
    }
    return;
  }
  // One commit for all changes: blobs → tree → commit → move branch.
  const ref = await gh(`/git/ref/heads/${branch()}`);
  const head = ref.object.sha as string;
  const base = await gh(`/git/commits/${head}`);
  const tree = [];
  for (const c of changes) {
    if (c.delete) tree.push({ path: c.path, mode: '100644', type: 'blob', sha: null });
    else if (c.base64) {
      const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: c.base64, encoding: 'base64' }) });
      tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
    } else tree.push({ path: c.path, mode: '100644', type: 'blob', content: c.text ?? '' });
  }
  const newTree = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
  const newCommit = await gh('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }),
  });
  await gh(`/git/refs/heads/${branch()}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha }) });
}
