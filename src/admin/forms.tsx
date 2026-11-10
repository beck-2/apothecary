import { useMemo, useState, type ReactNode } from 'react';

/* ---------- types & defaults ---------- */

export type Herb = {
  name: string; latin: string; aliases: string[]; category: string; status: string; jarColor: string;
  origin: string; intendedUse: string; blurb: string; evidence: number; evidenceSummary: string;
  sources: { title: string; url: string }[]; psychoactive: boolean; legal: string;
  growing: { zones: string; sun: string; water: string; soil: string; propagation: string; harvest: string };
  history: string; culture: string; preparations: { method: string; notes: string }[]; risks: string;
  pairsWith: string[]; image: string | null; imageAlt: string;
  imageCredit: { artist: string; work: string; url: string; license: string }; draft: boolean;
};
export type Potion = {
  name: string; type: string; ingredients: { herb: string; other: string; amount: string }[];
  method: string; notes: string; made: string; rating: number | null;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const s = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

export function newHerb(d: any = {}): Herb {
  const g = d.growing ?? {};
  const c = d.imageCredit ?? {};
  return {
    name: s(d.name), latin: s(d.latin), aliases: Array.isArray(d.aliases) ? d.aliases.map(s) : [],
    category: s(d.category) || 'herb', status: s(d.status) || 'collected', jarColor: s(d.jarColor) || '#b9c79a',
    origin: s(d.origin), intendedUse: s(d.intendedUse), blurb: s(d.blurb),
    evidence: d.evidence == null ? 1 : Number(d.evidence), evidenceSummary: s(d.evidenceSummary),
    sources: (d.sources ?? []).map((x: any) => ({ title: s(x.title), url: s(x.url) })),
    psychoactive: !!d.psychoactive, legal: s(d.legal),
    growing: { zones: s(g.zones), sun: s(g.sun), water: s(g.water), soil: s(g.soil), propagation: s(g.propagation), harvest: s(g.harvest) },
    history: s(d.history), culture: s(d.culture),
    preparations: (d.preparations ?? []).map((x: any) => ({ method: s(x.method), notes: s(x.notes) })),
    risks: s(d.risks), pairsWith: (d.pairsWith ?? []).map(s), image: d.image ? s(d.image) : null,
    imageAlt: s(d.imageAlt), imageCredit: { artist: s(c.artist), work: s(c.work), url: s(c.url), license: s(c.license) },
    draft: d.name === undefined ? false : !!d.draft,
  };
}

export function newPotion(d: any = {}): Potion {
  const ing = (d.ingredients ?? []).map((x: any) => ({ herb: s(x.herb), other: s(x.other), amount: s(x.amount) }));
  return {
    name: s(d.name), type: s(d.type) || 'beverage',
    ingredients: ing.length ? ing : [{ herb: '', other: '', amount: '' }],
    method: s(d.method), notes: s(d.notes),
    made: d.made ? s(d.made).slice(0, 10) : d.name === undefined ? today() : '',
    rating: d.rating ? Number(d.rating) : null,
  };
}

const herbIndex = (): { slug: string; name: string }[] => {
  try {
    return JSON.parse(document.getElementById('herb-index')?.textContent || '[]');
  } catch {
    return [];
  }
};

/* ---------- small building blocks ---------- */

function Field({ label, children, wide, hint }: { label: string; children: ReactNode; wide?: boolean; hint?: string }) {
  return (
    <label className={`field${wide ? ' wide' : ''}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

function Text({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

function Area({ value, onChange, rows = 4 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />;
}

function Section({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="section" open={open}>
      <summary>{title}</summary>
      <div className="grid">{children}</div>
    </details>
  );
}

function List<T>({ items, onChange, blank, render, addLabel }: {
  items: T[]; onChange: (v: T[]) => void; blank: T; addLabel: string;
  render: (item: T, set: (v: T) => void) => ReactNode;
}) {
  return (
    <div className="list wide">
      {items.map((item, i) => (
        <div className="row" key={i}>
          <div className="row-fields">{render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))))}</div>
          <button type="button" className="remove" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button type="button" className="tool-btn" onClick={() => onChange([...items, blank])}>{addLabel}</button>
    </div>
  );
}

const ITALICS = 'Wrap words in *asterisks* for italics. Leave a blank line between paragraphs.';
const EVIDENCE = ['🕯️ Traditional', '🌱 Preliminary', '🌿 Emerging', '🌳 Well studied'];

/** Shrink to at most 1000px and re-encode as JPEG, so uploads stay small. Returns base64 (no prefix). */
async function toJpeg(file: File): Promise<{ base64: string; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: preview.split(',')[1], preview };
}

/* ---------- herb form ---------- */

export function HerbForm({ value: h, onChange, image, onImage, self }: {
  value: Herb; onChange: (h: Herb) => void; image: string | null; onImage: (b64: string | null) => void; self: string | null;
}) {
  const set = <K extends keyof Herb>(k: K, v: Herb[K]) => onChange({ ...h, [k]: v });
  const grow = (k: keyof Herb['growing'], v: string) => set('growing', { ...h.growing, [k]: v });
  const credit = (k: keyof Herb['imageCredit'], v: string) => set('imageCredit', { ...h.imageCredit, [k]: v });
  const [aliases, setAliases] = useState(h.aliases.join(', '));
  const [preview, setPreview] = useState<string | null>(null);
  const others = useMemo(() => herbIndex().filter((x) => x.slug !== self), [self]);

  return (
    <>
      <Section title="The jar">
        <Field label="Name"><Text value={h.name} onChange={(v) => set('name', v)} required autoFocus /></Field>
        <Field label="Latin name"><Text value={h.latin} onChange={(v) => set('latin', v)} /></Field>
        <Field label="Other names" hint="Separate with commas">
          <Text value={aliases} onChange={(v) => { setAliases(v); set('aliases', v.split(',').map((x) => x.trim()).filter(Boolean)); }} />
        </Field>
        <Field label="Jar color">
          <span className="color"><input type="color" value={h.jarColor} onChange={(e) => set('jarColor', e.target.value)} /><code>{h.jarColor}</code></span>
        </Field>
        <Field label="Category">
          <select value={h.category} onChange={(e) => set('category', e.target.value)}>
            {['herb', 'spice', 'tea', 'root', 'flower', 'fungus', 'seed', 'supplement'].map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="In my apothecary">
          <select value={h.status} onChange={(e) => set('status', e.target.value)}>
            <option value="growing">Growing</option><option value="collected">Collected</option><option value="wishlist">Wishlist</option>
          </select>
        </Field>
        <Field label="Evidence">
          <select value={h.evidence} onChange={(e) => set('evidence', Number(e.target.value))}>
            {EVIDENCE.map((label, i) => <option key={i} value={i}>{label}</option>)}
          </select>
        </Field>
        <div className="checks">
          <label><input type="checkbox" checked={h.psychoactive} onChange={(e) => set('psychoactive', e.target.checked)} /> Psychoactive</label>
          <label><input type="checkbox" checked={h.draft} onChange={(e) => set('draft', e.target.checked)} /> Draft</label>
        </div>
        <Field label="Origin" wide><Text value={h.origin} onChange={(v) => set('origin', v)} /></Field>
        <Field label="Used for" wide><Text value={h.intendedUse} onChange={(v) => set('intendedUse', v)} /></Field>
        <Field label="Blurb" wide hint={ITALICS}><Area value={h.blurb} onChange={(v) => set('blurb', v)} rows={3} /></Field>
      </Section>

      <Section title="Illustration" open={!self}>
        <div className="wide image-row">
          {preview ? <img src={preview} alt="" className="preview" /> : <span className="muted">{h.image ? 'Has an illustration.' : 'No illustration yet.'}</span>}
          <label className="tool-btn file">
            {h.image || preview ? 'Replace…' : 'Upload…'}
            <input type="file" accept="image/*" hidden onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const { base64, preview } = await toJpeg(f);
              setPreview(preview);
              onImage(base64);
            }} />
          </label>
          {(h.image || preview) && (
            <button type="button" className="tool-btn" onClick={() => { setPreview(null); onImage(null); set('image', null); }}>Remove</button>
          )}
        </div>
        <Field label="Alt text" wide><Text value={h.imageAlt} onChange={(v) => set('imageAlt', v)} /></Field>
        <Field label="Artist"><Text value={h.imageCredit.artist} onChange={(v) => credit('artist', v)} /></Field>
        <Field label="Source work"><Text value={h.imageCredit.work} onChange={(v) => credit('work', v)} /></Field>
        <Field label="Source link"><Text value={h.imageCredit.url} onChange={(v) => credit('url', v)} type="url" /></Field>
        <Field label="License"><Text value={h.imageCredit.license} onChange={(v) => credit('license', v)} /></Field>
      </Section>

      <Section title="Growing" open={!self}>
        <Field label="Zones"><Text value={h.growing.zones} onChange={(v) => grow('zones', v)} /></Field>
        <Field label="Sun"><Text value={h.growing.sun} onChange={(v) => grow('sun', v)} /></Field>
        <Field label="Water"><Text value={h.growing.water} onChange={(v) => grow('water', v)} /></Field>
        <Field label="Soil"><Text value={h.growing.soil} onChange={(v) => grow('soil', v)} /></Field>
        <Field label="Propagation" wide><Area value={h.growing.propagation} onChange={(v) => grow('propagation', v)} rows={3} /></Field>
        <Field label="Harvest" wide><Area value={h.growing.harvest} onChange={(v) => grow('harvest', v)} rows={3} /></Field>
      </Section>

      <Section title="Story" open={!self}>
        <Field label="History" wide hint={ITALICS}><Area value={h.history} onChange={(v) => set('history', v)} rows={5} /></Field>
        <Field label="Cultural significance" wide><Area value={h.culture} onChange={(v) => set('culture', v)} rows={5} /></Field>
      </Section>

      <Section title="Preparations" open={!self}>
        <List items={h.preparations} onChange={(v) => set('preparations', v)} blank={{ method: '', notes: '' }} addLabel="+ Add a preparation"
          render={(p, setP) => (<>
            <Text value={p.method} onChange={(v) => setP({ ...p, method: v })} placeholder="Infusion" />
            <Area value={p.notes} onChange={(v) => setP({ ...p, notes: v })} rows={2} />
          </>)} />
      </Section>

      <Section title="Risks and research" open={!self}>
        <Field label="Potential risks" wide><Area value={h.risks} onChange={(v) => set('risks', v)} rows={4} /></Field>
        <Field label="Legal status" wide><Text value={h.legal} onChange={(v) => set('legal', v)} /></Field>
        <Field label="What the research says" wide><Area value={h.evidenceSummary} onChange={(v) => set('evidenceSummary', v)} rows={4} /></Field>
        <List items={h.sources} onChange={(v) => set('sources', v)} blank={{ title: '', url: '' }} addLabel="+ Add a source"
          render={(src, setS) => (<>
            <Text value={src.title} onChange={(v) => setS({ ...src, title: v })} placeholder="Title" />
            <Text value={src.url} onChange={(v) => setS({ ...src, url: v })} placeholder="https://" type="url" />
          </>)} />
      </Section>

      <Section title={`Pairs well with${h.pairsWith.length ? ` (${h.pairsWith.length})` : ''}`} open={false}>
        <div className="pairs wide">
          {others.map((o) => (
            <label key={o.slug}>
              <input type="checkbox" checked={h.pairsWith.includes(o.slug)}
                onChange={(e) => set('pairsWith', e.target.checked ? [...h.pairsWith, o.slug] : h.pairsWith.filter((x) => x !== o.slug))} />
              {o.name}
            </label>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ---------- potion form ---------- */

export function PotionForm({ value: p, onChange }: { value: Potion; onChange: (p: Potion) => void }) {
  const set = <K extends keyof Potion>(k: K, v: Potion[K]) => onChange({ ...p, [k]: v });
  const herbs = useMemo(herbIndex, []);
  return (
    <div className="grid">
      <Field label="Name"><Text value={p.name} onChange={(v) => set('name', v)} required autoFocus /></Field>
      <Field label="Type">
        <select value={p.type} onChange={(e) => set('type', e.target.value)}>
          {['beverage', 'stew', 'syrup', 'tincture', 'other'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Made on"><input type="date" value={p.made} onChange={(e) => set('made', e.target.value)} /></Field>
      <Field label="Rating">
        <span className="stars" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={p.rating === n} aria-label={`${n} stars`}
              onClick={() => set('rating', p.rating === n ? null : n)}>{p.rating && n <= p.rating ? '★' : '☆'}</button>
          ))}
        </span>
      </Field>
      <div className="wide">
        <span className="label">Ingredients</span>
        <List items={p.ingredients} onChange={(v) => set('ingredients', v)} blank={{ herb: '', other: '', amount: '' }} addLabel="+ Add an ingredient"
          render={(i, setI) => (<>
            <Text value={i.amount} onChange={(v) => setI({ ...i, amount: v })} placeholder="1 tsp" className="amount" />
            <select value={i.herb} onChange={(e) => setI({ ...i, herb: e.target.value, other: e.target.value ? '' : i.other })}>
              <option value="">Something else…</option>
              {herbs.map((h) => <option key={h.slug} value={h.slug}>{h.name}</option>)}
            </select>
            {!i.herb && <Text value={i.other} onChange={(v) => setI({ ...i, other: v })} placeholder="Honey" />}
          </>)} />
      </div>
      <Field label="Method" wide><Area value={p.method} onChange={(v) => set('method', v)} rows={5} /></Field>
      <Field label="Notes" wide><Area value={p.notes} onChange={(v) => set('notes', v)} rows={3} /></Field>
    </div>
  );
}
