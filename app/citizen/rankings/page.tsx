'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, MapPin, TrendingUp, TrendingDown, Clock, MessageSquare, Activity, FileText,
} from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { PageLoader, ListRowSkeleton, EmptyState, PartyLogo } from '@/components/citizen/CitizenUI';

const BATCH_SIZE = 20;
const SPLIT_SIZE = 10; // how many rows show in each of Top / Bottom before "show full table"

type MetricKey = 'attendance_rate' | 'questions_count' | 'debates_count' | 'bills_sponsored';

const METRICS: { key: MetricKey; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; format: (v: number) => string }[] = [
  { key: 'attendance_rate', label: 'Attendance', shortLabel: 'Attend.', icon: Clock, format: v => `${v}%` },
  { key: 'questions_count', label: 'Questions', shortLabel: 'Qs', icon: MessageSquare, format: v => `${v}` },
  { key: 'debates_count', label: 'Debates', shortLabel: 'Debates', icon: Activity, format: v => `${v}` },
  { key: 'bills_sponsored', label: 'Bills Sponsored', shortLabel: 'Bills', icon: FileText, format: v => `${v}` },
];

interface RankedMp extends MP {
  rank: number;
}

export default function RankingsPage() {
  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [metric, setMetric] = useState<MetricKey>('attendance_rate');
  const [scope, setScope] = useState<string>('All India');
  const [showFullTable, setShowFullTable] = useState(false);
  const [fullDisplayCount, setFullDisplayCount] = useState(BATCH_SIZE);

  useEffect(() => {
    db.getMps()
      .then(data => setMps(data.filter(m => !m.is_minister)))
      .finally(() => setLoading(false));
  }, []);

  const states = useMemo(() => Array.from(new Set(mps.map(m => m.state))).sort(), [mps]);

  const activeMetric = METRICS.find(m => m.key === metric)!;

  // Scope by state, then rank by the chosen single metric — this ranking
  // never uses a composite score. Switching the metric re-ranks the list.
  const ranked: RankedMp[] = useMemo(() => {
    const scoped = scope === 'All India' ? mps : mps.filter(m => m.state === scope);
    return [...scoped]
      .sort((a, b) => (b[metric] as number) - (a[metric] as number))
      .map((mp, idx) => ({ ...mp, rank: idx + 1 }));
  }, [mps, scope, metric]);

  const searched = useMemo(() => {
    if (!search.trim()) return ranked;
    const q = search.toLowerCase();
    return ranked.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.state.toLowerCase().includes(q) ||
        m.party.toLowerCase().includes(q) ||
        m.constituency.toLowerCase().includes(q)
    );
  }, [ranked, search]);

  useEffect(() => {
    setShowFullTable(false);
    setFullDisplayCount(BATCH_SIZE);
  }, [metric, scope]);

  const loadMoreFull = useCallback(() => {
    setFullDisplayCount(prev => prev + BATCH_SIZE);
  }, []);

  const isSearching = search.trim().length > 0;
  const topRows = searched.slice(0, SPLIT_SIZE);
  const bottomRows = searched.length > SPLIT_SIZE ? searched.slice(-SPLIT_SIZE) : [];
  const fullRows = searched.slice(0, fullDisplayCount);

  const Row = ({ mp, idx, variant }: { mp: RankedMp; idx: number; variant: 'top' | 'bottom' | 'full' }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: (idx % BATCH_SIZE) * 0.02 }}
      whileHover={{ y: -2 }}
    >
      <Link
        href={`/citizen/mp/${mp.id}`}
        className={cn(
          'group flex items-center gap-4 p-4 md:p-5 bg-card border rounded-2xl hover:shadow-lg transition-all duration-200',
          variant === 'bottom'
            ? 'border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-500/8'
            : 'border-border/70 hover:border-indigo-500/40 hover:shadow-indigo-500/8'
        )}
      >
        {/* Rank */}
        <span className={cn(
          'w-10 flex items-center justify-end gap-1 text-right text-xl font-black shrink-0 tabular-nums transition-colors',
          variant === 'top' && mp.rank <= 3 ? 'text-indigo-500' : variant === 'bottom' ? 'text-amber-500/80' : 'text-muted-foreground/50 group-hover:text-indigo-400'
        )}>
          {mp.rank}
        </span>

        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={mp.image_url}
            alt={mp.name}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-background ring-1 ring-border group-hover:ring-indigo-500/30 transition-all"
          />
          <div className="absolute -bottom-1 -right-1">
            <PartyLogo party={mp.party} size="sm" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base md:text-lg font-bold truncate group-hover:text-indigo-500 transition-colors">
            {mp.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className="text-xs font-bold text-foreground/60">{mp.party}</span>
            <span className="text-muted-foreground/40 text-xs">•</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {mp.constituency}, {mp.state}
            </span>
          </div>
        </div>

        {/* Metric value (not a score) */}
        <div className="shrink-0 text-right">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">{activeMetric.shortLabel}</span>
          <span className={cn('text-lg font-black tabular-nums', variant === 'bottom' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
            {activeMetric.format(mp[metric] as number)}
          </span>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div className="flex-1 w-full bg-background pb-24 min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 py-10 px-4 bg-gradient-to-b from-card/50 to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Rankings</h1>
            
          </div>
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search MP, Party, or State"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-80 h-11 pl-11 pr-4 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Metric selector */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Rank By</span>
          <div className="flex flex-wrap gap-2">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-colors',
                  metric === m.key
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card border-border/60 text-foreground/70 hover:border-indigo-500/40'
                )}
              >
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scope selector */}
        <div className="mb-8">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Scope</span>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setScope('All India')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-bold border transition-colors',
                scope === 'All India'
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-card border-border/60 text-foreground/70 hover:border-indigo-500/40'
              )}
            >
              All India
            </button>
            <select
              value={scope === 'All India' ? '' : scope}
              onChange={e => setScope(e.target.value || 'All India')}
              className="h-10 px-3 bg-card border border-border/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
            >
              <option value="">Or pick a state…</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">
            {isSearching ? `${searched.length} results found` : `${ranked.length} representatives${scope !== 'All India' ? ` in ${scope}` : ''}`}
          </p>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => <ListRowSkeleton key={i} />)}
          </div>
        ) : searched.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title="No results found"
            description={`We couldn't find any MPs matching "${search}". Try a different name, party, or state.`}
            action={
              <button
                onClick={() => setSearch('')}
                className="px-6 py-2.5 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Clear search
              </button>
            }
          />
        ) : isSearching ? (
          // Search mode: single ranked list (true rank number preserved), simple load-more.
          <div className="space-y-3">
            <AnimatePresence>
              {fullRows.map((mp, idx) => <Row key={mp.id} mp={mp} idx={idx} variant="full" />)}
            </AnimatePresence>
            {fullDisplayCount < searched.length && (
              <div className="pt-8 flex justify-center">
                <button
                  onClick={loadMoreFull}
                  className="group flex items-center gap-2 px-7 py-3 bg-card border border-border rounded-xl font-bold text-sm hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-200"
                >
                  <TrendingUp className="h-4 w-4 group-hover:text-indigo-500 transition-colors" />
                  Load More
                </button>
              </div>
            )}
          </div>
        ) : !showFullTable ? (
          // Default: Top performers / Bottom performers split, per metric.
          <div className="space-y-10">
            <section>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-500 mb-4">
                <TrendingUp className="h-4 w-4" /> Top Performers
              </h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {topRows.map((mp, idx) => <Row key={mp.id} mp={mp} idx={idx} variant="top" />)}
                </AnimatePresence>
              </div>
            </section>

            {bottomRows.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-500 mb-4">
                  <TrendingDown className="h-4 w-4" /> Bottom Performers
                </h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {bottomRows.map((mp, idx) => <Row key={mp.id} mp={mp} idx={idx} variant="bottom" />)}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {searched.length > SPLIT_SIZE * 2 && (
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setShowFullTable(true)}
                  className="px-7 py-3 bg-card border border-border rounded-xl font-bold text-sm hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-200"
                >
                  Show full table (all {searched.length}) →
                </button>
              </div>
            )}
          </div>
        ) : (
          // Expanded: full sorted table with load-more batching.
          <div className="space-y-3">
            <button
              onClick={() => setShowFullTable(false)}
              className="text-xs font-bold text-indigo-500 hover:underline mb-2"
            >
              ← Back to Top / Bottom view
            </button>
            <AnimatePresence>
              {fullRows.map((mp, idx) => <Row key={mp.id} mp={mp} idx={idx} variant="full" />)}
            </AnimatePresence>
            {fullDisplayCount < searched.length && (
              <div className="pt-8 flex justify-center">
                <button
                  onClick={loadMoreFull}
                  className="group flex items-center gap-2 px-7 py-3 bg-card border border-border rounded-xl font-bold text-sm hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-200"
                >
                  <TrendingUp className="h-4 w-4 group-hover:text-indigo-500 transition-colors" />
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}