'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, ArrowRightLeft, TrendingUp, Vote, X } from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import IndiaMap from '@/components/IndiaMap';
import { MPCardSkeleton, EmptyState, ScoreBadge, PartyLogo } from '@/components/citizen/CitizenUI';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allMps, setAllMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [stateFilter, setStateFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [minAttendance, setMinAttendance] = useState(0);
  const [sortBy, setSortBy] = useState<keyof MP | 'none'>('none');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    db.getMps()
      .then(data => setAllMps(data.filter(m => !m.is_minister)))
      .finally(() => setLoading(false));
  }, []);

  const states = useMemo(() => Array.from(new Set(allMps.map(m => m.state))).sort(), [allMps]);
  const parties = useMemo(() => Array.from(new Set(allMps.map(m => m.party))).sort(), [allMps]);

  const filteredMps = useMemo(() => {
    let r = allMps;
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.constituency.toLowerCase().includes(q) ||
        m.state.toLowerCase().includes(q) ||
        m.party.toLowerCase().includes(q)
      );
    }
    if (stateFilter) r = r.filter(m => m.state === stateFilter);
    if (partyFilter) r = r.filter(m => m.party === partyFilter);
    if (minScore > 0) r = r.filter(m => m.overall_score >= minScore);
    if (minAttendance > 0) r = r.filter(m => m.attendance_rate >= minAttendance);
    if (sortBy !== 'none') r = [...r].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
    return r;
  }, [allMps, query, stateFilter, partyFilter, minScore, minAttendance, sortBy]);

  const hasActiveFilters = !!(stateFilter || partyFilter || minScore > 0 || minAttendance > 0 || query);

  const clearAll = () => {
    setQuery('');
    setStateFilter('');
    setPartyFilter('');
    setMinScore(0);
    setMinAttendance(0);
    setSortBy('none');
  };

  const FiltersPanel = (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Search</label>
        <div className="relative flex items-center bg-background border border-border rounded-xl h-11 px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Name, constituency…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 h-full bg-transparent border-none focus:outline-none focus:ring-0 px-2.5 text-sm font-medium placeholder:text-muted-foreground/50"
          />
          {query && (
            <button onClick={() => setQuery('')} className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-colors shrink-0">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Party</label>
        <select className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm font-medium" value={partyFilter} onChange={e => setPartyFilter(e.target.value)}>
          <option value="">All Parties</option>
          {parties.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">State</label>
        <select className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm font-medium" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex justify-between">
          Min Score <span className="text-indigo-500">{minScore}</span>
        </label>
        <input type="range" min="0" max="100" value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-full accent-indigo-500" />
      </div>

      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex justify-between">
          Min Attendance <span className="text-indigo-500">{minAttendance}%</span>
        </label>
        <input type="range" min="0" max="100" value={minAttendance} onChange={e => setMinAttendance(Number(e.target.value))} className="w-full accent-indigo-500" />
      </div>

      <div>
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Sort By</label>
        <select className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm font-medium" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="none">Relevance</option>
          <option value="overall_score">Score</option>
          <option value="attendance_rate">Attendance</option>
          <option value="questions_count">Questions</option>
          <option value="bills_sponsored">Bills</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button onClick={clearAll} className="w-full text-center py-2.5 rounded-xl border border-rose-500/30 text-rose-500 text-xs font-bold hover:bg-rose-500/5 transition-colors">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="flex-1 w-full bg-background pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Find Your MP</h1>
        <p className="text-muted-foreground font-medium text-sm md:text-base">Filter by state, party, or performance — or click the map to narrow down.</p>
      </div>

      {/* Mobile filter toggle */}
      <div className="lg:hidden px-4 mb-4">
        <button
          onClick={() => setMobileFiltersOpen(v => !v)}
          className={cn(
            'w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold border transition-colors',
            hasActiveFilters ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-card border-border/60'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters {hasActiveFilters && `(${filteredMps.length})`}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left: Filters */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 bg-card border border-border/60 rounded-2xl p-6">
            {FiltersPanel}
          </div>
        </aside>

        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden col-span-1 overflow-hidden"
            >
              <div className="bg-card border border-border/60 rounded-2xl p-6 mb-2">{FiltersPanel}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right: Map */}
        <div className="lg:col-span-9 space-y-8">
          <div className="bg-card border border-border/60 rounded-[2rem] p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" /> Filter by State
              </h2>
              {stateFilter && (
                <button onClick={() => setStateFilter('')} className="text-xs font-bold text-indigo-500 hover:underline">Clear ({stateFilter})</button>
              )}
            </div>
            <div className="max-w-xs mx-auto">
              <IndiaMap
                selectedState={stateFilter || null}
                onStateClick={s => setStateFilter(prev => (prev === s ? '' : s))}
                hideControls
              />
            </div>
          </div>

          {/* Results */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">
              {loading ? 'Loading…' : `${filteredMps.length} result${filteredMps.length !== 1 ? 's' : ''}`}
            </p>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => <MPCardSkeleton key={i} />)}
              </div>
            ) : filteredMps.length === 0 ? (
              <EmptyState
                icon={<Search className="w-8 h-8" />}
                title="No MPs found"
                description="Try adjusting your search term or filters."
                action={<button onClick={clearAll} className="px-6 py-2.5 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">Clear all filters</button>}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence>
                  {filteredMps.slice(0, 24).map((mp, i) => (
                    <motion.div key={mp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                      className="bg-card border border-border/60 rounded-2xl p-5 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-200 flex flex-col group"
                    >
                      <div className="flex items-start gap-3 mb-5">
                        <img src={mp.image_url} alt={mp.name} className="w-14 h-14 rounded-full object-cover border border-border shrink-0 group-hover:ring-2 group-hover:ring-indigo-500/30 transition-all" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-base leading-tight truncate group-hover:text-indigo-500 transition-colors">{mp.name}</h3>
                            <PartyLogo party={mp.party} size="sm" />
                          </div>
                          <span className="inline-block px-2 py-0.5 mt-1 bg-foreground/5 text-[10px] font-bold rounded uppercase tracking-wide">{mp.party}</span>
                          <p className="text-xs text-muted-foreground mt-1.5 truncate flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{mp.constituency}, {mp.state}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-5">
                        {[
                          { label: 'Score', val: mp.overall_score },
                          { label: 'Attend', val: `${mp.attendance_rate}%` },
                          { label: 'Qs', val: mp.questions_count },
                          { label: 'Bills', val: mp.bills_sponsored },
                        ].map(s => (
                          <div key={s.label} className="text-center p-2 bg-background rounded-xl border border-border/60">
                            <span className="block text-base font-black tabular-nums">{s.val}</span>
                            <span className="block text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{s.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-2">
                        <Link href={`/citizen/mp/${mp.id}`} className="flex items-center justify-center py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 active:scale-[0.98] transition-all">
                          View Profile
                        </Link>
                        <Link href={`/citizen/compare?mp1=${mp.id}`} className="flex items-center justify-center gap-1.5 py-2.5 bg-foreground/5 border border-border/60 rounded-xl text-xs font-bold hover:bg-foreground/10 transition-colors">
                          <ArrowRightLeft className="w-3.5 h-3.5" /> Compare
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredMps.length > 24 && (
                  <div className="col-span-full text-center text-sm text-muted-foreground font-medium py-4">
                    Showing top 24 results — refine your search to see more.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick actions (shown when no filters active) */}
          {!hasActiveFilters && (
            <div className="pt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center mb-8">Quick actions</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { href: '/citizen/rankings', icon: TrendingUp, label: 'Explore Rankings', desc: 'Top performing MPs across India.', color: 'bg-indigo-500/10 text-indigo-500' },
                  { href: '/citizen/compare', icon: ArrowRightLeft, label: 'Compare MPs', desc: 'Head-to-head on key metrics.', color: 'bg-purple-500/10 text-purple-500' },
                  { href: '/citizen/election', icon: Vote, label: 'Election Insights', desc: 'Compare your local candidates.', color: 'bg-pink-500/10 text-pink-500' },
                ].map(item => (
                  <Link key={item.href} href={item.href} className="p-6 bg-card border border-border/60 rounded-2xl hover:border-indigo-500/30 hover:shadow-sm transition-all group">
                    <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform', item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold mb-1">{item.label}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
