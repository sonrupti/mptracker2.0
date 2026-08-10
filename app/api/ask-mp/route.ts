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
  | "FILTER"
  | "GENERAL";

export type MetricKey =
  | "overall_score"
  | "attendance_rate"
  | "questions_count"
  | "debates_count"
  | "bills_sponsored"
  | "bills_passed";

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
  matchedOn: "constituency" | "name" | "clean_name";
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

  // 2. Full name / clean_name exact match
  for (const m of pool) {
    const normName = normalize(m.name);
    const normClean = normalize(m.clean_name || "");
    if (normName && normName.length >= 3 && (candidateText.includes(normName) || q.includes(normName))) {
      return { mp: m, confidence: 0.98, matchedOn: "name" };
    }
    if (normClean && normClean.length >= 3 && (candidateText.includes(normClean) || q.includes(normClean))) {
      return { mp: m, confidence: 0.98, matchedOn: "clean_name" };
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

  // 5. Fuzzy match for misspellings
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
// STAGE 1 CALCULATIONS & CONTEXT BUILDERS
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
  mp?: MpMatch;
  mpB?: MpMatch;
  state?: { state: string; mps: MP[] };
  party?: { party: string; mps: MP[] };
}

function analyzeQuery(question: string, mps: MP[]): DetectedQuery {
  const metric = resolveMetric(question);
  const rankOrder = detectRankOrder(question);
  const topN = extractTopN(question);

  const isComparison = /\bcompare\b|\bvs\.?\b|\bversus\b|who (performed|did) better|who is better|which (one|mp) is better/i.test(question);
  const hasRankingWords = /\b(highest|lowest|most|least|best|worst|top|bottom|highest score|highest attendance|most questions|most debates|most bills)\b/i.test(question);
  const hasTopNWords = /\b(top|bottom|first|best)\s+\d+\b|\b\d+\s+(top|best|mps)\b/i.test(question);
  const hasFilterWords = /\b(100%|hundred percent|sponsored bills|passed bills|with attendance)\b/i.test(question);

  // 1. COMPARISON
  if (isComparison) {
    const twoMps = resolveTwoMPs(question, mps);
    if (twoMps) {
      return { queryType: "COMPARISON", metric, rankOrder, topN, mp: twoMps[0], mpB: twoMps[1] };
    }
  }

  // Check for State and Party
  const state = resolveState(question, mps);
  const party = resolveParty(question, mps);

  // 2. FILTERED_RANKING
  if ((state || party) && (hasRankingWords || hasTopNWords)) {
    return { queryType: "FILTERED_RANKING", metric, rankOrder, topN, state: state || undefined, party: party || undefined };
  }

  // 3. TOP_N
  if (hasTopNWords) {
    return { queryType: "TOP_N", metric, rankOrder, topN, state: state || undefined, party: party || undefined };
  }

  // 4. RANKING
  if (hasRankingWords) {
    return { queryType: "RANKING", metric, rankOrder, topN };
  }

  // 5. FILTER (e.g. 100% attendance, sponsored bills, or state/party without ranking)
  if (hasFilterWords || (state && !resolveMP(question, mps)) || (party && !resolveMP(question, mps))) {
    return { queryType: "FILTER", metric, rankOrder, topN, state: state || undefined, party: party || undefined };
  }

  // 6. SINGLE_MP
  const mpMatch = resolveMP(question, mps);
  if (mpMatch) {
    return { queryType: "SINGLE_MP", metric, rankOrder, topN, mp: mpMatch };
  }

  return { queryType: "GENERAL", metric, rankOrder, topN };
}

// ============================================================================
// CONTEXT GENERATION FOR GEMINI
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

function buildFilteredRankingContext(
  detected: DetectedQuery,
  metric: MetricKey,
  order: "asc" | "desc",
  allMps: MP[]
) {
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

function buildFilterContext(detected: DetectedQuery, metric: MetricKey, question: string, allMps: MP[]) {
  let pool = allMps;
  let filterCriteria = "Custom Filter";

  const is100Attendance = /\b100%|hundred percent\b/i.test(question);
  const isSponsoredBills = /\bsponsored\b/i.test(question);

  if (detected.state) {
    pool = detected.state.mps;
    filterCriteria = `State: ${detected.state.state}`;
  } else if (detected.party) {
    pool = detected.party.mps;
    filterCriteria = `Party: ${detected.party.party}`;
  } else if (is100Attendance) {
    pool = allMps.filter((m) => getMpMetric(m, "attendance_rate") === 100);
    filterCriteria = "Attendance rate = 100%";
  } else if (isSponsoredBills) {
    pool = allMps.filter((m) => getMpMetric(m, "bills_sponsored") > 0);
    filterCriteria = "Bills sponsored > 0";
  }

  return {
    filterCriteria,
    matchingCount: pool.length,
    totalMps: allMps.length,
    sampleMps: pool.slice(0, 15).map(slimMp),
    hasMore: pool.length > 15,
  };
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

const SYSTEM_RULES = `
You are the conversational assistant for an Indian Parliament MP performance tracker.

The supplied DATA is the only source of truth.
Never invent statistics.
Never change numbers.
Never calculate rankings independently when the ranking has already been computed by the application.
Never claim that an MP is objectively good or bad without a benchmark.
When several MPs tie for first place, explicitly say that they are tied.
When comparing MPs, explain metric-by-metric differences.
If information is unavailable, say so clearly.
Use concise, natural language.
Use bullet points where useful.
Do not mention internal implementation details, APIs, Supabase, TypeScript, prompts, or database queries.
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

Write the response now. Return only the answer text — no preamble, no labels.`;
}

const CLARIFICATION_MESSAGE =
  "I couldn't confidently match that to an MP, constituency, state, or party in the records. Could you try naming the constituency, state, or MP more specifically — for example \"How did the MP from Lucknow perform?\" or \"Which MP has the highest attendance?\"";

// ============================================================================
// GEMINI CALL & ERROR HANDLING
// ============================================================================

function classifyGeminiError(error: unknown): { status: number; code: string; message: string } {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("quota")) {
    return {
      status: 429,
      code: "RATE_LIMITED",
      message: "The AI service is temporarily rate-limited. Please try again shortly.",
    };
  }

  if (
    lower.includes("404") ||
    lower.includes("not found") ||
    lower.includes("is not supported") ||
    lower.includes("unavailable")
  ) {
    return {
      status: 404,
      code: "MODEL_UNAVAILABLE",
      message: "The AI model configured for this feature is currently unavailable. Please try again later.",
    };
  }

  return {
    status: 500,
    code: "SERVER_ERROR",
    message: "Something went wrong while processing your question.",
  };
}

async function askGemini(params: {
  question: string;
  queryType: QueryType;
  context: unknown;
  history?: HistoryTurn[];
}): Promise<{ text: string } | { error: string; code: string; status: number }> {
  const prompt = buildPrompt(params);

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return { text };
  } catch (error) {
    console.error(`ask-mp: Gemini call failed with model ${GEMINI_MODEL}:`, error);

    // Fallback model check if default model fails
    if (GEMINI_MODEL !== "gemini-1.5-flash") {
      try {
        console.log("ask-mp: Attempting fallback to gemini-1.5-flash...");
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const fallbackResult = await fallbackModel.generateContent(prompt);
        return { text: fallbackResult.response.text() };
      } catch (fallbackErr) {
        console.error("ask-mp: Fallback Gemini model also failed:", fallbackErr);
      }
    }

    const classified = classifyGeminiError(error);
    return { error: classified.message, code: classified.code, status: classified.status };
  }
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

  if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
    console.error("ask-mp: GOOGLE_AI_STUDIO_API_KEY is not configured.");
    return NextResponse.json(
      { error: "The AI service is not configured on the server.", code: "SERVER_ERROR" },
      { status: 500 }
    );
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

  const detected = analyzeQuery(question, mps);

  // Handle short follow-up questions ("why?", "tell me more")
  const isShortFollowUp = question.split(/\s+/).length <= 4 && detected.queryType === "GENERAL";
  const lastTurn = history && history.length ? history[history.length - 1] : undefined;

  if (isShortFollowUp && lastTurn?.data) {
    const answer = await askGemini({
      question,
      queryType: "GENERAL",
      context: lastTurn.data,
      history,
    });

    if ("error" in answer) {
      return NextResponse.json({ error: answer.error, code: answer.code }, { status: answer.status });
    }

    return NextResponse.json({
      answer: answer.text,
      mp: null,
      queryType: "GENERAL",
      data: lastTurn.data,
    });
  }

  if (detected.queryType === "GENERAL") {
    return NextResponse.json({
      answer: CLARIFICATION_MESSAGE,
      mp: null,
      queryType: "GENERAL",
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
    case "FILTER": {
      const filterContext = buildFilterContext(detected, detected.metric, question, mps);
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

  if ("error" in geminiResult) {
    return NextResponse.json({ error: geminiResult.error, code: geminiResult.code }, { status: geminiResult.status });
  }

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