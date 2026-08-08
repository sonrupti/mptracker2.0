import {
  HeartPulse, GraduationCap, Briefcase, Construction, Wheat, Droplet,
  Leaf, Landmark, ShieldCheck, Zap, Tag, LucideIcon,
} from 'lucide-react';

export interface TopicDef {
  id: string;
  label: string;
  icon: LucideIcon;
  badgeClass: string; // active/filled pill classes
  dotClass: string;   // small color dot / accent classes
  keywords: string[];
}

/**
 * Canonical topic buckets. Raw category/ministry/keyword data from the
 * scrapers is free-text and inconsistent, so every question/debate/bill is
 * classified into one of these buckets by keyword match. Order matters —
 * first match wins, so more specific topics should sit above generic ones.
 */
export const TOPICS: TopicDef[] = [
  {
    id: 'health',
    label: 'Health',
    icon: HeartPulse,
    badgeClass: 'bg-rose-500 text-white border-rose-500',
    dotClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    keywords: ['health', 'hospital', 'medical', 'disease', 'aiims', 'vaccine', 'drug', 'esi', 'ayushman'],
  },
  {
    id: 'education',
    label: 'Education',
    icon: GraduationCap,
    badgeClass: 'bg-indigo-500 text-white border-indigo-500',
    dotClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    keywords: ['education', 'school', 'university', 'student', 'literacy', 'teacher', 'college'],
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    badgeClass: 'bg-violet-500 text-white border-violet-500',
    dotClass: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    keywords: ['employment', 'unemployment', 'job', 'labour', 'labor', 'wage', 'msme', 'skill development'],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: Construction,
    badgeClass: 'bg-orange-500 text-white border-orange-500',
    dotClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    keywords: ['road', 'highway', 'railway', 'bridge', 'airport', 'port', 'metro', 'transport', 'housing', 'urban', 'telecom', 'digital infrastructure'],
  },
  {
    id: 'agriculture',
    label: 'Agriculture',
    icon: Wheat,
    badgeClass: 'bg-amber-600 text-white border-amber-600',
    dotClass: 'text-amber-600 bg-amber-600/10 border-amber-600/20',
    keywords: ['agriculture', 'farmer', 'crop', 'fertilizer', 'irrigation', 'msp', 'kisan'],
  },
  {
    id: 'water',
    label: 'Water',
    icon: Droplet,
    badgeClass: 'bg-sky-500 text-white border-sky-500',
    dotClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    keywords: ['water', 'jal shakti', 'jjm', 'drinking water', 'sanitation', 'sewage'],
  },
  {
    id: 'environment',
    label: 'Environment',
    icon: Leaf,
    badgeClass: 'bg-emerald-600 text-white border-emerald-600',
    dotClass: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/20',
    keywords: ['environment', 'forest', 'climate', 'pollution', 'wildlife'],
  },
  {
    id: 'finance',
    label: 'Finance & Economy',
    icon: Landmark,
    badgeClass: 'bg-teal-600 text-white border-teal-600',
    dotClass: 'text-teal-600 bg-teal-600/10 border-teal-600/20',
    keywords: ['finance', 'bank', 'tax', 'gst', 'economy', 'subsidy', 'trade', 'commerce', 'industry', 'cooperative'],
  },
  {
    id: 'defence',
    label: 'Defence & Security',
    icon: ShieldCheck,
    badgeClass: 'bg-slate-600 text-white border-slate-600',
    dotClass: 'text-slate-600 bg-slate-600/10 border-slate-600/20',
    keywords: ['defence', 'defense', 'army', 'navy', 'air force', 'security', 'police', 'home affairs', 'border'],
  },
  {
    id: 'energy',
    label: 'Energy & Power',
    icon: Zap,
    badgeClass: 'bg-yellow-500 text-white border-yellow-500',
    dotClass: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
    keywords: ['power', 'electricity', 'energy', 'coal', 'petroleum', 'renewable'],
  },
];

export const OTHER_TOPIC: TopicDef = {
  id: 'other',
  label: 'Other',
  icon: Tag,
  badgeClass: 'bg-foreground text-background border-foreground',
  dotClass: 'text-muted-foreground bg-foreground/5 border-border/60',
  keywords: [],
};

export function getTopicDef(id: string): TopicDef {
  return TOPICS.find(t => t.id === id) || OTHER_TOPIC;
}

/**
 * Classify a piece of raw text (category + ministry + title + keywords)
 * into one of the canonical TOPICS above, falling back to "Other".
 */
export function classifyTopic(...fields: (string | string[] | undefined | null)[]): string {
  const text = fields
    .flatMap(f => (Array.isArray(f) ? f : [f]))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const topic of TOPICS) {
    if (topic.keywords.some(kw => text.includes(kw))) return topic.id;
  }
  return OTHER_TOPIC.id;
}

export type Scope = 'Constituency' | 'State' | 'National';

/**
 * Rough heuristic for scope: does the text explicitly mention the MP's own
 * constituency or state? Otherwise treat it as a national-level item.
 */
export function deriveScope(text: string, constituency?: string, state?: string): Scope {
  const t = (text || '').toLowerCase();
  if (constituency && t.includes(constituency.toLowerCase())) return 'Constituency';
  if (state && t.includes(state.toLowerCase())) return 'State';
  return 'National';
}
