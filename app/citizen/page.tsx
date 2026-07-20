'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, MapPin, ArrowRight, TrendingUp, ArrowRightLeft, Vote, ChevronRight,
  Users, Landmark, MessageSquare, FileText, Award, Clock,
} from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import IndiaMap from '@/components/IndiaMap';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Skeleton, ScoreBadge, CountUp, PartyLogo, ProgressBar } from '@/components/citizen/CitizenUI';

interface StateSummary {
  state: string;
  mpCount: number;
  avgAttendance: number;
  totalQuestions: number;
  totalBills: number;
  topMp: MP | null;
}

export default function CitizenLandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [topMps, setTopMps] = useState<MP[]>([]);
  const [mpLoading, setMpLoading] = useState(true);
  const [allMps, setAllMps] = useState<MP[]>([]);
  const [insights, setInsights] = useState<{ totalQuestions: number; totalBills: number; avgAttendance: number } | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    db.getMps({ sortBy: 'overall_score', sortOrder: 'desc' })
      .then(mps => {
        const active = mps.filter(m => !m.is_minister);
        setTopMps(active.slice(0, 4));
        setAllMps(mps);
      })
      .finally(() => setMpLoading(false));

    db.getAggregatedInsights().then(data =>
      setInsights({
        totalQuestions: data.totalQuestions,
        totalBills: data.totalBills,
        avgAttendance: data.avgAttendance,
      })
    );
  }, []);

  const statesCount = useMemo(() => new Set(allMps.map(m => m.state)).size, [allMps]);
  const states = useMemo(() => Array.from(new Set(allMps.map(m => m.state))).sort(), [allMps]);

  const stateSummary: StateSummary | null = useMemo(() => {
    if (!selectedState || allMps.length === 0) return null;
    const stateMps = allMps.filter(m => m.state === selectedState);
    if (stateMps.length === 0) return null;
    const avg = (key: keyof MP) =>
      Number((stateMps.reduce((acc, m) => acc + (m[key] as number), 0) / stateMps.length).toFixed(1));
    const topMp = [...stateMps].sort((a, b) => b.overall_score - a.overall_score)[0] || null;
    return {
      state: selectedState,
      mpCount: stateMps.length,
      avgAttendance: avg('attendance_rate'),
      totalQuestions: stateMps.reduce((acc, m) => acc + m.questions_count, 0),
      totalBills: stateMps.reduce((acc, m) => acc + m.bills_sponsored, 0),
      topMp,
    };
  }, [selectedState, allMps]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/citizen/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleStateClick = (state: string) => {
    setSelectedState(prev => (prev === state ? null : state || null));
  };

  const stats = [
    { label: 'Total MPs', value: 544, suffix: '', icon: Users },
    { label: 'States & UTs', value: statesCount || 36, suffix: '', icon: Landmark },
    { label: 'Bills Tracked', value: insights?.totalBills ?? 0, suffix: '+', icon: FileText },
    { label: 'Questions Tracked', value: insights?.totalQuestions ?? 0, suffix: '+', icon: MessageSquare },
  ];

  const quickActions = [
    { href: '/citizen/search', icon: Search, label: 'Find My MP', desc: 'Search by name or location', color: 'text-indigo-500', bg: 'from-indigo-500/15 to-indigo-500/5' },
    { href: '/citizen/compare', icon: ArrowRightLeft, label: 'Compare MPs', desc: 'Head-to-head insights', color: 'text-purple-500', bg: 'from-purple-500/15 to-purple-500/5' },
    { href: '/citizen/rankings', icon: TrendingUp, label: 'Rankings', desc: 'Top performers', color: 'text-emerald-500', bg: 'from-emerald-500/15 to-emerald-500/5' },
    { href: '/citizen/election', icon: Vote, label: 'Elections', desc: 'Compare candidates', color: 'text-amber-500', bg: 'from-amber-500/15 to-amber-500/5' },
  ];

  return (
    <div className="flex-1 w-full bg-background">
      {/* Hero */}
      <section className="relative pt-20 pb-28 px-4 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[30%] left-[-5%] w-[300px] h-[300px] bg-purple-500/8 blur-[100px] rounded-full pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="relative z-10 w-full max-w-3xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-indigo-500 text-xs font-bold mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            18th Lok Sabha · Live Data
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            Know Your{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">MP</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 font-medium max-w-xl mx-auto leading-relaxed">
            Track attendance, bills, and questions. Understand how your representative performs — in plain language.
          </p>

          <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto mb-8">
            <div className="relative group flex items-center bg-card border border-border/60 rounded-2xl h-16 px-4 shadow-lg shadow-black/5 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/40 transition-all duration-200">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-indigo-500 transition-colors shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by MP name, Constituency, or State…"
                className="flex-1 h-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 text-base font-medium placeholder:text-muted-foreground/50"
              />
              <button type="submit" className="shrink-0 h-11 px-5 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all">
                Find
              </button>
            </div>
          </form>

  
        </motion.div>
      </section>

      {/* Stats strip */}
      <section className="px-4 max-w-5xl mx-auto mb-16 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-5 text-center"
            >
              <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-indigo-500/5 blur-xl" />
              <stat.icon className="w-4 h-4 text-indigo-500 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-black tracking-tight">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 max-w-5xl mx-auto mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Link href={action.href} className="relative flex flex-col gap-3 p-5 rounded-2xl bg-card border border-border/60 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden">
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300', action.bg)} />
                <div className={cn('relative w-10 h-10 rounded-xl flex items-center justify-center bg-foreground/5 group-hover:scale-110 transition-transform')}>
                  <action.icon className={cn('h-5 w-5', action.color)} />
                </div>
                <div className="relative">
                  <h3 className="font-bold text-sm flex items-center gap-1">
                    {action.label}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive State Explorer */}
      <section className="px-4 max-w-7xl mx-auto mb-28">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Explore by State</h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl mx-auto md:mx-0">
            Click on any state to see how its MPs perform — attendance, questions, bills, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 items-start">
          {/* Map */}
<div className="lg:col-span-3 bg-card border border-border/60 rounded-[2rem] p-6 md:p-8">
  <div className="mb-5">
    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
      Or select your state
    </label>
    <select
      value={selectedState || ''}
      onChange={e => handleStateClick(e.target.value)}
      className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
    >
      <option value="">Select a state…</option>
      {states.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  </div>
  <IndiaMap onStateClick={handleStateClick} selectedState={selectedState} hideControls />
</div>

          {/* Dynamic summary panel */}
          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              {stateSummary ? (
                <motion.div
                  key={stateSummary.state}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  className="relative bg-card border border-border/60 rounded-[2rem] p-7 md:p-8 overflow-hidden"
                >
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/8 blur-3xl pointer-events-none" />
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 relative">Selected State</p>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-6 relative">{stateSummary.state}</h3>

                  <div className="grid grid-cols-2 gap-3 mb-6 relative">
                    {[
                      { label: 'MPs', value: stateSummary.mpCount, icon: Users },
                      { label: 'Avg Attendance', value: `${stateSummary.avgAttendance}%`, icon: Clock },
                      { label: 'Questions Asked', value: stateSummary.totalQuestions, icon: MessageSquare },
                      { label: 'Bills Sponsored', value: stateSummary.totalBills, icon: FileText },
                    ].map(s => (
                      <div key={s.label} className="p-3.5 bg-background rounded-xl border border-border/60">
                        <s.icon className="w-3.5 h-3.5 text-indigo-500 mb-1.5" />
                        <span className="block text-lg font-black tabular-nums">{s.value}</span>
                        <span className="block text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {stateSummary.topMp && (
                    <Link
                      href={`/citizen/mp/${stateSummary.topMp.id}`}
                      className="relative flex items-center gap-3 p-3.5 bg-background rounded-xl border border-border/60 hover:border-indigo-500/40 transition-colors mb-6 group"
                    >
                      <img src={stateSummary.topMp.image_url} alt={stateSummary.topMp.name} className="w-11 h-11 rounded-full object-cover border border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3 h-3" /> Top Performing MP
                        </p>
                        <h4 className="text-sm font-bold truncate group-hover:text-indigo-500 transition-colors">{stateSummary.topMp.name}</h4>
                      </div>
                      <ScoreBadge score={stateSummary.topMp.overall_score} size="sm" />
                    </Link>
                  )}

                  <Link
                    href={`/citizen/state/${encodeURIComponent(stateSummary.state)}`}
                    className="relative w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    View MPs <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center h-full min-h-[360px] bg-card/50 border border-dashed border-border rounded-[2rem] p-8"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-1.5">Select a state</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">Click any state on the map to see its MPs' attendance, bills, and questions.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Top MPs */}
      <section className="px-4 max-w-7xl mx-auto mb-28">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Top Performing MPs</h2>
            <p className="text-sm text-muted-foreground mt-1">Based on attendance, bills, and legislative activity.</p>
          </div>
          <Link href="/citizen/rankings" className="hidden md:flex items-center gap-1 text-sm font-bold text-indigo-500 hover:text-indigo-400 transition-colors">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {mpLoading
            ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border/60 rounded-2xl overflow-hidden animate-pulse">
                <Skeleton className="h-44 w-full" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                  <Skeleton className="h-2 w-full rounded-full mt-3" />
                </div>
              </div>
            ))
            : topMps.map((mp, i) => (
              <motion.div
                key={mp.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <Link href={`/citizen/mp/${mp.id}`} className="block group bg-card border border-border/60 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                  <div className="relative h-40 bg-gradient-to-br from-indigo-500/8 to-purple-500/8 flex items-center justify-center">
                    <div className="absolute top-3 left-3 w-8 h-8 bg-background/90 backdrop-blur rounded-lg flex items-center justify-center text-xs font-black text-muted-foreground">
                      #{i + 1}
                    </div>
                    <div className="absolute top-3 right-3">
                      <PartyLogo party={mp.party} size="md" />
                    </div>
                    <img src={mp.image_url} alt={mp.name} className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h3 className="font-bold text-sm md:text-base truncate group-hover:text-indigo-500 transition-colors">{mp.name}</h3>
                      <ScoreBadge score={mp.overall_score} size="sm" />
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">{mp.party} · {mp.constituency}</p>

                    <div className="grid grid-cols-3 gap-1.5 mt-3.5">
                      {[
                        { label: 'Attend', val: `${mp.attendance_rate}%` },
                        { label: 'Qs', val: mp.questions_count },
                        { label: 'Bills', val: mp.bills_sponsored },
                      ].map(s => (
                        <div key={s.label} className="text-center py-1.5 bg-background rounded-lg border border-border/50">
                          <span className="block text-xs font-black tabular-nums">{s.val}</span>
                          <span className="block text-[8px] font-bold text-muted-foreground uppercase mt-0.5">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    <ProgressBar value={mp.overall_score} className="mt-3" />
                  </div>
                </Link>
              </motion.div>
            ))
          }
        </div>
      </section>
    </div>
  );
}
