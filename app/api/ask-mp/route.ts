import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db, MP } from "@/lib/supabase";

// ============================================================================
// GEMINI SETUP
// ============================================================================

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_STUDIO_API_KEY || ""
);

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

// ============================================================================
// TYPES
// ============================================================================

export type QueryType =
  | "SINGLE_MP"
  | "COMPARISON"
  | "RANKING"
  | "TOP_N"
  | "FILTERED_RANKING"
  | "ANALYTICAL_FILTER"
  | "STATE_RANKING"
  | "PARTY_RANKING"
  | "STATE_COMPARISON"
  | "PARTY_COMPARISON"
  | "WEBSITE_META"
  | "GENERAL";

export type MetricKey =
  | "overall_score"
  | "attendance_rate"
  | "questions_count"
  | "debates_count"
  | "bills_sponsored"
  | "bills_passed";

export type Operator = ">" | "<" | ">=" | "<=" | "=" | "between";

export interface ConditionSpec {
  metric: MetricKey;
  op: Operator;
  value: number | [number, number];
  label: string;
}

export interface HistoryTurn {
  question: string;
  answer: string;
  data?: Record<string, unknown> | null;
}

export interface AskMpRequestBody {
  question?: string;
  history?: HistoryTurn[];
}

// ============================================================================
// FIELD & DATA HELPERS
// ============================================================================

export function getState(mp: MP): string {
  return (mp.state || mp.region || "").trim();
}

export function getMpMetric(mp: MP, metric: MetricKey): number {
  switch (metric) {
    case "overall_score":
      return Number(mp.overall_score ?? 0);
    case "attendance_rate":
      return Number(mp.attendance_rate ?? 0);
    case "questions_count":
      return Number(mp.questions_count ?? 0);
    case "debates_count":
      return Number(mp.debates_count ?? 0);
    case "bills_sponsored":
      return Number(mp.bills_sponsored ?? 0);
    case "bills_passed":
      return Number(mp.bills_passed ?? 0);
    default:
      return 0;
  }
}

export function slimMp(m: MP) {
  return {
    id: m.id,
    name: m.name,
    constituency: m.constituency,
    state: getState(m),
    party: m.party,
    overall_score: getMpMetric(m, "overall_score"),
    attendance_rate: getMpMetric(m, "attendance_rate"),
    questions_count: getMpMetric(m, "questions_count"),
    debates_count: getMpMetric(m, "debates_count"),
    bills_sponsored: getMpMetric(m, "bills_sponsored"),
    bills_passed: getMpMetric(m, "bills_passed"),
  };
}

// ============================================================================
// NATIONAL BENCHMARKS & METRIC LABELS
// ============================================================================

const METRIC_LABELS: Record<MetricKey, string> = {
  overall_score: "overall performance score",
  attendance_rate: "attendance rate",
  questions_count: "questions asked",
  debates_count: "debate participation",
  bills_sponsored: "bills sponsored",
  bills_passed: "bills passed",
};

const METRIC_UNIT: Record<MetricKey, "percent" | "count"> = {
  overall_score: "count",
  attendance_rate: "percent",
  questions_count: "count",
  debates_count: "count",
  bills_sponsored: "count",
  bills_passed: "count",
};

const KNOWN_NATIONAL_AVERAGES: Partial<Record<MetricKey, number>> = {
  overall_score: 28.1,
  attendance_rate: 74.7,
};

const METRIC_KEYWORDS: Array<[RegExp, MetricKey]> = [
  [/\bbills?\s+passed\b/i, "bills_passed"],
  [/\bpassed\s+bills?\b/i, "bills_passed"],
  [/\bbills?\s+(sponsored|introduced)\b/i, "bills_sponsored"],
  [/\bsponsored\b/i, "bills_sponsored"],
  [/\bbills?\b/i, "bills_sponsored"],
  [/\blegislation\b/i, "bills_sponsored"],
  [/\bdebates?\b/i, "debates_count"],
  [/\bparticipat(ed|ion|e)\b/i, "debates_count"],
  [/\bspoke\b/i, "debates_count"],
  [/\bquestions?\b/i, "questions_count"],
  [/\basked\b/i, "questions_count"],
  [/\battendance\b/i, "attendance_rate"],
  [/\bpresen(t|ce)\b/i, "attendance_rate"],
  [/\bshowed up\b/i, "attendance_rate"],
  [/\bperformance\b/i, "overall_score"],
  [/\boverall\b/i, "overall_score"],
  [/\bscore\b/i, "overall_score"],
  [/\brating\b/i, "overall_score"],
  [/\bbest\b/i, "overall_score"],
  [/\bworst\b/i, "overall_score"],
];

function resolveMetric(question: string): MetricKey {
  const q = question.toLowerCase();
  for (const [pattern, metric] of METRIC_KEYWORDS) {
    if (pattern.test(q)) return metric;
  }
  return "overall_score";
}

// ============================================================================
// TEXT NORMALIZATION & FUZZY MATCHING
// ============================================================================

export function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) {
    return 0.9 * (Math.min(na.length, nb.length) / Math.max(na.length, nb.length));
  }
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - dist / maxLen;
}

function fuzzyBest<T>(
  query: string,
  candidates: T[],
  getText: (item: T) => string,
  threshold = 0.72
): { item: T; score: number } | null {
  let best: { item: T; score: number } | null = null;
  let secondBestScore = 0;

  for (const item of candidates) {
    const score = similarity(query, getText(item));
    if (!best || score > best.score) {
      secondBestScore = best ? best.score : 0;
      best = { item, score };
    } else if (score > secondBestScore) {
      secondBestScore = score;
    }
  }

  if (!best || best.score < threshold) return null;
  if (best.score - secondBestScore < 0.04 && secondBestScore >= threshold) return null;

  return best;
}

// ============================================================================
// ENTITY RESOLUTION: STATE / PARTY / MP
// ============================================================================

const STATE_ALIASES: Record<string, string[]> = {
  Odisha: ["odisha", "orissa"],
  Puducherry: ["puducherry", "pondicherry"],
  "Jammu and Kashmir": ["jammu and kashmir", "jammu kashmir", "j&k", "jk"],
  "Tamil Nadu": ["tamil nadu", "tamilnadu", "tn"],
  "Uttar Pradesh": ["uttar pradesh", "up"],
  "West Bengal": ["west bengal", "bengal", "wb"],
  "Andhra Pradesh": ["andhra pradesh", "andhra", "ap"],
  "Madhya Pradesh": ["madhya pradesh", "mp state"],
  Maharashtra: ["maharashtra", "maharastra", "maharashra", "mh"],
  Jharkhand: ["jharkhand"],
  Bihar: ["bihar"],
  Gujarat: ["gujarat"],
  Karnataka: ["karnataka"],
  Kerala: ["kerala"],
  Punjab: ["punjab"],
  Rajasthan: ["rajasthan"],
  Telangana: ["telangana"],
  Delhi: ["delhi", "nct of delhi"],
};

function resolveState(question: string, mps: MP[]): { state: string; mps: MP[] } | null {
  const states = Array.from(new Set(mps.map(getState).filter(Boolean)));
  const q = normalize(question);

  for (const [canonical, aliases] of Object.entries(STATE_ALIASES)) {
    if (aliases.some((a) => new RegExp(`\\b${normalize(a)}\\b`, "i").test(q))) {
      const matchedState = states.find((s) => s.toLowerCase() === canonical.toLowerCase()) || canonical;
      const stateMps = mps.filter((m) => getState(m).toLowerCase() === matchedState.toLowerCase());
      if (stateMps.length) return { state: matchedState, mps: stateMps };
    }
  }

  for (const s of states) {
    const normS = normalize(s);
    if (normS && normS.length >= 3 && new RegExp(`\\b${normS}\\b`, "i").test(q)) {
      const stateMps = mps.filter((m) => getState(m).toLowerCase() === s.toLowerCase());
      if (stateMps.length) return { state: s, mps: stateMps };
    }
  }

  const tokens = q.split(" ");
  for (let len = Math.min(4, tokens.length); len >= 1; len--) {
    for (let i = 0; i + len <= tokens.length; i++) {
      const phrase = tokens.slice(i, i + len).join(" ");
      if (phrase.length < 4) continue;
      const match = fuzzyBest(phrase, states, (s) => s, 0.82);
      if (match) {
        const stateMps = mps.filter((m) => getState(m).toLowerCase() === match.item.toLowerCase());
        return { state: match.item, mps: stateMps };
      }
    }
  }

  return null;
}

const PARTY_ALIASES: Record<string, string> = {
  bjp: "Bharatiya Janata Party",
  congress: "Indian National Congress",
  inc: "Indian National Congress",
  aap: "Aam Aadmi Party",
  tmc: "All India Trinamool Congress",
  trinamool: "All India Trinamool Congress",
  dmk: "Dravida Munnetra Kazhagam",
  sp: "Samajwadi Party",
  rjd: "Rashtriya Janata Dal",
  jdu: "Janata Dal (United)",
  tdp: "Telugu Desam Party",
  ysrcp: "Yuvajana Sramika Rythu Congress Party",
  shivsena: "Shiv Sena",
  "shiv sena": "Shiv Sena",
  "shiv sena ubt": "Shiv Sena (Uddhav Balasaheb Thackeray)",
  ncp: "Nationalist Congress Party Sharadchandra Pawar",
  cpim: "Communist Party of India (Marxist)",
  cpi: "Communist Party of India",
  jmm: "Jharkhand Mukti Morcha",
  aimim: "All India Majlis-E-Ittehadul Muslimeen",
  sad: "Shiromani Akali Dal",
};

function resolveParty(question: string, mps: MP[]): { party: string; mps: MP[] } | null {
  const parties = Array.from(new Set(mps.map((m) => m.party).filter(Boolean)));
  const q = normalize(question);

  for (const [alias, canonical] of Object.entries(PARTY_ALIASES)) {
    const aliasNorm = normalize(alias);
    if (new RegExp(`\\b${aliasNorm}\\b`, "i").test(q)) {
      const matchedParty = parties.find((p) => p.toLowerCase() === canonical.toLowerCase()) || canonical;
      const partyMps = mps.filter((m) => (m.party || "").toLowerCase() === matchedParty.toLowerCase());
      if (partyMps.length) return { party: matchedParty, mps: partyMps };
    }
  }

  for (const p of parties) {
    const normP = normalize(p);
    if (normP && normP.length >= 3 && new RegExp(`\\b${normP}\\b`, "i").test(q)) {
      const partyMps = mps.filter((m) => (m.party || "").toLowerCase() === p.toLowerCase());
      if (partyMps.length) return { party: p, mps: partyMps };
    }
  }

  return null;
}

export interface MpMatch {
  mp: MP;
  confidence: number;
  matchedOn: "constituency" | "name";
}

function resolveMP(question: string, mps: MP[], excludeIds: Set<string> = new Set()): MpMatch | null {
  const pool = mps.filter((m) => !excludeIds.has(m.id));
  const q = normalize(question);

  const stripped = q
    .replace(/\b(how|did|the|is|mp|from|in|of|for|performance|performing|doing|represent|represented|you|tell|me|about|who|which|show|give|details|score|attendance)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const candidateText = stripped.length >= 2 ? stripped : q;

  // 1. Constituency exact/word match ("Godda", "Baramati", "Lucknow")
  for (const m of pool) {
    const normConst = normalize(m.constituency);
    if (normConst && normConst.length >= 3) {
      const regex = new RegExp(`\\b${normConst}\\b`, "i");
      if (regex.test(q) || regex.test(candidateText)) {
        return { mp: m, confidence: 0.98, matchedOn: "constituency" };
      }
    }
  }

  // 2. Full name exact match
  for (const m of pool) {
    const normName = normalize(m.name);
    if (normName && normName.length >= 3 && (candidateText.includes(normName) || q.includes(normName))) {
      return { mp: m, confidence: 0.98, matchedOn: "name" };
    }
  }

  // 3. Multi-token name match (e.g., "Supriya Sule", "Nishikant Dubey")
  for (const m of pool) {
    const parts = m.name.split(/\s+/).map(normalize).filter((p) => p.length >= 3);
    if (parts.length >= 2) {
      const allPresent = parts.every((part) => candidateText.includes(part) || q.includes(part));
      if (allPresent) {
        return { mp: m, confidence: 0.92, matchedOn: "name" };
      }
    }
  }

  // 4. Distinct single name token match if unambiguous
  const singleNameMatches: { mp: MP; confidence: number; matchedOn: "name" }[] = [];
  for (const m of pool) {
    const nameParts = m.name.split(/\s+/).map(normalize).filter((p) => p.length >= 4);
    for (const part of nameParts) {
      if (new RegExp(`\\b${part}\\b`, "i").test(candidateText)) {
        singleNameMatches.push({ mp: m, confidence: 0.85, matchedOn: "name" });
        break;
      }
    }
  }
  if (singleNameMatches.length === 1) {
    return singleNameMatches[0];
  }

  // 5. Fuzzy match for misspellings (e.g., "Supriya Sulle", "Godha")
  const constituencyFuzzy = fuzzyBest(candidateText, pool, (m) => m.constituency, 0.75);
  if (constituencyFuzzy) {
    return { mp: constituencyFuzzy.item, confidence: constituencyFuzzy.score, matchedOn: "constituency" };
  }

  const nameFuzzy = fuzzyBest(candidateText, pool, (m) => m.name, 0.75);
  if (nameFuzzy) {
    return { mp: nameFuzzy.item, confidence: nameFuzzy.score, matchedOn: "name" };
  }

  return null;
}

function resolveTwoMPs(question: string, mps: MP[]): [MpMatch, MpMatch] | null {
  const parts = question.split(/\bvs\.?\b|\bversus\b|\band\b|\bor\b|,/i).map((s) => s.trim()).filter(Boolean);

  if (parts.length >= 2) {
    const matches: MpMatch[] = [];
    const usedIds = new Set<string>();

    for (const part of parts) {
      const match = resolveMP(part, mps, usedIds);
      if (match && match.confidence >= 0.72) {
        matches.push(match);
        usedIds.add(match.mp.id);
      }
      if (matches.length === 2) break;
    }

    if (matches.length === 2) return [matches[0], matches[1]];
  }

  const match1 = resolveMP(question, mps);
  if (match1) {
    const match2 = resolveMP(question, mps, new Set([match1.mp.id]));
    if (match2 && match2.confidence >= 0.72) {
      return [match1, match2];
    }
  }

  return null;
}

// ============================================================================
// STAGE 1 CALCULATIONS & CONDITION PARSER
// ============================================================================

const CORE_METRICS: MetricKey[] = [
  "overall_score",
  "attendance_rate",
  "questions_count",
  "debates_count",
  "bills_sponsored",
  "bills_passed",
];

function datasetAverage(mps: MP[], metric: MetricKey): number {
  if (!mps.length) return 0;
  const sum = mps.reduce((acc, m) => acc + getMpMetric(m, metric), 0);
  return Number((sum / mps.length).toFixed(1));
}

function getBenchmarkForMetric(mps: MP[], metric: MetricKey): number {
  return KNOWN_NATIONAL_AVERAGES[metric] ?? datasetAverage(mps, metric);
}

function parseCondition(question: string, metric: MetricKey, mps: MP[]): ConditionSpec | null {
  const q = question.toLowerCase();

  // 1. National average condition
  if (/above (the )?national average|more than (the )?national average|higher than (the )?national average/i.test(q)) {
    const avg = getBenchmarkForMetric(mps, metric);
    return { metric, op: ">", value: avg, label: `above national average (${avg})` };
  }
  if (/below (the )?national average|less than (the )?national average|lower than (the )?national average/i.test(q)) {
    const avg = getBenchmarkForMetric(mps, metric);
    return { metric, op: "<", value: avg, label: `below national average (${avg})` };
  }

  // 2. "between X and Y" / "between X% and Y%"
  const betweenMatch = q.match(/between\s+(\d+(?:\.\d+)?)\s*%?\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (betweenMatch) {
    const v1 = parseFloat(betweenMatch[1]);
    const v2 = parseFloat(betweenMatch[2]);
    const min = Math.min(v1, v2);
    const max = Math.max(v1, v2);
    return { metric, op: "between", value: [min, max], label: `between ${min} and ${max}` };
  }

  // 3. "at least X" / "minimum X"
  const atLeastMatch = q.match(/(?:at least|minimum|no less than)\s+(\d+(?:\.\d+)?)\s*%?/i);
  if (atLeastMatch) {
    const val = parseFloat(atLeastMatch[1]);
    return { metric, op: ">=", value: val, label: `at least ${val}` };
  }

  // 4. "at most X" / "maximum X"
  const atMostMatch = q.match(/(?:at most|maximum|no more than)\s+(\d+(?:\.\d+)?)\s*%?/i);
  if (atMostMatch) {
    const val = parseFloat(atMostMatch[1]);
    return { metric, op: "<=", value: val, label: `at most ${val}` };
  }

  // 5. "exactly X" / "equal to X" / "100% attendance" / "100%"
  const exactMatch = q.match(/(?:exactly|equal to)\s+(\d+(?:\.\d+)?)\s*%?/i);
  if (exactMatch) {
    const val = parseFloat(exactMatch[1]);
    return { metric, op: "=", value: val, label: `exactly ${val}` };
  }
  if (/\b100%|hundred percent\b/i.test(q) && metric === "attendance_rate") {
    return { metric, op: "=", value: 100, label: "exactly 100%" };
  }

  // 6. "above X" / "over X" / "more than X" / "greater than X" / "higher than X"
  const aboveMatch = q.match(/(?:above|over|more than|greater than|higher than)\s+(\d+(?:\.\d+)?)\s*%?/i);
  if (aboveMatch) {
    const val = parseFloat(aboveMatch[1]);
    return { metric, op: ">", value: val, label: `above ${val}` };
  }

  // 7. "below X" / "under X" / "less than X" / "fewer than X" / "lower than X"
  const belowMatch = q.match(/(?:below|under|less than|fewer than|lower than)\s+(\d+(?:\.\d+)?)\s*%?/i);
  if (belowMatch) {
    const val = parseFloat(belowMatch[1]);
    return { metric, op: "<", value: val, label: `below ${val}` };
  }

  // 8. Implicit conditions: "sponsored bills" -> >= 1, "passed bills" -> >= 1
  if (/\b(sponsored|introduced)\s+bills?\b|\bsponsored\b/i.test(q) && metric === "bills_sponsored") {
    return { metric, op: ">=", value: 1, label: "at least 1 bill sponsored" };
  }
  if (/\bpassed\s+bills?\b/i.test(q) && metric === "bills_passed") {
    return { metric, op: ">=", value: 1, label: "at least 1 bill passed" };
  }

  return null;
}

function evalCondition(val: number, op: Operator, target: number | [number, number]): boolean {
  if (op === "between" && Array.isArray(target)) {
    return val >= target[0] && val <= target[1];
  }
  if (typeof target === "number") {
    switch (op) {
      case ">": return val > target;
      case "<": return val < target;
      case ">=": return val >= target;
      case "<=": return val <= target;
      case "=": return val === target;
    }
  }
  return false;
}

function extractTopN(question: string, defaultN = 5): number {
  const match = question.match(/\b(top|bottom|first|best)\s+(\d+)\b|\b(\d+)\s+(top|best|mps)\b/i);
  if (match) {
    const num = parseInt(match[2] || match[3], 10);
    if (!isNaN(num) && num > 0 && num <= 50) return num;
  }
  return defaultN;
}

function detectRankOrder(question: string): "asc" | "desc" {
  return /\blowest\b|\bleast\b|\bworst\b|\bbottom\b/i.test(question) ? "asc" : "desc";
}

interface DetectedQuery {
  queryType: QueryType;
  metric: MetricKey;
  rankOrder: "asc" | "desc";
  topN: number;
  condition?: ConditionSpec;
  isCountQuestion: boolean;
  isPercentageQuestion: boolean;
  mp?: MpMatch;
  mpB?: MpMatch;
  state?: { state: string; mps: MP[] };
  party?: { party: string; mps: MP[] };
  stateB?: { state: string; mps: MP[] };
  partyB?: { party: string; mps: MP[] };
}

function analyzeQuery(question: string, mps: MP[], history?: HistoryTurn[]): DetectedQuery {
  const q = question.toLowerCase();
  const metric = resolveMetric(question);
  const rankOrder = detectRankOrder(question);
  const topN = extractTopN(question);
  const condition = parseCondition(question, metric, mps);

  const isCountQuestion = /\b(how many|count|number of)\b/i.test(question);
  const isPercentageQuestion = /\b(what percentage|percentage of|percent of)\b/i.test(question);
  const isWebsiteMeta = /\b(website|login|signup|deploy|hosting|frontend|supabase|api key|source code|bug|css|react|nextjs)\b/i.test(question);

  if (isWebsiteMeta) {
    return { queryType: "WEBSITE_META", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion };
  }

  // 1. Pronoun / Follow-Up Resolution from History
  let mpMatch = resolveMP(question, mps);
  let twoMps = resolveTwoMPs(question, mps);

  if (!mpMatch && !twoMps && history && history.length) {
    const lastData = history[history.length - 1]?.data as Record<string, any> | undefined;
    if (lastData?.mp?.id) {
      const prevMp = mps.find((m) => m.id === lastData.mp.id);
      if (prevMp) {
        if (/\b(he|she|they|him|her|this mp|that mp|the mp)\b/i.test(q)) {
          mpMatch = { mp: prevMp, confidence: 0.9, matchedOn: "name" };
        }
      }
    }
  }

  // 2. COMPARISON
  const isComparison = /\bcompare\b|\bvs\.?\b|\bversus\b|who (performed|did) better|who is better|which (one|mp) is better/i.test(question);
  if (isComparison) {
    if (twoMps) {
      return { queryType: "COMPARISON", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion, mp: twoMps[0], mpB: twoMps[1] };
    }
    // Check State comparison (e.g. "Compare Odisha and Maharashtra")
    const chunks = question.split(/\bcompare\b|\bvs\.?\b|\bversus\b|\band\b/i);
    const foundStates: { state: string; mps: MP[] }[] = [];
    for (const chunk of chunks) {
      const s = resolveState(chunk, mps);
      if (s && !foundStates.some((f) => f.state === s.state)) foundStates.push(s);
      if (foundStates.length === 2) break;
    }
    if (foundStates.length === 2) {
      return { queryType: "STATE_COMPARISON", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion, state: foundStates[0], stateB: foundStates[1] };
    }
    // Check Party comparison (e.g. "Compare BJP and Congress")
    const foundParties: { party: string; mps: MP[] }[] = [];
    for (const chunk of chunks) {
      const p = resolveParty(chunk, mps);
      if (p && !foundParties.some((f) => f.party === p.party)) foundParties.push(p);
      if (foundParties.length === 2) break;
    }
    if (foundParties.length === 2) {
      return { queryType: "PARTY_COMPARISON", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion, party: foundParties[0], partyB: foundParties[1] };
    }
  }

  // Check State & Party
  const state = resolveState(question, mps);
  const party = resolveParty(question, mps);

  // 3. ANALYTICAL_FILTER (Count/Percentage or Condition questions)
  if (condition || isCountQuestion || isPercentageQuestion) {
    return {
      queryType: "ANALYTICAL_FILTER",
      metric,
      rankOrder,
      topN,
      condition: condition || undefined,
      isCountQuestion,
      isPercentageQuestion,
      state: state || undefined,
      party: party || undefined,
    };
  }

  // 4. PARTY / STATE LEADERBOARDS & STATS
  const isPartyWord = /\bpart(y|ies)\b/i.test(question);
  const isStateWord = /\bstate(s)?\b/i.test(question);

  if (isPartyWord && /\b(highest|most|best|average)\b/i.test(question)) {
    return { queryType: "PARTY_RANKING", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion };
  }
  if (isStateWord && /\b(highest|most|best|average)\b/i.test(question)) {
    return { queryType: "STATE_RANKING", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion };
  }

  const hasRankingWords = /\b(highest|lowest|most|least|best|worst|top|bottom)\b/i.test(question);
  const hasTopNWords = /\b(top|bottom|first|best)\s+\d+\b|\b\d+\s+(top|best|mps)\b/i.test(question);

  // 5. FILTERED_RANKING
  if ((state || party) && (hasRankingWords || hasTopNWords)) {
    return { queryType: "FILTERED_RANKING", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion, state: state || undefined, party: party || undefined };
  }

  // 6. TOP_N
  if (hasTopNWords) {
    return { queryType: "TOP_N", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion, state: state || undefined, party: party || undefined };
  }

  // 7. RANKING
  if (hasRankingWords) {
    return { queryType: "RANKING", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion };
  }

  // 8. SINGLE_MP
  if (mpMatch) {
    return { queryType: "SINGLE_MP", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion, mp: mpMatch };
  }

  // 9. State/Party scoped overview without ranking
  if (state || party) {
    return { queryType: "ANALYTICAL_FILTER", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion, state: state || undefined, party: party || undefined };
  }

  return { queryType: "GENERAL", metric, rankOrder, topN, isCountQuestion, isPercentageQuestion };
}

// ============================================================================
// CONTEXT BUILDERS FOR GEMINI
// ============================================================================

function buildSingleMpContext(match: MpMatch, allMps: MP[]) {
  const mp = match.mp;
  const mpState = getState(mp);
  const stateMps = mpState ? allMps.filter((m) => getState(m) === mpState) : [];
  const partyMps = mp.party ? allMps.filter((m) => m.party === mp.party) : [];

  const benchmarks = CORE_METRICS.map((metric) => ({
    metric,
    label: METRIC_LABELS[metric],
    unit: METRIC_UNIT[metric],
    mpValue: getMpMetric(mp, metric),
    nationalBenchmark: getBenchmarkForMetric(allMps, metric),
    stateAverage: stateMps.length ? datasetAverage(stateMps, metric) : null,
    partyAverage: partyMps.length ? datasetAverage(partyMps, metric) : null,
  }));

  return {
    mp: slimMp(mp),
    matchConfidence: Number(match.confidence.toFixed(2)),
    matchedOn: match.matchedOn,
    stateSampleSize: stateMps.length,
    partySampleSize: partyMps.length,
    benchmarks,
  };
}

function buildComparisonContext(matchA: MpMatch, matchB: MpMatch, allMps: MP[]) {
  const a = matchA.mp;
  const b = matchB.mp;

  const comparison = CORE_METRICS.map((metric) => {
    const va = getMpMetric(a, metric);
    const vb = getMpMetric(b, metric);
    return {
      metric,
      label: METRIC_LABELS[metric],
      unit: METRIC_UNIT[metric],
      mpAValue: va,
      mpBValue: vb,
      difference: Number((va - vb).toFixed(1)),
      leadingMp: va === vb ? "tie" : va > vb ? a.name : b.name,
      nationalBenchmark: getBenchmarkForMetric(allMps, metric),
    };
  });

  return {
    mpA: slimMp(a),
    mpB: slimMp(b),
    comparison,
  };
}

function buildAnalyticalFilterContext(detected: DetectedQuery, allMps: MP[]) {
  let pool = allMps;
  let filterScope = "All 544 Lok Sabha MPs";

  if (detected.state) {
    pool = detected.state.mps;
    filterScope = `State: ${detected.state.state} (${pool.length} MPs)`;
  } else if (detected.party) {
    pool = detected.party.mps;
    filterScope = `Party: ${detected.party.party} (${pool.length} MPs)`;
  }

  const metric = detected.metric;
  let matches = pool;
  let conditionLabel = "Dataset Overview";

  if (detected.condition) {
    const c = detected.condition;
    conditionLabel = c.label;
    matches = pool.filter((m) => evalCondition(getMpMetric(m, metric), c.op, c.value));
  }

  const matchingCount = matches.length;
  const totalCount = pool.length;
  const percentage = totalCount > 0 ? Number(((matchingCount / totalCount) * 100).toFixed(1)) : 0;
  const averageInMatches = matches.length ? datasetAverage(matches, metric) : 0;

  return {
    filterScope,
    metric,
    metricLabel: METRIC_LABELS[metric],
    conditionLabel,
    matchingCount,
    totalCount,
    percentage,
    averageInMatches,
    nationalBenchmark: getBenchmarkForMetric(allMps, metric),
    sampleMatchingMps: matches.slice(0, 15).map(slimMp),
    hasMoreMatches: matches.length > 15,
  };
}

function buildRankingContext(mps: MP[], metric: MetricKey, order: "asc" | "desc") {
  const values = mps.map((m) => getMpMetric(m, metric));
  const targetVal = order === "asc" ? Math.min(...values) : Math.max(...values);
  const tiedMps = mps.filter((m) => getMpMetric(m, metric) === targetVal);

  return {
    scope: "national",
    metric,
    metricLabel: METRIC_LABELS[metric],
    unit: METRIC_UNIT[metric],
    order,
    targetValue: targetVal,
    nationalBenchmark: getBenchmarkForMetric(mps, metric),
    totalMpsEvaluated: mps.length,
    tiedCount: tiedMps.length,
    isTie: tiedMps.length > 1,
    tiedMps: tiedMps.slice(0, 20).map(slimMp),
    hasMoreTies: tiedMps.length > 20,
  };
}

function buildTopNContext(mps: MP[], metric: MetricKey, order: "asc" | "desc", n: number) {
  const sorted = [...mps].sort((a, b) =>
    order === "asc" ? getMpMetric(a, metric) - getMpMetric(b, metric) : getMpMetric(b, metric) - getMpMetric(a, metric)
  );

  return {
    metric,
    metricLabel: METRIC_LABELS[metric],
    unit: METRIC_UNIT[metric],
    order,
    topN: n,
    totalMpsEvaluated: mps.length,
    nationalBenchmark: getBenchmarkForMetric(mps, metric),
    list: sorted.slice(0, n).map(slimMp),
  };
}

function buildFilteredRankingContext(detected: DetectedQuery, metric: MetricKey, order: "asc" | "desc", allMps: MP[]) {
  let pool = allMps;
  let filterLabel = "All MPs";

  if (detected.state) {
    pool = detected.state.mps;
    filterLabel = `State: ${detected.state.state}`;
  } else if (detected.party) {
    pool = detected.party.mps;
    filterLabel = `Party: ${detected.party.party}`;
  }

  const values = pool.map((m) => getMpMetric(m, metric));
  const targetVal = values.length ? (order === "asc" ? Math.min(...values) : Math.max(...values)) : 0;
  const tiedMps = pool.filter((m) => getMpMetric(m, metric) === targetVal);

  return {
    filterLabel,
    sampleSize: pool.length,
    metric,
    metricLabel: METRIC_LABELS[metric],
    unit: METRIC_UNIT[metric],
    order,
    targetValue: targetVal,
    nationalBenchmark: getBenchmarkForMetric(allMps, metric),
    tiedCount: tiedMps.length,
    isTie: tiedMps.length > 1,
    tiedMps: tiedMps.slice(0, 15).map(slimMp),
  };
}

function buildPartyRankingContext(mps: MP[], metric: MetricKey) {
  const byParty = new Map<string, MP[]>();
  for (const m of mps) {
    if (!m.party) continue;
    if (!byParty.has(m.party)) byParty.set(m.party, []);
    byParty.get(m.party)!.push(m);
  }

  const rankings = Array.from(byParty.entries())
    .map(([party, partyMps]) => ({
      name: party,
      mpCount: partyMps.length,
      average: datasetAverage(partyMps, metric),
    }))
    .sort((a, b) => b.average - a.average);

  return {
    metric,
    metricLabel: METRIC_LABELS[metric],
    unit: METRIC_UNIT[metric],
    nationalBenchmark: getBenchmarkForMetric(mps, metric),
    rankings: rankings.slice(0, 10),
  };
}

function buildStateRankingContext(mps: MP[], metric: MetricKey) {
  const byState = new Map<string, MP[]>();
  for (const m of mps) {
    const st = getState(m);
    if (!st) continue;
    if (!byState.has(st)) byState.set(st, []);
    byState.get(st)!.push(m);
  }

  const rankings = Array.from(byState.entries())
    .map(([state, stateMps]) => ({
      name: state,
      mpCount: stateMps.length,
      average: datasetAverage(stateMps, metric),
    }))
    .sort((a, b) => b.average - a.average);

  return {
    metric,
    metricLabel: METRIC_LABELS[metric],
    unit: METRIC_UNIT[metric],
    nationalBenchmark: getBenchmarkForMetric(mps, metric),
    rankings: rankings.slice(0, 10),
  };
}

function buildPartyComparisonContext(partyA: { party: string; mps: MP[] }, partyB: { party: string; mps: MP[] }, allMps: MP[]) {
  const comparison = CORE_METRICS.map((metric) => {
    const avgA = datasetAverage(partyA.mps, metric);
    const avgB = datasetAverage(partyB.mps, metric);
    return {
      metric,
      label: METRIC_LABELS[metric],
      partyAAverage: avgA,
      partyBAverage: avgB,
      difference: Number((avgA - avgB).toFixed(1)),
      nationalBenchmark: getBenchmarkForMetric(allMps, metric),
    };
  });

  return {
    partyA: { name: partyA.party, mpCount: partyA.mps.length },
    partyB: { name: partyB.party, mpCount: partyB.mps.length },
    comparison,
  };
}

function buildStateComparisonContext(stateA: { state: string; mps: MP[] }, stateB: { state: string; mps: MP[] }, allMps: MP[]) {
  const comparison = CORE_METRICS.map((metric) => {
    const avgA = datasetAverage(stateA.mps, metric);
    const avgB = datasetAverage(stateB.mps, metric);
    return {
      metric,
      label: METRIC_LABELS[metric],
      stateAAverage: avgA,
      stateBAverage: avgB,
      difference: Number((avgA - avgB).toFixed(1)),
      nationalBenchmark: getBenchmarkForMetric(allMps, metric),
    };
  });

  return {
    stateA: { name: stateA.state, mpCount: stateA.mps.length },
    stateB: { name: stateB.state, mpCount: stateB.mps.length },
    comparison,
  };
}

// ============================================================================
// DETERMINISTIC FALLBACK GENERATOR
// ============================================================================

function generateFallbackText(detected: DetectedQuery, context: any): string {
  switch (detected.queryType) {
    case "SINGLE_MP": {
      const mp = context.mp;
      return `${mp.name} represents ${mp.constituency}, ${mp.state} (${mp.party}). Overall Score: ${mp.overall_score} (National Avg: ${KNOWN_NATIONAL_AVERAGES.overall_score}), Attendance: ${mp.attendance_rate}% (National Avg: ${KNOWN_NATIONAL_AVERAGES.attendance_rate}%), Questions asked: ${mp.questions_count}, Debates: ${mp.debates_count}, Bills sponsored: ${mp.bills_sponsored}, Bills passed: ${mp.bills_passed}.`;
    }
    case "COMPARISON": {
      const mpA = context.mpA;
      const mpB = context.mpB;
      return `Comparison between ${mpA.name} (${mpA.constituency}) and ${mpB.name} (${mpB.constituency}):\n• Overall Score: ${mpA.name} (${mpA.overall_score}) vs ${mpB.name} (${mpB.overall_score})\n• Attendance: ${mpA.name} (${mpA.attendance_rate}%) vs ${mpB.name} (${mpB.attendance_rate}%)\n• Questions Asked: ${mpA.name} (${mpA.questions_count}) vs ${mpB.name} (${mpB.questions_count})\n• Debates Participated: ${mpA.name} (${mpA.debates_count}) vs ${mpB.name} (${mpB.debates_count})\n• Bills Sponsored: ${mpA.name} (${mpA.bills_sponsored}) vs ${mpB.name} (${mpB.bills_sponsored})`;
    }
    case "ANALYTICAL_FILTER": {
      const c = context;
      return `${c.matchingCount} of ${c.totalCount} MPs (${c.percentage}%) match the criteria (${c.conditionLabel} for ${c.metricLabel}).`;
    }
    case "RANKING": {
      const r = context;
      if (r.isTie) {
        return `There is no single MP with the ${r.order === "asc" ? "lowest" : "highest"} ${r.metricLabel}. ${r.tiedCount} MPs are tied for the top rank with a value of ${r.targetValue}.`;
      }
      const top = r.tiedMps[0];
      return `The MP with the ${r.order === "asc" ? "lowest" : "highest"} ${r.metricLabel} is ${top.name} (${top.constituency}, ${top.state}) with ${top.overall_score ?? top.attendance_rate}.`;
    }
    case "TOP_N": {
      const t = context;
      const names = t.list.map((m: any, i: number) => `${i + 1}. ${m.name} (${m.constituency}): ${m[t.metric] ?? m.overall_score}`).join("\n");
      return `Top ${t.list.length} MPs by ${t.metricLabel}:\n${names}`;
    }
    case "WEBSITE_META": {
      return "I can answer questions about the performance data of 544 Lok Sabha MPs. I do not have access to internal website settings or UI configurations.";
    }
    default:
      return "Calculations complete. Please see the structured context for verified figures.";
  }
}

// ============================================================================
// GEMINI PROMPT & CALL
// ============================================================================

const SYSTEM_RULES = `
You are the conversational assistant for an Indian Parliament MP performance tracker.

The supplied VERIFIED DATABASE CONTEXT is the ONLY source of truth.
Rules:
1. Never invent statistics, MPs, constituencies, parties, rankings, or benchmarks.
2. Never change numbers provided in the verified context.
3. Do not calculate rankings or counts independently — use the TypeScript pre-calculated figures.
4. When several MPs tie for first place, explicitly state that they are tied.
5. When comparing MPs, explain metric-by-metric differences without subjective value judgments.
6. If asked about UI/login/code/website features, explain that you cover MP parliamentary performance data.
7. Keep answers concise, natural, and informative. Use bullet points where appropriate.
8. Do not mention internal code, database queries, TypeScript, Supabase, or API prompts.
`.trim();

function buildPrompt(params: {
  question: string;
  queryType: QueryType;
  context: unknown;
  history?: HistoryTurn[];
}): string {
  const { question, queryType, context, history } = params;

  const historyBlock =
    history && history.length
      ? `\nRECENT CONVERSATION:\n${history
          .slice(-3)
          .map((h) => `Q: ${h.question}\nA: ${h.answer}`)
          .join("\n\n")}\n`
      : "";

  return `${SYSTEM_RULES}

${historyBlock}
QUERY TYPE: ${queryType}

VERIFIED DATABASE CONTEXT (the only facts you may use):
${JSON.stringify(context, null, 2)}

USER'S QUESTION:
"${question}"

Write the response now. Return only the natural-language answer text.`;
}

async function askGemini(params: {
  question: string;
  queryType: QueryType;
  context: unknown;
  history?: HistoryTurn[];
}): Promise<{ text: string }> {
  const prompt = buildPrompt(params);

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (text && text.trim()) return { text };
  } catch (error) {
    console.error(`ask-mp: Gemini call failed with model ${GEMINI_MODEL}:`, error);

    if (GEMINI_MODEL !== "gemini-1.5-flash") {
      try {
        console.log("ask-mp: Attempting fallback to gemini-1.5-flash...");
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const fallbackResult = await fallbackModel.generateContent(prompt);
        const text = fallbackResult.response.text();
        if (text && text.trim()) return { text };
      } catch (fallbackErr) {
        console.error("ask-mp: Fallback Gemini model also failed:", fallbackErr);
      }
    }
  }

  // Generate deterministic fallback answer if Gemini is unavailable
  return { text: generateFallbackText(params.queryType as any, params.context) };
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(request: Request) {
  let body: AskMpRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "BAD_REQUEST" }, { status: 400 });
  }

  const question = body?.question?.trim();
  const history = Array.isArray(body?.history) ? body.history : undefined;

  if (!question) {
    return NextResponse.json({ error: "Please enter a question.", code: "MISSING_QUESTION" }, { status: 400 });
  }

  let mps: MP[];
  try {
    mps = await db.getMps();
  } catch (err) {
    console.error("ask-mp: db.getMps() failed:", err);
    return NextResponse.json({ error: "MP data is currently unavailable.", code: "SERVER_ERROR" }, { status: 503 });
  }

  if (!mps || !mps.length) {
    return NextResponse.json({ error: "MP data is currently unavailable.", code: "SERVER_ERROR" }, { status: 503 });
  }

  const detected = analyzeQuery(question, mps, history);

  if (detected.queryType === "WEBSITE_META") {
    const metaAnswer = "I can answer questions about the parliamentary performance data of all 544 Lok Sabha MPs. I do not have verified information regarding website interface settings, user accounts, or server code.";
    return NextResponse.json({
      answer: metaAnswer,
      mp: null,
      queryType: "WEBSITE_META",
      data: null,
    });
  }

  let context: unknown;
  let primaryMp: MP | null = null;
  let responseData: Record<string, unknown> = {};

  switch (detected.queryType) {
    case "SINGLE_MP": {
      const singleContext = buildSingleMpContext(detected.mp!, mps);
      context = singleContext;
      primaryMp = detected.mp!.mp;
      responseData = { mp: slimMp(primaryMp), benchmarks: singleContext.benchmarks };
      break;
    }
    case "COMPARISON": {
      const compContext = buildComparisonContext(detected.mp!, detected.mpB!, mps);
      context = compContext;
      responseData = { mps: [slimMp(detected.mp!.mp), slimMp(detected.mpB!.mp)], comparison: compContext.comparison };
      break;
    }
    case "ANALYTICAL_FILTER": {
      const filterContext = buildAnalyticalFilterContext(detected, mps);
      context = filterContext;
      responseData = { filter: filterContext };
      break;
    }
    case "RANKING": {
      const rankContext = buildRankingContext(mps, detected.metric, detected.rankOrder);
      context = rankContext;
      responseData = { ranking: rankContext };
      break;
    }
    case "TOP_N": {
      const topContext = buildTopNContext(mps, detected.metric, detected.rankOrder, detected.topN);
      context = topContext;
      responseData = { topList: topContext.list };
      break;
    }
    case "FILTERED_RANKING": {
      const filteredRankContext = buildFilteredRankingContext(detected, detected.metric, detected.rankOrder, mps);
      context = filteredRankContext;
      responseData = { ranking: filteredRankContext };
      break;
    }
    case "PARTY_RANKING": {
      const partyRankContext = buildPartyRankingContext(mps, detected.metric);
      context = partyRankContext;
      responseData = { partyRankings: partyRankContext.rankings };
      break;
    }
    case "STATE_RANKING": {
      const stateRankContext = buildStateRankingContext(mps, detected.metric);
      context = stateRankContext;
      responseData = { stateRankings: stateRankContext.rankings };
      break;
    }
    case "PARTY_COMPARISON": {
      const partyCompContext = buildPartyComparisonContext(detected.party!, detected.partyB!, mps);
      context = partyCompContext;
      responseData = { partyComparison: partyCompContext };
      break;
    }
    case "STATE_COMPARISON": {
      const stateCompContext = buildStateComparisonContext(detected.state!, detected.stateB!, mps);
      context = stateCompContext;
      responseData = { stateComparison: stateCompContext };
      break;
    }
    default: {
      const filterContext = buildAnalyticalFilterContext(detected, mps);
      context = filterContext;
      responseData = { filter: filterContext };
      break;
    }
  }

  const geminiResult = await askGemini({
    question,
    queryType: detected.queryType,
    context,
    history,
  });

  return NextResponse.json({
    answer: geminiResult.text,
    mp: primaryMp
      ? {
          id: primaryMp.id,
          name: primaryMp.name,
          constituency: primaryMp.constituency,
          state: getState(primaryMp),
        }
      : null,
    queryType: detected.queryType,
    data: { ...responseData, context },
  });
}