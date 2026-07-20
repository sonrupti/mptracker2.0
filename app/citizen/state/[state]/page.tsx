'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, MessageSquare, FileText, Users, BarChart3 } from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  PageLoader,
  EmptyState,
  BackButton,
  ScoreBadge,
  StatCardSkeleton,
} from '@/components/citizen/CitizenUI';


function AnimatedBar({ label, val, natVal, pct, natPct, format }: {
  label: string; val: number; natVal: number; pct: number; natPct: number; format: (v: number) => string | number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="w-20 text-right text-[11px] font-bold text-indigo-500 shrink-0 truncate">This State</span>
          <div className="flex-1 h-2 bg-border/60 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: 'easeOut' }} className="h-full bg-indigo-500 rounded-full" />
          </div>
          <span className="w-10 text-[11px] font-black text-right tabular-nums shrink-0">{format(val)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 text-right text-[11px] font-semibold text-muted-foreground/70 shrink-0 truncate">National</span>
          <div className="flex-1 h-2 bg-border/60 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} whileInView={{ width: `${natPct}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: 'easeOut' }} className="h-full bg-zinc-400/60 rounded-full" />
          </div>
          <span className="w-10 text-[11px] font-bold text-muted-foreground text-right tabular-nums shrink-0">{format(natVal)}</span>
        </div>
      </div>
    </div>
  );
}

export default function StatePage() {
  const params = useParams();
  const router = useRouter();
  const stateName = decodeURIComponent(params.state as string).replace(/-/g, ' ');

  const [stateMps, setStateMps] = useState<MP[]>([]);
  const [nationalMps, setNationalMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([db.getMps(), db.getMps({ region: stateName })])
      .then(([all, state]) => {
        setNationalMps(all.filter(m => !m.is_minister));
        setStateMps(state.filter(m => !m.is_minister).sort((a, b) => b.overall_score - a.overall_score));
      })
      .finally(() => setLoading(false));
  }, [stateName]);

  if (loading) {
    return (
      <div className="flex-1 w-full bg-background pb-24">
        <div className="max-w-6xl mx-auto px-4 pt-10">
          <div className="h-8 w-16 bg-foreground/5 rounded-xl animate-pulse mb-8" />
          <div className="h-48 bg-card rounded-3xl animate-pulse mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!stateMps.length) {
    return (
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 pt-10">
          <BackButton onClick={() => router.back()} />
        </div>
        <EmptyState
          title={`No data for ${stateName}`}
          description="We couldn't find any MPs for this state. Please check the state name and try again."
          action={<Link href="/citizen" className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold">Back to Home</Link>}
        />
      </div>
    );
  }

  const avg = (arr: MP[], key: keyof MP) =>
    Number((arr.reduce((acc, m) => acc + (m[key] as number), 0) / arr.length).toFixed(1));

  const stateStats = {
    attendance: avg(stateMps, 'attendance_rate'),
    questions: avg(stateMps, 'questions_count'),
    bills: avg(stateMps, 'bills_sponsored'),
    score: avg(stateMps, 'overall_score'),
  };
  const nationalStats = {
    attendance: avg(nationalMps, 'attendance_rate'),
    questions: avg(nationalMps, 'questions_count'),
    bills: avg(nationalMps, 'bills_sponsored'),
    score: avg(nationalMps, 'overall_score'),
  };

  const isAbove = stateStats.score >= nationalStats.score;

  const partyCounts: Record<string, number> = {};
  stateMps.forEach(mp => { partyCounts[mp.party] = (partyCounts[mp.party] || 0) + 1; });
  const parties = Object.entries(partyCounts).sort((a, b) => b[1] - a[1]);

  const kpis = [
    { label: 'Avg Attendance', value: `${stateStats.attendance}%`, nat: `${nationalStats.attendance}%`, icon: Clock, color: 'text-emerald-500' },
    { label: 'Avg Questions', value: stateStats.questions, nat: nationalStats.questions, icon: MessageSquare, color: 'text-violet-500' },
    { label: 'Avg Bills', value: stateStats.bills, nat: nationalStats.bills, icon: FileText, color: 'text-amber-500' },
    { label: 'Total MPs', value: stateMps.length, nat: `of 544`, icon: Users, color: 'text-sky-500' },
  ];

  return (
    <div className="flex-1 w-full bg-background pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <BackButton onClick={() => router.back()} />
      </div>

      {/* Hero */}
      <header className="max-w-6xl mx-auto px-4 mt-8 mb-12">
        <div className="relative bg-card border border-border/60 rounded-[2rem] p-8 md:p-12 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-purple-500/8 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">{stateName}</h1>
              <p className="text-base md:text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">
                {stateName} has <strong className="text-foreground">{stateMps.length}</strong> Members of Parliament. Their overall performance is{' '}
                <strong className={isAbove ? 'text-emerald-500' : 'text-amber-500'}>{isAbove ? 'above' : 'below'}</strong> the national average.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="bg-background/80 backdrop-blur border border-border px-7 py-5 rounded-2xl text-center shrink-0"
            >
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">State Score</span>
              <ScoreBadge score={stateStats.score} size="lg" />
              <span className="text-xs text-muted-foreground block mt-1">Nat avg: {nationalStats.score}</span>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-5 bg-card border border-border/60 rounded-2xl hover:border-indigo-500/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                <kpi.icon className={cn('h-4 w-4', kpi.color)} />
              </div>
              <span className="text-2xl font-black block">{kpi.value}</span>
              <span className="text-[10px] text-muted-foreground mt-1 block">Nat avg: {kpi.nat}</span>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Performance vs National */}
            <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-black mb-8">Performance vs National Average</h2>
              <div className="space-y-8">
                {[
                  { key: 'attendance', label: 'Attendance Rate', max: 100, format: (v: number) => `${v}%` },
                  { key: 'questions', label: 'Questions Asked', max: Math.max(stateStats.questions, nationalStats.questions, 30), format: (v: number) => v },
                  { key: 'bills', label: 'Bills Sponsored', max: Math.max(stateStats.bills, nationalStats.bills, 5), format: (v: number) => v },
                ].map(metric => (
                  <AnimatedBar
                    key={metric.key}
                    label={metric.label}
                    val={stateStats[metric.key as keyof typeof stateStats]}
                    natVal={nationalStats[metric.key as keyof typeof nationalStats]}
                    pct={(stateStats[metric.key as keyof typeof stateStats] / metric.max) * 100}
                    natPct={(nationalStats[metric.key as keyof typeof nationalStats] / metric.max) * 100}
                    format={metric.format}
                  />
                ))}
              </div>
            </section>

            {/* Top MPs */}
            <section>
              <h2 className="text-lg font-black mb-5">Top MPs in {stateName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stateMps.slice(0, 6).map((mp, i) => (
                  <motion.div key={mp.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                    <Link href={`/citizen/mp/${mp.id}`}
                      className="flex items-center gap-3 p-4 bg-card border border-border/60 rounded-2xl hover:border-indigo-500/40 hover:shadow-sm transition-all duration-200 group"
                    >
                      <img src={mp.image_url} alt={mp.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-border" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold truncate group-hover:text-indigo-500 transition-colors">{mp.name}</h3>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{mp.party} · {mp.constituency}</p>
                      </div>
                      <ScoreBadge score={mp.overall_score} size="sm" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {/* Party Distribution */}
            <section className="bg-card border border-border/60 rounded-2xl p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Party Distribution
              </h2>
              <div className="space-y-3">
                {parties.slice(0, 7).map(([party, count]) => (
                  <div key={party} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold truncate flex-1 min-w-0">{party}</span>
                    <span className="text-sm font-black shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h2 className="text-sm font-black uppercase tracking-widest opacity-80 mb-4">Dig Deeper</h2>
              <p className="text-sm text-white/80 mb-5 leading-relaxed">Compare {stateName}'s MPs to find who truly stands out.</p>
              <div className="flex flex-col gap-2.5">
                <Link href="/citizen/compare" className="text-center px-4 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all">
                  Compare MPs
                </Link>
                <Link href="/citizen/rankings" className="text-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors">
                  National Rankings
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
