'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronDown, Square, CheckSquare } from 'lucide-react';
import { db, MP, MPLADTotals } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { SectionHeader, StatCardSkeleton } from '@/components/citizen/CitizenUI';

type MetricKey = 'attendance_rate' | 'questions_count' | 'debates_count' | 'bills_sponsored' | 'mplad_utilization_pct';
type MPWithMplad = MP & { mplad_utilization_pct: number };

const METRICS: { key: MetricKey; label: string; shortLabel: string; format: (v: number) => string }[] = [
  { key: 'attendance_rate', label: 'Avg attendance', shortLabel: 'Attendance', format: v => `${v}%` },
  { key: 'questions_count', label: 'Avg questions', shortLabel: 'Questions', format: v => `${v}` },
  { key: 'debates_count', label: 'Avg debates', shortLabel: 'Debates', format: v => `${v}` },
  { key: 'bills_sponsored', label: 'Avg bills', shortLabel: 'Bills', format: v => `${v}` },
];

const MPLAD_METRIC = {
  key: 'mplad_utilization_pct' as const, label: 'MPLAD utilised', shortLabel: 'MPLAD', format: (v: number) => `${v}%`,
};

// Purely visual, rotating palette so rows are easy to tell apart at a glance.
// Deliberately not tied to any party's real-world colors — see the "no ideological ranking" note below.
const BAR_PALETTE = [
  { track: 'bg-sky-100', fill: 'bg-sky-300/80' },
  { track: 'bg-amber-100', fill: 'bg-amber-300/80' },
  { track: 'bg-emerald-100', fill: 'bg-emerald-300/80' },
  { track: 'bg-violet-100', fill: 'bg-violet-300/80' },
  { track: 'bg-rose-100', fill: 'bg-rose-300/80' },
  { track: 'bg-slate-100', fill: 'bg-slate-300/80' },
];

interface PartySpread {
  name: string;
  count: number;
  median: Record<MetricKey, number>;
  min: Record<MetricKey, number>;
  max: Record<MetricKey, number>;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
}

export default function CitizenPartiesPage() {
  const router = useRouter();
  const stateSelectRef = useRef<HTMLSelectElement>(null);

  const [loading, setLoading] = useState(true);
  const [allMps, setAllMps] = useState<MPWithMplad[]>([]);
  const [mpladAvailable, setMpladAvailable] = useState(false);
  const [metric, setMetric] = useState<MetricKey>('attendance_rate');
  const [scope, setScope] = useState<string>('National');
  const [selectedParty, setSelectedParty] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([db.getMps(), db.getMpladTotals()])
      .then(([mps, totals]) => {
        const byMpId = new Map<string, MPLADTotals>(totals.map(t => [t.mp_id, t]));
        setAllMps(mps.map(mp => ({ ...mp, mplad_utilization_pct: byMpId.get(mp.id)?.utilization_pct ?? 0 })));
        setMpladAvailable(totals.length > 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => (mpladAvailable ? [...METRICS, MPLAD_METRIC] : METRICS), [mpladAvailable]);

  const states = useMemo(() => Array.from(new Set(allMps.map(m => m.state))).sort(), [allMps]);
  const activeMetric = metrics.find(m => m.key === metric)!;

  const parties: PartySpread[] = useMemo(() => {
    const scoped = scope === 'National' ? allMps : allMps.filter(m => m.state === scope);

    const byParty: Record<string, MPWithMplad[]> = {};
    scoped.forEach(mp => {
      if (!byParty[mp.party]) byParty[mp.party] = [];
      byParty[mp.party].push(mp);
    });

    return Object.entries(byParty).map(([name, mps]) => {
      const buildStats = (key: MetricKey) => {
        const values = mps.map(m => m[key] as number);
        return { median: median(values), min: Math.min(...values), max: Math.max(...values) };
      };
      const a = buildStats('attendance_rate');
      const q = buildStats('questions_count');
      const d = buildStats('debates_count');
      const b = buildStats('bills_sponsored');
      const mp = buildStats('mplad_utilization_pct');
      return {
        name,
        count: mps.length,
        median: { attendance_rate: a.median, questions_count: q.median, debates_count: d.median, bills_sponsored: b.median, mplad_utilization_pct: mp.median },
        min: { attendance_rate: a.min, questions_count: q.min, debates_count: d.min, bills_sponsored: b.min, mplad_utilization_pct: mp.min },
        max: { attendance_rate: a.max, questions_count: q.max, debates_count: d.max, bills_sponsored: b.max, mplad_utilization_pct: mp.max },
      };
    });
  }, [allMps, scope]);

  const sorted = useMemo(
    () => [...parties].sort((x, y) => y.median[metric] - x.median[metric]),
    [parties, metric]
  );

  // Normalize spread bars against the widest value currently on screen for this metric,
  // so a party's min–max range renders proportionally, not just its median.
  const domainMax = useMemo(
    () => Math.max(1, ...parties.map(p => p.max[metric])),
    [parties, metric]
  );

  // Selection doesn't carry across a scope change (the party may not exist in the new scope).
  useEffect(() => {
    setSelectedParty(null);
  }, [scope]);

  const togglePartySelected = (name: string) => {
    setSelectedParty(prev => (prev === name ? null : name));
  };

  const handleDrillDown = () => {
    if (!selectedParty) return;
    router.push(`/citizen/search?q=${encodeURIComponent(selectedParty)}`);
  };

  const handleSwitchToState = () => {
    if (scope === 'National') {
      stateSelectRef.current?.focus();
      // Not all browsers support showPicker(); focusing is enough of a nudge where it isn't.
      stateSelectRef.current?.showPicker?.();
    } else {
      setScope('National');
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-10 space-y-8">
      <SectionHeader
        title="Party Performance"
        subtitle="Compare parliamentary performance across political parties using median values. Explore attendance, questions, debates and bills at both national and state levels."
      />

      {/* Metric selector */}
      <div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Metric</span>
        <div className="flex flex-wrap gap-2">
          {metrics.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors',
                metric === m.key
                  ? 'bg-foreground text-background'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scope: National / By state */}
      <div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Scope</span>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setScope('National')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors',
              scope === 'National'
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            )}
          >
            National
          </button>
          <div
            className={cn(
              'relative flex items-center gap-1 pl-3.5 pr-2.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer',
              scope !== 'National'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground border-border'
            )}
          >
            <span>{scope === 'National' ? 'By state' : scope}</span>
            <ChevronDown className="h-3.5 w-3.5" />
            <select
              ref={stateSelectRef}
              value={scope === 'National' ? '' : scope}
              onChange={e => setScope(e.target.value || 'National')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="">Or pick a state…</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No parties have MPs in {scope}.</p>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-foreground/80 bg-card p-5 sm:p-6"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Party averages — median MP with spread (min–max)
            </p>

            <div className="divide-y divide-border/60">
              {sorted.map((party, i) => {
                const minPct = (party.min[metric] / domainMax) * 100;
                const maxPct = (party.max[metric] / domainMax) * 100;
                const medianPct = (party.median[metric] / domainMax) * 100;
                const palette = BAR_PALETTE[i % BAR_PALETTE.length];
                const isSelected = selectedParty === party.name;

                return (
                  <div key={party.name} className="flex items-center gap-3 sm:gap-4 py-3.5">
                    <button
                      onClick={() => togglePartySelected(party.name)}
                      aria-pressed={isSelected}
                      aria-label={`Select ${party.name} for drill-down`}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isSelected ? <CheckSquare className="h-4 w-4 text-orange-500" /> : <Square className="h-4 w-4" />}
                    </button>

                    <div className="w-28 sm:w-36 shrink-0 min-w-0">
                      <p className="text-sm font-black text-foreground truncate">{party.name}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {party.count} MP{party.count !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={cn('relative h-2.5 rounded-full overflow-hidden', palette.track)}>
                        <div
                          className={cn('absolute inset-y-0 rounded-full', palette.fill)}
                          style={{ left: `${minPct}%`, width: `${Math.max(2, maxPct - minPct)}%` }}
                        />
                        <div
                          className="absolute inset-y-0 w-[3px] bg-foreground rounded-full"
                          style={{ left: `${medianPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-14 sm:w-16 text-right shrink-0">
                      <p className="text-base font-black text-foreground">{activeMetric.format(party.median[metric])}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-border/60">
              <div className="flex items-center gap-4 text-[9px] text-muted-foreground uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-foreground inline-block" /> median MP
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm border border-muted-foreground inline-block" /> min–max range
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground italic">neutral colors — no ideological ranking</span>
            </div>
          </motion.div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDrillDown}
              disabled={!selectedParty}
              className="px-4 py-2 rounded-full border border-border text-xs font-bold transition-colors hover:border-orange-500/50 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-current"
            >
              {selectedParty ? `Drill to ${selectedParty}'s MP list →` : "Drill to a party's MP list →"}
            </button>
            <button
              onClick={handleSwitchToState}
              className="px-4 py-2 rounded-full border border-border text-xs font-bold transition-colors hover:border-orange-500/50 hover:text-orange-500"
            >
              {scope === 'National' ? 'Switch to a single state' : 'Back to national'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
