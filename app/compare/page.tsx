'use client';

import { useLanguage } from '@/context/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Swords,
  Trophy,
  Clock,
  FileText,
  MessageSquare,
  MessageCircle,
  Award,
  ArrowRight,
  Zap,
  Shield,
  Target,
  Star,
  ChevronDown,
  Search
} from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ── Stat bar with animated fill ───────────────────────────────────────────────
function StatBar({
  label, icon, valueA, valueB, maxVal, unitA = '', unitB = '', colorA, colorB, winner
}: {
  label: string; icon: React.ReactNode;
  valueA: number; valueB: number; maxVal: number;
  unitA?: string; unitB?: string;
  colorA: string; colorB: string;
  winner: 'A' | 'B' | 'tie';
}) {
  const pctA = Math.min(100, (valueA / maxVal) * 100);
  const pctB = Math.min(100, (valueB / maxVal) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <span className={cn("font-black text-sm", winner === 'A' ? colorA : "text-foreground")}>{valueA}{unitA}</span>
        <span className="flex items-center gap-1 text-muted-foreground">{icon}{label}</span>
        <span className={cn("font-black text-sm", winner === 'B' ? colorB : "text-foreground")}>{valueB}{unitB}</span>
      </div>
      <div className="flex items-center gap-1 h-2">
        {/* Left bar (A) — fills right to left */}
        <div className="flex-1 bg-card rounded-full overflow-hidden flex justify-end">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${pctA}%`, background: winner === 'A' ? 'linear-gradient(90deg, #6366f1, #818cf8)' : '#3f3f46' }}
          />
        </div>
        {/* Centre dot */}
        <div className={cn(
          "w-2 h-2 rounded-full shrink-0",
          winner === 'tie' ? 'bg-amber-400' : winner === 'A' ? 'bg-indigo-400' : 'bg-rose-400'
        )} />
        {/* Right bar (B) — fills left to right */}
        <div className="flex-1 bg-card rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${pctB}%`, background: winner === 'B' ? 'linear-gradient(90deg, #fb7185, #f43f5e)' : '#3f3f46' }}
          />
        </div>
      </div>
    </div>
  );
}

// ── MP Selector card ──────────────────────────────────────────────────────────
function MPSelector({
  slot, selected, allMps, onChange, color, accentClass
}: {
  slot: 'A' | 'B' | 'C' | 'D' | 'E';
  selected: MP | null;
  allMps: MP[];
  onChange: (id: string) => void;
  color: string;
  accentClass: string;
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = allMps.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.constituency.toLowerCase().includes(search.toLowerCase()) ||
    m.party.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 30);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={cn(
      "flex-1 rounded-2xl border-2 p-5 space-y-4 relative transition-all",
      selected ? `border-opacity-60 bg-background/60` : "border-border bg-background/30 border-dashed"
    )} style={{ borderColor: selected ? color : undefined }} ref={ref}>

      {/* Slot label */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: color }}>
          {slot}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {slot === 'A' ? 'Challenger' : slot === 'B' ? 'Opponent' : `Player ${slot}`}
        </span>
      </div>

      {/* Selected MP display */}
      {selected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: color }}>
              <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-black text-foreground text-sm leading-tight">{selected.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{selected.constituency}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                {selected.party}
              </span>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Score', val: selected.overall_score },
              { label: 'Attend', val: `${selected.attendance_rate}%` },
              { label: 'Q&A', val: selected.questions_count },
            ].map(s => (
              <div key={s.label} className="bg-muted rounded-lg p-2 text-center">
                <p className="text-sm font-black text-foreground">{s.val}</p>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <Swords className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Select an MP to battle</p>
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted text-xs text-muted-foreground hover:border-zinc-600 transition-colors"
      >
        <span>{selected ? 'Change MP' : 'Choose MP'}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder={t.searchMpParty}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-lg py-1.5 pl-8 pr-3 text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(m => (
              <button
                key={m.id}
                onClick={() => { onChange(m.id); setOpen(false); setSearch(''); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-card text-left transition-colors"
              >
                <img src={m.image_url} alt={m.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.party} · {m.state}</p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground shrink-0">{m.overall_score}pts</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No MPs found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Winner Banner ─────────────────────────────────────────────────────────────
function WinnerBanner({ mpA, mpB }: { mpA: MP; mpB: MP }) {
  const { t } = useLanguage();
  const scores = [
    mpA.overall_score > mpB.overall_score ? 'A' : mpA.overall_score < mpB.overall_score ? 'B' : 'tie',
    mpA.attendance_rate > mpB.attendance_rate ? 'A' : mpA.attendance_rate < mpB.attendance_rate ? 'B' : 'tie',
    mpA.questions_count > mpB.questions_count ? 'A' : mpA.questions_count < mpB.questions_count ? 'B' : 'tie',
    mpA.debates_count > mpB.debates_count ? 'A' : mpA.debates_count < mpB.debates_count ? 'B' : 'tie',
    mpA.bills_sponsored > mpB.bills_sponsored ? 'A' : mpA.bills_sponsored < mpB.bills_sponsored ? 'B' : 'tie',
  ];
  const winsA = scores.filter(s => s === 'A').length;
  const winsB = scores.filter(s => s === 'B').length;
  const overall = winsA > winsB ? 'A' : winsB > winsA ? 'B' : 'tie';
  const winner = overall === 'A' ? mpA : overall === 'B' ? mpB : null;

  return (
    <div className={cn(
      "rounded-2xl border p-6 text-center relative overflow-hidden",
      overall === 'tie'
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-indigo-500/30 bg-indigo-500/5"
    )}>
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-indigo-400 opacity-30 animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${1.5 + Math.random()}s`
            }}
          />
        ))}
      </div>

      {overall === 'tie' ? (
        <div className="relative z-10 space-y-2">
          <div className="text-4xl">🤝</div>
          <p className="text-xl font-black text-amber-400">{t.itsATie}</p>
          <p className="text-xs text-muted-foreground">{t.bothMpsMatched}</p>
        </div>
      ) : (
        <div className="relative z-10 space-y-3">
          <Trophy className="h-8 w-8 text-yellow-400 mx-auto" />
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t.winner}</p>
          <div className="flex items-center justify-center gap-3">
            <img src={winner!.image_url} alt={winner!.name} className="w-12 h-12 rounded-full border-2 border-yellow-400" />
            <div className="text-left">
              <p className="text-lg font-black text-foreground">{winner!.name}</p>
              <p className="text-xs text-muted-foreground">{winner!.constituency} · {winner!.party}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm">
            <span className="text-indigo-400 font-black">{winsA} wins</span>
            <span className="text-muted-foreground">{t.vs}</span>
            <span className="text-rose-400 font-black">{winsB} wins</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const { t } = useLanguage();
  const [allMps, setAllMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
 

  useEffect(() => {
       db.getMps().then(data => {
    setAllMps(data);
    if (data.length > 0) setIdA(data[0].id);
    if (data.length > 1) setIdB(data[1].id);
    setLoading(false);
  }).catch(() => setLoading(false));
    
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
        <span className="mt-4 text-sm text-muted-foreground font-medium">{t.loadingBattleArena}</span>
      </div>
    );
  }

  const mpA = allMps.find(m => m.id === idA) ?? null;
  const mpB = allMps.find(m => m.id === idB) ?? null;
  const allSelected = [mpA, mpB].filter(Boolean) as MP[];

  const getWinner = (a: number, b: number): 'A' | 'B' | 'tie' =>
    a > b ? 'A' : a < b ? 'B' : 'tie';

  const COLOR_A = '#6366f1';
  const COLOR_B = '#f43f5e';
  const COLOR_C = '#10b981';
  const COLOR_D = '#f59e0b';
  const COLOR_E = '#a855f7';

  const stats = mpA && mpB ? [
    { label: 'Overall Score', icon: <Award className="h-3 w-3" />, a: mpA.overall_score, b: mpB.overall_score, max: 100, unit: 'pts', winner: getWinner(mpA.overall_score, mpB.overall_score) },
    { label: 'Attendance', icon: <Clock className="h-3 w-3" />, a: mpA.attendance_rate, b: mpB.attendance_rate, max: 100, unit: '%', winner: getWinner(mpA.attendance_rate, mpB.attendance_rate) },
    { label: 'Questions', icon: <MessageSquare className="h-3 w-3" />, a: mpA.questions_count, b: mpB.questions_count, max: Math.max(mpA.questions_count, mpB.questions_count, 1), unit: '', winner: getWinner(mpA.questions_count, mpB.questions_count) },
    { label: 'Debates', icon: <MessageCircle className="h-3 w-3" />, a: mpA.debates_count, b: mpB.debates_count, max: Math.max(mpA.debates_count, mpB.debates_count, 1), unit: '', winner: getWinner(mpA.debates_count, mpB.debates_count) },
    { label: 'Bills Sponsored', icon: <FileText className="h-3 w-3" />, a: mpA.bills_sponsored, b: mpB.bills_sponsored, max: Math.max(mpA.bills_sponsored, mpB.bills_sponsored, 1), unit: '', winner: getWinner(mpA.bills_sponsored, mpB.bills_sponsored) },
  ] : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Swords className="h-7 w-7 text-indigo-400" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.mpBattleArena}</h1>
          <Swords className="h-7 w-7 text-rose-400 scale-x-[-1]" />
        </div>
        <p className="text-muted-foreground text-sm">{t.pickTwoMps}</p>
      </div>

      {/* VS Selector — up to 5 MPs */}
{/* VS Selector */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <MPSelector
    slot="A"
    selected={mpA}
    allMps={allMps}
    onChange={setIdA}
    color={COLOR_A}
    accentClass=""
  />

  <MPSelector
    slot="B"
    selected={mpB}
    allMps={allMps}
    onChange={setIdB}
    color={COLOR_B}
    accentClass=""
  />
</div>

      {/* Battle Stats */}
      {allSelected.length >= 2 && (
        <>
          {/* Winner banner */}
          <WinnerBanner mpA={allSelected[0]} mpB={allSelected[1]} />

          {/* Stat bars */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-xs font-bold text-foreground truncate max-w-[120px]">{mpA!.name}</span>
              </div>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.headToHead}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground truncate max-w-[120px] text-right">{mpB!.name}</span>
                <div className="w-2 h-2 rounded-full bg-rose-400" />
              </div>
            </div>

            <div className="space-y-5">
              {stats.map(s => (
                <StatBar
                  key={s.label}
                  label={s.label}
                  icon={s.icon}
                  valueA={s.a}
                  valueB={s.b}
                  maxVal={s.max}
                  unitA={s.unit}
                  unitB={s.unit}
                  colorA="text-indigo-400"
                  colorB="text-rose-400"
                  winner={s.winner as 'A' | 'B' | 'tie'}
                />
              ))}
            </div>
          </div>

          {/* Topic focus comparison */}
          {mpA && mpB && (
            <div className="grid grid-cols-2 gap-4">
              {[{ mp: mpA, color: COLOR_A, label: 'Challenger Focus' }, { mp: mpB, color: COLOR_B, label: 'Opponent Focus' }].map(({ mp, color, label }) => (
                <div key={mp.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-black text-foreground">{mp.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(mp.top_topics || []).map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {t}
                      </span>
                    ))}
             {(!mp.top_topics || mp.top_topics.length === 0) && <span className="text-[10px] text-muted-foreground">{t.noFocusData}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* View profiles */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { mp: mpA, color: COLOR_A },
              { mp: mpB, color: COLOR_B },
             
            ]
              .filter(
                (item): item is { mp: MP; color: string } =>
                  item.mp !== null
              )
              .map(({ mp, color }) => (
                <Link
                  key={mp.id}
                  href={`/mps/${mp.id}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all hover:scale-[1.02]"
                  style={{
                    borderColor: `${color}40`,
                    color,
                    background: `${color}08`,
                  }}
                >
                  <span>
                    View {mp.name.split(" ")[0]}'s Full Profile
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
          </div>
        </>
      )}

      {allSelected.length < 2 && (
        <div className="text-center py-16 text-muted-foreground">
          <Swords className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Select at least two MPs above to start the battle
          </p>
        </div>
      )}
    </div>
  );
}