'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, MapPin, ArrowLeft, Search } from 'lucide-react';
import { db, MP, normalizeRegion } from '@/lib/supabase';
import IndiaMap from '@/components/IndiaMap';
import { PartyLogo, ScoreBadge, PageLoader } from '@/components/citizen/CitizenUI';

export default function FindMyMpPage() {
  const router = useRouter();
  const [allMps, setAllMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [constituencyQuery, setConstituencyQuery] = useState('');

  useEffect(() => {
    db.getMps()
      .then(data => setAllMps(data.filter(m => !m.is_minister)))
      .finally(() => setLoading(false));
  }, []);

  const states = useMemo(() => Array.from(new Set(allMps.map(m => normalizeRegion(m.state)))).sort(), [allMps]);

  const handleStateClick = (state: string) => {
    const normalized = normalizeRegion(state) || null;
    setSelectedState(prev => (prev === normalized ? null : normalized));
    setConstituencyQuery('');
  };

  // Clicking a state automatically reveals its constituencies below/beside
  // the map — no extra click needed to "confirm" the state first.
  const constituencyMps = useMemo(() => {
    if (!selectedState) return [];
    const list = allMps.filter(m => normalizeRegion(m.state) === selectedState);
    if (!constituencyQuery.trim()) return list.sort((a, b) => a.constituency.localeCompare(b.constituency));
    const q = constituencyQuery.toLowerCase();
    return list
      .filter(m => m.constituency.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
      .sort((a, b) => a.constituency.localeCompare(b.constituency));
  }, [allMps, selectedState, constituencyQuery]);

  if (loading) return <PageLoader />;

  return (
    <div className="flex-1 w-full bg-background pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <header className="max-w-6xl mx-auto px-4 mt-6 mb-8">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-2">
          <span>India</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={selectedState ? 'text-foreground font-bold' : ''}>{selectedState || 'pick a state'}</span>
          {selectedState && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-muted-foreground/60">pick constituency</span>
            </>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Find your MP</h1>
      </header>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 items-start">
        {/* Map */}
        <div className="lg:col-span-3 bg-card border border-border/60 rounded-[2rem] p-6 md:p-8">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
            Click a state — or pick from the list
          </label>
          <select
            value={selectedState || ''}
            onChange={e => handleStateClick(e.target.value)}
            className="w-full h-11 px-3 mb-5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
          >
            <option value="">Select a state…</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <IndiaMap onStateClick={handleStateClick} selectedState={selectedState} hideControls />
        </div>

        {/* Constituency list — appears automatically once a state is picked */}
        <div className="lg:col-span-2 lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            {selectedState ? (
              <motion.div
                key={selectedState}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="bg-card border border-border/60 rounded-[2rem] p-6 md:p-7"
              >
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1.5">Selected State</p>
                <h3 className="text-2xl font-black tracking-tight mb-4">{selectedState}</h3>

                <div className="relative flex items-center bg-background border border-border rounded-xl h-11 px-3 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={constituencyQuery}
                    onChange={e => setConstituencyQuery(e.target.value)}
                    placeholder="Search constituency or MP…"
                    className="flex-1 h-full bg-transparent border-none focus:outline-none focus:ring-0 px-2.5 text-sm font-medium placeholder:text-muted-foreground/50"
                  />
                </div>

                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  {constituencyMps.length} constituenc{constituencyMps.length !== 1 ? 'ies' : 'y'}
                </p>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {constituencyMps.map(mp => (
                  <Link
  key={mp.id}
  href={`/citizen/mp/${mp.id}`}
  className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/60 hover:border-orange-500/40 transition-colors group"
>
                      <img src={mp.image_url} alt={mp.name} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate group-hover:text-orange-500 transition-colors">{mp.constituency}</h4>
                        <p className="text-[10px] text-muted-foreground truncate">{mp.name} · {mp.party}</p>
                      </div>
                      <PartyLogo party={mp.party} size="sm" />
                      <ScoreBadge score={mp.overall_score} size="sm" />
                    </Link>
                  ))}
                  {constituencyMps.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No constituencies match "{constituencyQuery}".</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center min-h-[360px] bg-card/50 border border-dashed border-border rounded-[2rem] p-8"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-bold text-lg mb-1.5">Select a state</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Click any state on the map — its constituencies will show up here automatically.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
