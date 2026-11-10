import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import { toast } from '../lib/toast';
import { HerbForm, PotionForm, newHerb, newPotion, type Herb, type Potion } from './forms';
import './editor.css';

type Collection = 'herbs' | 'potions';
type Target = { collection: Collection; slug: string | null };

let started = false;
let open: (t: Target) => void = () => {};

/** Called once the page knows this browser is unlocked. */
export function start() {
  if (started) return;
  started = true;
  const host = document.createElement('div');
  document.body.appendChild(host);
  createRoot(host).render(<Editor />);

  document.addEventListener('click', async (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-new],[data-edit],[data-delete]');
    if (!el || !document.documentElement.dataset.admin) return;
    e.preventDefault();
    if (el.dataset.new) open({ collection: el.dataset.new as Collection, slug: null });
    else if (el.dataset.edit) {
      el.closest('dialog')?.close();
      open({ collection: el.dataset.edit as Collection, slug: el.dataset.slug! });
    } else if (el.dataset.delete) await remove(el);
  });
}

async function api(path: string, body?: unknown) {
  const r = await fetch(path, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  if (r.status === 401) {
    delete document.documentElement.dataset.admin;
    throw new Error('Your session ended. Tap the star to unlock again.');
  }
  if (!r.ok) throw new Error(json.error || `Something went wrong (${r.status})`);
  return json;
}

/** Local dev rebuilds instantly, so reload; on the live site the redeploy takes about a minute. */
const afterSave = (mode: string, verb: string, next?: string) => {
  const go = () => (next ? (location.href = next) : location.reload());
  if (mode === 'local') {
    toast(`${verb}.`);
    setTimeout(go, 700);
  } else {
    toast(`${verb}. The site will update in about a minute.`, 'ok', 6000);
    if (next) setTimeout(go, 1500);
  }
};

async function remove(el: HTMLElement) {
  const { delete: collection, slug, name, after } = el.dataset;
  if (el.dataset.busy) return;
  if (!confirm(`Delete ${name ?? 'this'}? This can't be undone here (it stays in the repo's history).`)) return;
  el.dataset.busy = '1';
  try {
    const r = await api('/api/delete', { collection, slug });
    el.closest('dialog')?.close();
    // Hide it right away; the rebuilt site will drop it for real.
    if (collection === 'potions') el.closest<HTMLElement>('.potion')?.remove();
    else document.querySelector(`[data-open="herb-${slug}"]`)?.remove();
    afterSave(r.mode, `${name ?? 'Item'} deleted`, after);
  } catch (err) {
    toast((err as Error).message, 'error', 6000);
  } finally {
    delete el.dataset.busy;
  }
}

function Editor() {
  const ref = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [data, setData] = useState<Herb | Potion | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    open = async (t) => {
      setTarget(t);
      setError('');
      setImage(null);
      setData(null);
      ref.current?.showModal();
      if (!t.slug) return setData(t.collection === 'herbs' ? newHerb() : newPotion());
      try {
        const r = await api(`/api/item?collection=${t.collection}&slug=${encodeURIComponent(t.slug)}`);
        setData(t.collection === 'herbs' ? newHerb(r.data) : newPotion(r.data));
      } catch (err) {
        setError((err as Error).message);
      }
    };
  }, []);

  const close = () => ref.current?.close();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !data) return;
    setSaving(true);
    setError('');
    try {
      const r = await api('/api/save', { collection: target.collection, slug: target.slug, data, image });
      close();
      afterSave(r.mode, `${data.name} saved`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const kind = target?.collection === 'herbs' ? 'jar' : 'potion';
  return (
    <dialog ref={ref} className="editor" onClose={() => setTarget(null)}>
      <form onSubmit={save} className="editor-form">
        <header className="editor-head">
          <h2>{target?.slug ? `Edit ${data?.name || kind}` : `New ${kind}`}</h2>
          <button type="button" className="x" aria-label="Close" onClick={close}>×</button>
        </header>
        <div className="editor-body">
          {!data && !error && <p className="muted">Opening…</p>}
          {data && target?.collection === 'herbs' && (
            <HerbForm value={data as Herb} onChange={setData} image={image} onImage={setImage} self={target.slug} />
          )}
          {data && target?.collection === 'potions' && <PotionForm value={data as Potion} onChange={setData} />}
        </div>
        <footer className="editor-foot">
          {error && <p className="error" role="alert">{error}</p>}
          <button type="button" className="tool-btn" onClick={close}>Cancel</button>
          <button type="submit" className="save" disabled={!data || saving}>{saving ? 'Saving…' : 'Save'}</button>
        </footer>
      </form>
    </dialog>
  );
}
