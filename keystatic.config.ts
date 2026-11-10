import { config, collection, fields } from '@keystatic/core';

// Local files while developing; commits to GitHub on the deployed site.
// The GitHub mode needs a one-time GitHub App setup (see README).
const storage = import.meta.env.PROD
  ? ({ kind: 'github', repo: 'beck-2/apothecary' } as const)
  : ({ kind: 'local' } as const);

const longText = (label: string, description?: string) =>
  fields.text({ label, description, multiline: true });

export default config({
  storage,
  ui: { brand: { name: 'Apothecary' } },
  collections: {
    herbs: collection({
      label: 'Herbs',
      slugField: 'name',
      path: 'src/content/herbs/*',
      format: 'yaml',
      columns: ['name', 'evidence'],
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        latin: fields.text({ label: 'Latin name' }),
        aliases: fields.array(fields.text({ label: 'Alias' }), {
          label: 'Other names',
          itemLabel: (p) => p.value,
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Herb', value: 'herb' },
            { label: 'Spice', value: 'spice' },
            { label: 'Tea', value: 'tea' },
            { label: 'Root', value: 'root' },
            { label: 'Flower', value: 'flower' },
            { label: 'Fungus', value: 'fungus' },
            { label: 'Seed / berry', value: 'seed' },
            { label: 'Supplement', value: 'supplement' },
          ],
          defaultValue: 'herb',
        }),
        status: fields.select({
          label: 'In my apothecary',
          options: [
            { label: 'Growing', value: 'growing' },
            { label: 'Collected', value: 'collected' },
            { label: 'Wishlist', value: 'wishlist' },
          ],
          defaultValue: 'collected',
        }),
        jarColor: fields.text({ label: 'Jar color', description: 'Hex color for the jar, e.g. #e8d9a8', defaultValue: '#d9c7a0' }),
        origin: fields.text({ label: 'Origin' }),
        intendedUse: fields.text({ label: 'Intended use' }),
        blurb: longText('Blurb', 'Two or three sentences shown when the jar is clicked'),
        evidence: fields.select({
          label: 'Evidence level',
          options: [
            { label: '0 · Traditional / cultural', value: '0' },
            { label: '1 · Preliminary', value: '1' },
            { label: '2 · Emerging', value: '2' },
            { label: '3 · Well studied', value: '3' },
          ],
          defaultValue: '1',
        }),
        evidenceSummary: longText('Evidence summary'),
        sources: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            url: fields.url({ label: 'URL' }),
          }),
          { label: 'Sources', itemLabel: (p) => p.fields.title.value }
        ),
        psychoactive: fields.checkbox({ label: 'Psychoactive' }),
        legal: fields.text({ label: 'Legal status notes' }),
        growing: fields.object(
          {
            zones: fields.text({ label: 'USDA zones' }),
            sun: fields.text({ label: 'Sun' }),
            water: fields.text({ label: 'Water' }),
            soil: fields.text({ label: 'Soil' }),
            propagation: longText('Propagation'),
            harvest: longText('Harvest'),
          },
          { label: 'Growing' }
        ),
        history: longText('History'),
        culture: longText('Cultural significance'),
        preparations: fields.array(
          fields.object({
            method: fields.text({ label: 'Method' }),
            notes: longText('Notes'),
          }),
          { label: 'Common preparations', itemLabel: (p) => p.fields.method.value }
        ),
        risks: longText('Potential risks'),
        pairsWith: fields.array(fields.relationship({ label: 'Herb', collection: 'herbs' }), {
          label: 'Pairs well with',
          itemLabel: (p) => p.value ?? '',
        }),
        image: fields.image({
          label: 'Illustration',
          directory: 'src/assets/herbs',
          publicPath: '../../assets/herbs/',
        }),
        imageAlt: fields.text({ label: 'Image alt text' }),
        imageCredit: fields.object(
          {
            artist: fields.text({ label: 'Artist' }),
            work: fields.text({ label: 'Source work' }),
            url: fields.url({ label: 'Source URL' }),
            license: fields.text({ label: 'License', defaultValue: 'Public domain' }),
          },
          { label: 'Image credit' }
        ),
        draft: fields.checkbox({
          label: 'Draft (Claude-written, not yet rewritten by me)',
          defaultValue: true,
        }),
      },
    }),
    potions: collection({
      label: 'Potions',
      slugField: 'name',
      path: 'src/content/potions/*',
      format: 'yaml',
      columns: ['name', 'type'],
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        type: fields.select({
          label: 'Type',
          options: [
            { label: 'Beverage', value: 'beverage' },
            { label: 'Stew', value: 'stew' },
            { label: 'Syrup', value: 'syrup' },
            { label: 'Tincture', value: 'tincture' },
            { label: 'Other', value: 'other' },
          ],
          defaultValue: 'beverage',
        }),
        ingredients: fields.array(
          fields.object({
            herb: fields.relationship({ label: 'From the cabinet', collection: 'herbs' }),
            other: fields.text({ label: 'Or another ingredient' }),
            amount: fields.text({ label: 'Amount' }),
          }),
          {
            label: 'Ingredients',
            itemLabel: (p) =>
              `${p.fields.amount.value} ${p.fields.herb.value ?? p.fields.other.value}`.trim(),
          }
        ),
        method: longText('Method'),
        notes: longText('Notes'),
        made: fields.date({ label: 'Date made' }),
        rating: fields.integer({ label: 'Rating (1–5)', validation: { min: 1, max: 5 } }),
      },
    }),
  },
});
