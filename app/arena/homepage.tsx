'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Crown, Trophy, Swords, TrendingUp, TrendingDown,
  Clock, MessageSquare, MessageCircle, FileText,
  Award, Flame, Zap, ArrowRight, Star, Shield
} from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ── Animated counter ──────────────────────────────────────────────────────────
function CountUp({ to, duration = 1400, suffix = '' }: { to: number; duration?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const steps = 60;
    const inc = to / steps;
    let cur = 0;
    let s = 0;
    const id = setInterval(() => {
      s++;
      cur = Math.min(to, Math.round(inc * s));
      setVal(cur);
      if (s >= steps) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [to, duration]);
  return <>{val}{suffix}</>;
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({
  icon, value, label, color, delay = 0
}: { icon: React.ReactNode; value: string | number; label: string; color: string; delay?: number }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={color}>{icon}</div>
      <span className="text-lg font-black text-white tracking-tight">{value}</span>
      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ── Podium card ───────────────────────────────────────────────────────────────
const PODIUM_CONFIG = [
  { rank: 2, label: 'Silver', height: 'h-24', badgeColor: 'from-zinc-300 to-zinc-400', textColor: 'text-zinc-300', glowColor: 'rgba(161,161,170,0.15)', borderColor: '#a1a1aa', delay: 200 },
  { rank: 1, label: 'Gold',   height: 'h-36', badgeColor: 'from-yellow-400 to-amber-500', textColor: 'text-yellow-400', glowColor: 'rgba(250,204,21,0.2)',  borderColor: '#facc15', delay: 0   },
  { rank: 3, label: 'Bronze', height: 'h-16', badgeColor: 'from-amber-600 to-orange-700', textColor: 'text-amber-600', glowColor: 'rgba(180,83,9,0.15)',   borderColor: '#b45309', delay: 400 },
];

function PodiumCard({ mp, config, visible }: { mp: MP; config: typeof PODIUM_CONFIG[0]; visible: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${config.delay}ms` }}
    >
      {/* Crown for #1 */}
      {config.rank === 1 && (
        <Crown className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
      )}

      {/* Photo */}
      <div className="relative">
        <div
          className="rounded-full overflow-hidden border-2"
          style={{
            width: config.rank === 1 ? 80 : 64,
            height: config.rank === 1 ? 80 : 64,
            borderColor: config.borderColor,
            boxShadow: `0 0 24px ${config.glowColor}`
          }}
        >
          <img src={mp.image_url} alt={mp.name} className="w-full h-full object-cover" />
        </div>
        {/* Rank badge */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-zinc-900 bg-gradient-to-br",
          config.badgeColor
        )}>
          {config.rank}
        </div>
      </div>

      {/* Name */}
      <div className="text-center space-y-0.5 max-w-[120px]">
        <p className={cn("text-xs font-black leading-tight", config.textColor)}>{mp.name.split(' ').slice(-1)[0]}</p>
        <p className="text-[9px] text-white/30 truncate">{mp.party}</p>
      </div>

      {/* Score */}
      <div
        className="px-3 py-1 rounded-full text-xs font-black"
        style={{ background: `${config.glowColor}`, color: config.borderColor, border: `1px solid ${config.borderColor}30` }}
      >
        {mp.overall_score} pts
      </div>

      {/* Podium block */}
      <div
        className={cn("w-24 rounded-t-lg flex items-center justify-center", config.height)}
        style={{
          background: `linear-gradient(180deg, ${config.glowColor} 0%, transparent 100%)`,
          border: `1px solid ${config.borderColor}20`,
          borderBottom: 'none'
        }}
      >
        <span className={cn("text-3xl font-black opacity-20", config.textColor)}>#{config.rank}</span>
      </div>
    </div>
  );
}

// ── Scan-line overlay (signature visual element) ──────────────────────────────
function ScanLines() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-[0.015]"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)',
        backgroundSize: '100% 3px'
      }}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [podiumVisible, setPodiumVisible] = useState(false);

  useEffect(() => {
    db.getMps({ sortBy: 'overall_score', sortOrder: 'desc' })
      .then(data => {
        setMps(data.filter(m => !m.is_minister));
        setLoading(false);
        setTimeout(() => setPodiumVisible(true), 300);
      })
      .catch(() => setLoading(false));
  }, []);

  // Aggregate stats
  const totalMps   = mps.length;
  const avgAttend  = mps.length ? Math.round(mps.reduce((s, m) => s + m.attendance_rate, 0) / mps.length) : 0;
  const totalQ     = mps.reduce((s, m) => s + m.questions_count, 0);
  const totalBills = mps.reduce((s, m) => s + m.bills_sponsored, 0);

  const champion = mps[0];
  const podiumOrder = [mps[1], mps[0], mps[2]]; // Silver | Gold | Bronze

  // Fake rank movement for drama (seeded from mp id so stable)
  const getRankMove = (mp: MP) => {
    const seed = parseInt(mp.id.replace('mp-', '')) % 11 - 5;
    return seed;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080810]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
            <Crown className="absolute inset-0 m-auto h-6 w-6 text-yellow-400" />
          </div>
          <p className="text-sm text-white/30 font-bold tracking-widest uppercase">Loading Arena</p>
        </div>
      </div>
    );
  }

  if (!champion) return null;

  const move = getRankMove(champion);

  return (
    <div className="space-y-0 max-w-5xl mx-auto w-full pb-20">

      {/* ── HERO — MP of the Week ───────────────────────────────────────────── */}
      <section className="relative rounded-3xl overflow-hidden mb-10">
        <ScanLines />

        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d1a] via-[#0a0a14] to-[#080810]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

        {/* Gold corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-yellow-500/30 rounded-tl-3xl" />
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-yellow-500/30 rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-yellow-500/20 rounded-bl-3xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-yellow-500/20 rounded-br-3xl" />

        {/* Gold gradient border */}
        <div className="absolute inset-0 rounded-3xl" style={{
          background: 'transparent',
          boxShadow: 'inset 0 0 0 1px rgba(250,204,21,0.15), 0 0 60px rgba(250,204,21,0.05)'
        }} />

        <div className="relative z-10 p-8 sm:p-10">

          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Flame className="h-3 w-3 text-yellow-400 animate-pulse" />
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">MP of the Week</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">18th Lok Sabha</span>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">

            {/* Photo block */}
            <div className="relative shrink-0">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full animate-pulse" style={{
                background: 'radial-gradient(circle, rgba(250,204,21,0.15) 0%, transparent 70%)',
                transform: 'scale(1.4)'
              }} />
              {/* Crown */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                <Crown className="h-9 w-9 text-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,0.8)]" />
              </div>
              {/* Photo */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden z-10" style={{
                border: '2px solid transparent',
                background: 'linear-gradient(#0d0d1a, #0d0d1a) padding-box, linear-gradient(135deg, #facc15, #f59e0b, #6366f1) border-box',
                boxShadow: '0 0 40px rgba(250,204,21,0.25), 0 0 80px rgba(99,102,241,0.15)'
              }}>
                <img src={champion.image_url} alt={champion.name} className="w-full h-full object-cover" />
              </div>
              {/* Score pill */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-sm font-black text-zinc-900 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>
                {champion.overall_score} pts
              </div>
            </div>

            {/* Text block */}
            <div className="flex-1 text-center lg:text-left space-y-5">
              {/* Rank movement */}
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black",
                  move > 0 ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : move < 0 ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-border border border-zinc-700 text-zinc-400"
                )}>
                  {move > 0 ? <TrendingUp className="h-3 w-3" /> : move < 0 ? <TrendingDown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {move > 0 ? `+${move}` : move < 0 ? `${move}` : 'Steady'} this week
                </div>
                <span className="text-[10px] text-white/20 font-bold">Rank #1</span>
              </div>

              {/* Name */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                  {champion.name}
                </h1>
                <p className="text-sm text-white/40 mt-2 font-medium">
                  {champion.constituency} · {champion.state}
                </p>
                <span className="inline-block mt-2 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
                  {champion.party}
                </span>
              </div>

              {/* Top topics */}
              {champion.top_topics?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center lg:justify-start">
                  <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest self-center">Focus areas</span>
                  {champion.top_topics.slice(0, 3).map(t => (
                    <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <StatChip icon={<Clock className="h-4 w-4" />} value={`${champion.attendance_rate}%`} label="Attendance" color="text-emerald-400" />
                <StatChip icon={<MessageSquare className="h-4 w-4" />} value={champion.questions_count} label="Questions" color="text-violet-400" delay={100} />
                <StatChip icon={<MessageCircle className="h-4 w-4" />} value={champion.debates_count} label="Debates" color="text-pink-400" delay={200} />
                <StatChip icon={<FileText className="h-4 w-4" />} value={champion.bills_sponsored} label="Bills" color="text-amber-400" delay={300} />
              </div>

              {/* CTA */}
              <Link
                href={`/mps/${champion.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-zinc-900 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(250,204,21,0.3)]"
                style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
              >
                <Trophy className="h-4 w-4" />
                View Champion Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── AGGREGATE STATS BAR ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { icon: <Award className="h-4 w-4" />, val: totalMps, suffix: '', label: 'Active MPs', color: 'text-indigo-400' },
          { icon: <Clock className="h-4 w-4" />, val: avgAttend, suffix: '%', label: 'Avg Attendance', color: 'text-emerald-400' },
          { icon: <MessageSquare className="h-4 w-4" />, val: totalQ, suffix: '', label: 'Total Questions', color: 'text-violet-400' },
          { icon: <FileText className="h-4 w-4" />, val: totalBills, suffix: '', label: 'Bills Sponsored', color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={s.label} className="rounded-2xl bg-card border border-zinc-800/60 p-4 text-center space-y-1">
            <div className={cn("flex justify-center", s.color)}>{s.icon}</div>
            <p className="text-2xl font-black text-white">
              <CountUp to={s.val} duration={1200 + i * 150} suffix={s.suffix} />
            </p>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── PODIUM ──────────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-black text-white tracking-tight">Top Performers</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/20 to-transparent" />
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-zinc-800/40 bg-gradient-to-b from-zinc-900/60 to-zinc-950 p-8">
          <ScanLines />
          {/* Floor line */}
          <div className="absolute bottom-[100px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />

          <div className="relative z-10 flex items-end justify-center gap-4 sm:gap-8">
            {podiumOrder.map((mp, i) => {
              if (!mp) return null;
              const cfg = PODIUM_CONFIG.find(c => c.rank === (i === 0 ? 2 : i === 1 ? 1 : 3))!;
              return <PodiumCard key={mp.id} mp={mp} config={cfg} visible={podiumVisible} />;
            })}
          </div>
        </div>
      </section>

      {/* ── RUNNERS UP LIST ─────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-black text-white/60 tracking-widest uppercase">Next in Line</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/20 to-transparent" />
        </div>

        <div className="space-y-2">
          {mps.slice(3, 8).map((mp, i) => {
            const rank = i + 4;
            const move = getRankMove(mp);
            return (
              <Link
                key={mp.id}
                href={`/mps/${mp.id}`}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-card border border-zinc-800/40 hover:border-indigo-500/30 hover:bg-card/40 transition-all group"
              >
                {/* Rank */}
                <span className="text-sm font-black text-white/20 w-5 text-center shrink-0">#{rank}</span>

                {/* Photo */}
                <img src={mp.image_url} alt={mp.name} className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0" />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white/80 truncate group-hover:text-white transition-colors">{mp.name}</p>
                  <p className="text-[10px] text-white/30 truncate">{mp.party} · {mp.state}</p>
                </div>

                {/* Move */}
                <div className={cn(
                  "flex items-center gap-0.5 text-[10px] font-black shrink-0",
                  move > 0 ? "text-emerald-400" : move < 0 ? "text-red-400" : "text-zinc-600"
                )}>
                  {move > 0 ? <TrendingUp className="h-3 w-3" /> : move < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                  {move > 0 ? `+${move}` : move !== 0 ? move : '—'}
                </div>

                {/* Score bar */}
                <div className="hidden sm:flex items-center gap-2 shrink-0 w-28">
                  <div className="flex-1 h-1.5 bg-card rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500/60 rounded-full" style={{ width: `${mp.overall_score}%` }} />
                  </div>
                  <span className="text-xs font-black text-indigo-400 w-8 text-right">{mp.overall_score}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      {/* ── EXPLORE DASHBOARD CTA ───────────────────────────────────────── */}
<section className="relative rounded-3xl overflow-hidden border border-zinc-800/50 bg-gradient-to-br from-[#0b0b18] via-[#090912] to-[#07070d]">

  {/* Background Glow */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.15),transparent_60%)]" />
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(79,70,229,0.12),transparent_55%)]" />

  {/* Border Glow */}
  <div className="absolute inset-0 rounded-3xl border border-indigo-500/10" />

  <ScanLines />

  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 px-10 py-14">

    {/* LEFT SIDE */}
    <div className="max-w-xl">

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-5">

        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />

        <span className="text-xs uppercase tracking-[0.25em] font-bold text-indigo-300">
          Interactive Dashboard
        </span>

      </div>

      <h2 className="text-4xl font-black text-white leading-tight">
        Explore India's Parliamentary Landscape
      </h2>

      <p className="mt-5 text-zinc-400 leading-7">
        Dive into the interactive dashboard to explore MPs state-wise,
        analyze attendance, questions, debates, bills,
        and discover parliamentary insights across all 544 Members of Parliament.
      </p>

      {/* Feature Pills */}

      <div className="flex flex-wrap gap-3 mt-8">

        <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm">
          🇮🇳 28 States
        </div>

        <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm">
          🏛 8 UTs
        </div>

        <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm">
          👥 544 MPs
        </div>

        <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm">
          📊 Live Insights
        </div>

      </div>

    </div>

    {/* RIGHT SIDE */}

    <div className="flex flex-col items-center">

      {/* Temporary Illustration */}

      <div className="w-80 h-52 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent flex items-center justify-center">

        <div className="text-center">

          <div className="text-7xl mb-4">
            🗺️
          </div>

          <p className="text-indigo-300 font-bold">
            Interactive India Map
          </p>

        </div>

      </div>

      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white transition-all hover:scale-105"
        style={{
          background:
            "linear-gradient(135deg,#4f46e5,#6366f1)",
          boxShadow:
            "0 0 35px rgba(99,102,241,.45)"
        }}
      >
        Open Dashboard
        <ArrowRight className="h-5 w-5" />
      </Link>

    </div>

  </div>

</section>

    </div>
  );
}
