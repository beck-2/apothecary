export const EVIDENCE = [
  { level: 0, icon: '🕯️', label: 'Traditional', long: 'Traditional / cultural use. Little to no formal research.' },
  { level: 1, icon: '🌱', label: 'Preliminary', long: 'Preliminary. Lab, animal, or small pilot studies.' },
  { level: 2, icon: '🌿', label: 'Emerging', long: 'Emerging. Some human trials, but results are mixed or small.' },
  { level: 3, icon: '🌳', label: 'Well studied', long: 'Well studied. Multiple randomized trials and/or meta-analyses.' },
] as const;

export const evidenceFor = (level: number) => EVIDENCE[Math.max(0, Math.min(3, level))];

export const paragraphs = (text: string) =>
  text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
