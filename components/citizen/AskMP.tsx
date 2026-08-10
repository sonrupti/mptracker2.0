'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { PartyLogo } from '@/components/citizen/CitizenUI';

// ----------------------------------------------------------------------------
// Types mirroring the API's response shape (app/api/ask-mp/route.ts)
// ----------------------------------------------------------------------------

type QueryIntent =
  | 'mp_profile'
  | 'ranking'
  | 'state_ranking'
  | 'party_ranking'
  | 'party_comparison'
  | 'mp_comparison'
  | 'statistics'
  | 'general';

interface SlimMp {
  id: string;
  name: string;
  constituency: string;
  state: string;
  party: string;
  overall_score: number;
  attendance_rate: number;
  questions_count: number;
  debates_count: number;
  bills_sponsored: number;
  bills_passed: number;
}

interface RankingRow {
  id: string;
  name: string;
  constituency: string;
  state: string;
  party: string;
  value: number;
}

interface Ranking {
  metric: string;
  order: 'asc' | 'desc';
  topValue: number | null;
  tiedForFirstCount: number;
  list: RankingRow[];
}

interface PartyRankingRow {
  party: string;
  mpCount: number;
  average: number;
}

interface ComparisonRow {
  metric: string;
  label: string;
  unit: 'percent' | 'count';
  difference: number;
  leadingMp?: string;
  leadingParty?: string;
  mpAValue?: number;
  mpBValue?: number;
  partyAValue?: number;
  partyBValue?: number;
}

interface AskMpData {
  mp?: SlimMp;
  mps?: SlimMp[];
  ranking?: Ranking;
  parties?: PartyRankingRow[];
  comparison?: ComparisonRow[];
  state?: string;
  party?: string;
  averages?: unknown;
}

interface HistoryTurn {
  question: string;
  answer: string;
  data?: AskMpData | null;
}

interface AskMpResponse {
  answer: string;
  intent: QueryIntent;
  data?: AskMpData | null;
  error?: string;
  code?: string;
}

const MAX_HISTORY = 6;

function formatMetricValue(value: number, metricKey: string) {
  if (metricKey === 'attendance_rate') return `${value}%`;
  return `${value}`;
}

// ----------------------------------------------------------------------------
// Small result renderers — kept deliberately compact, matching existing card style
// ----------------------------------------------------------------------------

function MpMiniCard({ mp }: { mp: SlimMp }) {
  return (
    <Link
      href={`/citizen/mp/${mp.id}`}
      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 hover:border-orange-500/40 transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <PartyLogo party={mp.party} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{mp.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{mp.constituency}, {mp.state}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-orange-500">{mp.overall_score}</p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Score</p>
      </div>
    </Link>
  );
}

function RankingList({ ranking }: { ranking: Ranking }) {
  return (
    <div className="space-y-1.5">
      {ranking.list.slice(0, 5).map((row, i) => (
        <Link
          key={row.id}
          href={`/citizen/mp/${row.id}`}
          className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
            <PartyLogo party={row.party} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{row.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{row.constituency}, {row.state}</p>
            </div>
          </div>
          <span className="text-sm font-black shrink-0">{formatMetricValue(row.value, ranking.metric)}</span>
        </Link>
      ))}
      {ranking.tiedForFirstCount > 1 && (
        <p className="text-[11px] text-muted-foreground pt-1">
          {ranking.tiedForFirstCount} MPs are tied at the top value.
        </p>
      )}
    </div>
  );
}

function PartyRankingList({ parties }: { parties: PartyRankingRow[] }) {
  return (
    <div className="space-y-1.5">
      {parties.slice(0, 6).map((row, i) => (
        <div key={row.party} className="flex items-center justify-between gap-3 p-2.5 rounded-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
            <PartyLogo party={row.party} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{row.party}</p>
              <p className="text-[11px] text-muted-foreground">{row.mpCount} MPs</p>
            </div>
          </div>
          <span className="text-sm font-black shrink-0">{row.average}</span>
        </div>
      ))}
    </div>
  );
}

function ComparisonTable({ mps, comparison }: { mps?: SlimMp[]; comparison: ComparisonRow[] }) {
  const nameA = mps?.[0]?.name ?? 'A';
  const nameB = mps?.[1]?.name ?? 'B';

  return (
    <div className="space-y-1">
      {mps && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {mps.map((mp) => <MpMiniCard key={mp.id} mp={mp} />)}
        </div>
      )}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        {comparison.map((row) => (
          <div key={row.metric} className="flex items-center justify-between gap-2 px-3 py-2 text-xs border-b border-border/40 last:border-b-0">
            <span className="text-muted-foreground shrink-0 w-28 truncate">{row.label}</span>
            <span className="font-bold">{row.mpAValue ?? row.partyAValue ?? '—'}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-bold">{row.mpBValue ?? row.partyBValue ?? '—'}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground pt-1">{nameA} vs {nameB}</p>
    </div>
  );
}

function ResultPanel({ intent, data }: { intent: QueryIntent; data: AskMpData }) {
  if (intent === 'mp_profile' && data.mp) {
    return <MpMiniCard mp={data.mp} />;
  }
  if ((intent === 'ranking' || intent === 'state_ranking') && data.ranking) {
    return <RankingList ranking={data.ranking} />;
  }
  if (intent === 'party_ranking' && data.parties) {
    return <PartyRankingList parties={data.parties} />;
  }
  if ((intent === 'mp_comparison' || intent === 'party_comparison') && data.comparison) {
    return <ComparisonTable mps={data.mps} comparison={data.comparison} />;
  }
  return null;
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export default function AskMP() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [intent, setIntent] = useState<QueryIntent | null>(null);
  const [resultData, setResultData] = useState<AskMpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryTurn[]>([]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    setLoading(true);
    setAnswer('');
    setError('');
    setResultData(null);

    try {
      const response = await fetch('/api/ask-mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmedQuestion,
          history: history.slice(-MAX_HISTORY),
        }),
      });

      const data: AskMpResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      const finalAnswer = data.answer || 'I could not generate an answer.';
      setAnswer(finalAnswer);
      setIntent(data.intent);
      setResultData(data.data ?? null);
      setQuestion('');

      setHistory((prev) =>
        [...prev, { question: trimmedQuestion, answer: finalAnswer, data: data.data ?? null }].slice(-MAX_HISTORY)
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to process your question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-orange-500" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Ask about an MP
        </p>
      </div>

      <form
        onSubmit={handleAsk}
        className="relative bg-card border border-border/60 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-orange-500/40 focus-within:border-orange-500/40 transition-all"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something like “How did the MP in Lucknow perform?” or “Which MP has the highest attendance?”"
          rows={3}
          disabled={loading}
          className="w-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 p-4 pr-14 text-sm font-medium placeholder:text-muted-foreground/50 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="absolute right-3 bottom-3 h-10 w-10 flex items-center justify-center bg-foreground text-background rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Ask"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      <div className="mt-2 text-[11px] text-muted-foreground">
        Try asking about attendance, questions, debates, bills, rankings, states, parties, or comparisons.
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 bg-card border border-border/60 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              <span>Checking parliamentary data...</span>
            </div>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-card border border-red-500/20 rounded-2xl p-4"
          >
            <p className="text-sm text-red-500">{error}</p>
          </motion.div>
        )}

        {answer && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold">MP Tracker AI</span>
              </div>

              <div className="text-sm leading-6 text-foreground whitespace-pre-wrap">
                {answer}
              </div>
            </div>

            {intent && resultData && (
              <div className="pt-3 border-t border-border/40">
                <ResultPanel intent={intent} data={resultData} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
