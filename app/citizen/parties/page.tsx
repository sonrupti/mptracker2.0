'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, MessageSquare, Activity, FileText, Users } from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { SectionHeader, StatCardSkeleton, PartyLogo } from '@/components/citizen/CitizenUI';

type MetricKey = 'attendance_rate' | 'questions_count' | 'debates_count' | 'bills_sponsored';

const METRICS: { key: MetricKey; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; format: (v: number) => string; color: string }[] = [
  { key: 'attendance_rate', label: 'Avg Attendance', shortLabel: 'Attendance', icon: Clock, format: v => `${v}%`, color: 'text-emerald-500' },
  { key: 'questions_count', label: 'Avg Questions', shortLabel: 'Questions', icon: MessageSquare, format: v => `${v}`, color: 'text-violet-500' },
  { key: 'debates_count', label: 'Avg Debates', shortLabel: 'Debates', icon: Activity, format: v => `${v}`, color: 'text-pink-500' },
  { key: 'bills_sponsored', label: 'Avg Bills', shortLabel: 'Bills', icon: FileText, format: v => `${v}`, color: 'text-amber-500' },
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
  const [loading, setLoading] = useState(true);
  const [allMps, setAllMps] = useState<MP[]>([]);
  const [metric, setMetric] = useState<MetricKey>('attendance_rate');
  const [scope, setScope] = useState<string>('National');

  useEffect(() => {
    db.getMps()
      .then(setAllMps)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const states = useMemo(() => Array.from(new Set(allMps.map(m => m.state))).sort(), [allMps]);
  const activeMetric = METRICS.find(m => m.key === metric)!;

  const parties: PartySpread[] = useMemo(() => {
    const scoped = scope === 'National' ? allMps : allMps.filter(m => m.state === scope);

    const byParty: Record<string, MP[]> = {};
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
      return {
        name,
        count: mps.length,
        median: { attendance_rate: a.median, questions_count: q.median, debates_count: d.median, bills_sponsored: b.median },
        min: { attendance_rate: a.min, questions_count: q.min, debates_count: d.min, bills_sponsored: b.min },
        max: { attendance_rate: a.max, questions_count: q.max, debates_count: d.max, bills_sponsored: b.max },
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
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors',
                metric === m.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              <m.icon className="h-3.5 w-3.5" /> {m.label}
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
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors',
              scope === 'National'
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            )}
          >
            National
          </button>
          <select
            value={scope === 'National' ? '' : scope}
            onChange={e => setScope(e.target.value || 'National')}
            className="h-9 px-3 bg-card border border-border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
          >
            <option value="">Or pick a state…</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No parties have MPs in {scope}.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((party, i) => {
            const minPct = (party.min[metric] / domainMax) * 100;
            const maxPct = (party.max[metric] / domainMax) * 100;
            const medianPct = (party.median[metric] / domainMax) * 100;

            return (
              <motion.div
                key={party.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-2xl p-5 space-y-4 hover:border-indigo-500/30 transition-colors"
              >
                {/* Party name + rank */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-black text-muted-foreground/60 w-6 shrink-0">#{i + 1}</span>
                    <PartyLogo party={party.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground truncate">{party.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {party.count} MP{party.count !== 1 ? 's' : ''} in {scope === 'National' ? 'Lok Sabha' : scope}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-xl font-black', activeMetric.color)}>{activeMetric.format(party.median[metric])}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">median · {activeMetric.shortLabel}</p>
                  </div>
                </div>

                {/* Median-with-spread bar for the selected metric */}
                <div>
                  <div className="relative h-2.5 bg-background rounded-full overflow-hidden">
                    {/* min–max range */}
                    <div
                      className="absolute inset-y-0 bg-foreground/12 rounded-full"
                      style={{ left: `${minPct}%`, width: `${Math.max(2, maxPct - minPct)}%` }}
                    />
                    {/* median tick */}
                    <div
                      className="absolute inset-y-0 w-[3px] bg-indigo-500 rounded-full"
                      style={{ left: `${medianPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-muted-foreground font-medium">min {activeMetric.format(party.min[metric])}</span>
                    <span className="text-[9px] text-muted-foreground font-medium">max {activeMetric.format(party.max[metric])}</span>
                  </div>
                </div>

                {/* Secondary metrics at a glance (also median, not avg) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {METRICS.map(m => (
                    <div key={m.key} className="bg-background/60 rounded-xl p-3 border border-border/60">
                      <div className="flex items-center gap-1.5 mb-1">
                        <m.icon className={cn('h-3 w-3', m.color)} />
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">{m.shortLabel}</span>
                      </div>
                      <p className={cn('text-sm font-black', m.color)}>{m.format(party.median[m.key])}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/citizen/search?q=${encodeURIComponent(party.name)}`}
                  className="inline-block text-[10px] text-indigo-500 hover:text-indigo-400 font-bold transition-colors"
                >
                  View all {party.name} MPs →
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/50 p-4">
      </div>
    </div>
  );
}