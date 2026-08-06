'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Navigation, Trophy, Landmark, Scale } from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { PartyLogo } from '@/components/citizen/CitizenUI';

// Same Levenshtein-based fuzzy matcher used on the main search page, so
// typos ("Bhuvaneshwar") still resolve here too.
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));
  for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(text: string, query: string) {
  const source = text.toLowerCase().trim();
  const search = query.toLowerCase().trim();
  if (source.includes(search)) return true;
  const sourceWords = source.split(/\s+/);
  return search.split(/\s+/).every(qWord =>
    sourceWords.some(sWord => sWord.includes(qWord) || levenshtein(sWord, qWord) <= 2)
  );
}

const EXPLORE_CARDS = [
  { href: '/citizen/rankings', icon: Trophy, label: 'Top & bottom MPs', color: 'text-orange-500' },
  { href: '/citizen/parties', icon: Landmark, label: 'Compare parties', color: 'text-green-600' },
  { href: '/citizen/compare', icon: Scale, label: 'Compare two MPs', color: 'text-blue-500' },
];

export default function SimpleHomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [allMps, setAllMps] = useState<MP[]>([]);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateMsg, setLocateMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.getMps().then(setAllMps).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results = query.trim()
    ? allMps.filter(m => fuzzyMatch(m.name, query) || fuzzyMatch(m.constituency, query) || fuzzyMatch(m.state, query)).slice(0, 6)
    : [];

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (results.length === 1) {
    router.push(`/citizen/mp/${results[0].id}`);
  } else if (query.trim()) {
    router.push(`/citizen/search?q=${encodeURIComponent(query.trim())}`);
  }
};

  // Browser geolocation can give us coordinates, but we don't have a
  // coordinate → constituency lookup yet, so this guides the person to the
  // map instead of pretending to resolve their exact seat.
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocateMsg("Location isn't supported on this device — try the map instead.");
      return;
    }
    setLocating(true);
    setLocateMsg(null);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false);
        setLocateMsg("Got your location — pick your state on the map to narrow down to your constituency.");
        setTimeout(() => router.push('/citizen/simple/find'), 1200);
      },
      () => {
        setLocating(false);
        setLocateMsg("Couldn't access your location — try the map instead.");
      }
    );
  };

  return (
    <div className="flex-1 w-full bg-background flex items-center justify-center px-4 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-xl"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.08] mb-4 text-center md:text-left">
          How well did your MP<br />represent you?
        </h1>
        <p className="text-muted-foreground font-medium mb-8 text-center md:text-left">
          Track attendance, questions, and bills — using public parliamentary records, in plain language.
        </p>

        {/* Search */}
        <div className="relative" ref={containerRef}>
          <form onSubmit={handleSubmit} className="relative flex items-center bg-card border border-border/60 rounded-2xl h-14 px-4 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/40 transition-all">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search your constituency, MP, or state…"
              className="flex-1 h-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 text-sm font-medium placeholder:text-muted-foreground/50"
            />
            <button type="submit" className="shrink-0 h-10 px-5 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all">
              Find
            </button>
          </form>

          <AnimatePresence>
            {open && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 max-h-72 overflow-y-auto"
              >
                {results.map(mp => (
                  <Link
                    key={mp.id}
                   href={`/citizen/mp/${mp.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-background transition-colors border-b border-border/50 last:border-0"
                  >
                    <img src={mp.image_url} alt={mp.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-border" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{mp.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">{mp.constituency}, {mp.state}</p>
                    </div>
                    <PartyLogo party={mp.party} size="sm" />
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      <div
  className={`transition-all duration-200 ${
    open && results.length > 0 ? "mt-80" : "mt-4"
  }`}
>
  <div className="flex flex-col sm:flex-row items-center gap-3">
  
  </div>

  {locateMsg && (
    <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">
      {locateMsg}
    </p>
  )}

  <div className="border-t border-dashed border-border/60 my-8" />

  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 text-center sm:text-left">
    Or explore
  </p>

  <div className="grid grid-cols-3 gap-3">
  
  </div>

          <Link
            href="/citizen/simple/find"
            className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-6 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 active:scale-[0.98] transition-all"
          >
            <MapPin className="h-4 w-4" /> Find on map
          </Link>
          <button
            onClick={handleUseLocation}
            disabled={locating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-6 bg-card border border-border/60 rounded-xl text-sm font-bold hover:border-orange-500/40 transition-all disabled:opacity-60"
          >
            <Navigation className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} /> {locating ? 'Locating…' : 'Use my location'}
          </button>
        </div>
        {locateMsg && <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">{locateMsg}</p>}

        <div className="border-t border-dashed border-border/60 my-8" />

        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 text-center sm:text-left">Or explore</p>
        <div className="grid grid-cols-3 gap-3">
          {EXPLORE_CARDS.map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="flex flex-col items-center gap-2 text-center p-4 bg-card border border-border/60 rounded-2xl hover:border-orange-500/30 hover:-translate-y-0.5 transition-all"
            >
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <span className="text-[11px] font-bold leading-tight">{card.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
