import YAML from 'yaml';
import { herbInput, potionInput, slugify } from './schema';

export type Collection = 'herbs' | 'potions';
export const isCollection = (c: unknown): c is Collection => c === 'herbs' || c === 'potions';
export const fileFor = (c: Collection, slug: string) => `src/content/${c}/${slug}.yaml`;
export const validSlug = (s: unknown): s is string => typeof s === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

/** Validate editor input and turn it into YAML in the same field order as the existing files. */
export function toYaml(c: Collection, data: unknown): { yaml: string; name: string } {
  if (c === 'herbs') {
    const h = herbInput.parse(data);
    const out = {
      name: h.name, latin: h.latin, aliases: h.aliases, category: h.category, status: h.status,
      jarColor: h.jarColor, origin: h.origin, intendedUse: h.intendedUse, blurb: h.blurb,
      evidence: String(h.evidence), evidenceSummary: h.evidenceSummary, sources: h.sources,
      psychoactive: h.psychoactive, legal: h.legal, growing: h.growing, history: h.history,
      culture: h.culture, preparations: h.preparations, risks: h.risks, pairsWith: h.pairsWith,
      ...(h.image ? { image: h.image, imageAlt: h.imageAlt, imageCredit: h.imageCredit ?? {} } : {}),
      draft: h.draft,
    };
    return { yaml: YAML.stringify(out, { lineWidth: 80 }), name: h.name };
  }
  const p = potionInput.parse(data);
  const out = {
    name: p.name, type: p.type,
    ingredients: p.ingredients.map((i) => ({ herb: i.herb || null, other: i.other, amount: i.amount })),
    method: p.method, notes: p.notes,
    ...(p.made ? { made: p.made.slice(0, 10) } : {}),
    ...(p.rating ? { rating: p.rating } : {}),
  };
  return { yaml: YAML.stringify(out, { lineWidth: 80 }), name: p.name };
}

export const parseYaml = (text: string) => YAML.parse(text);
export { slugify };
