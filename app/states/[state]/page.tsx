'use client';
import { useLanguage } from '@/context/LanguageContext';
import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import {
  ArrowLeft,
  Users,
  Trophy,
  Clock,
  MessageSquare,
  MessageCircle,
  FileText,
  Search,
} from 'lucide-react';

import { db, MP } from '@/lib/supabase';
import ConstituencyMap from '@/components/ConstituencyMap';

function getTierStyle(percentile: number) {
  if (percentile >= 80) return { bar: 'bg-blue-600', text: 'text-blue-400', label: 'Top 20%', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20' };
  if (percentile >= 70) return { bar: 'bg-blue-400', text: 'text-blue-300', label: 'Top 30%', bg: 'bg-blue-400/8', ring: 'ring-blue-400/15' };
  if (percentile >= 60) return { bar: 'bg-cyan-500', text: 'text-cyan-400', label: 'Top 40%', bg: 'bg-cyan-500/8', ring: 'ring-cyan-500/15' };
  if (percentile >= 50) return { bar: 'bg-teal-400', text: 'text-teal-300', label: 'Above Avg', bg: 'bg-teal-400/6', ring: 'ring-teal-400/10' };
  if (percentile >= 40) return { bar: 'bg-yellow-500', text: 'text-yellow-400', label: 'Below Avg', bg: 'bg-yellow-500/6', ring: 'ring-yellow-500/10' };
  if (percentile >= 30) return { bar: 'bg-amber-500', text: 'text-amber-400', label: 'Bottom 40%', bg: 'bg-amber-500/8', ring: 'ring-amber-500/15' };
  if (percentile >= 20) return { bar: 'bg-orange-400', text: 'text-orange-300', label: 'Bottom 30%', bg: 'bg-orange-400/8', ring: 'ring-orange-400/15' };
  return { bar: 'bg-orange-600', text: 'text-orange-500', label: 'Bottom 20%', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' };
}

export default function StatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = use(params);
  const { t } = useLanguage();

 const STATE_NAME_ALIASES: Record<string, string> = {
    'Orissa': 'Odisha',
    'Pondicherry': 'Puducherry',
    'Uttaranchal': 'Uttarakhand',
  };

  const decodedState = useMemo(() => {
    const raw = decodeURIComponent(state)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return STATE_NAME_ALIASES[raw] ?? raw;
  }, [state]);

  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await db.getMps({
          region: decodedState,
          sortBy: 'overall_score',
          sortOrder: 'desc',
        });
        if (!cancelled) setMps(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [decodedState]);

  // Compute per-MP percentile within this state, then re-sort by score desc
  const mpsWithTier = useMemo(() => {
    const sorted = [...mps].sort((a, b) => a.overall_score - b.overall_score);
    const withPercentile = sorted.map((mp, i) => ({
      ...mp,
      percentile: sorted.length > 1 ? (i / (sorted.length - 1)) * 100 : 100,
    }));
    return withPercentile.sort((a, b) => b.overall_score - a.overall_score);
  }, [mps]);

  const filteredMps = useMemo(() => {
    if (!search) return mpsWithTier;
    const q = search.toLowerCase();
    return mpsWithTier.filter(
      (mp) =>
        mp.name.toLowerCase().includes(q) ||
        mp.party.toLowerCase().includes(q) ||
        mp.constituency.toLowerCase().includes(q)
    );
  }, [mpsWithTier, search]);

  const stats = useMemo(() => {
    if (mps.length === 0) {
      return {
        topMp: null as (MP & { percentile: number }) | null,
        avgAttendance: '0',
        avgQuestions: '0',
        totalQuestions: 0,
        totalDebates: 0,
        totalBills: 0,
      };
    }
    const topMp = mpsWithTier[0];
    const avgAttendance = (
      mps.reduce((s, m) => s + m.attendance_rate, 0) / mps.length
    ).toFixed(1);
    const avgQuestions = (
      mps.reduce((s, m) => s + m.questions_count, 0) / mps.length
    ).toFixed(1);
    const totalQuestions = mps.reduce((s, m) => s + m.questions_count, 0);
    const totalDebates = mps.reduce((s, m) => s + m.debates_count, 0);
    const totalBills = mps.reduce((s, m) => s + m.bills_sponsored, 0);
    return { topMp, avgAttendance, avgQuestions, totalQuestions, totalDebates, totalBills };
  }, [mps, mpsWithTier]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">
          Loading {decodedState} MPs...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      <Link
  href="/dashboard"
  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-indigo-400 transition-colors"
>
  <ArrowLeft className="h-4 w-4" />
  Back
</Link>

      {/* ===== TOP: Header ===== */}
      <div className="rounded-2xl border border-border bg-card p-8">
        <h1 className="text-4xl font-black text-foreground">{decodedState}</h1>
        <p className="text-muted-foreground mt-2">
          {mps.length} Member{mps.length !== 1 ? 's' : ''} of Parliament from {decodedState}
        </p>
      </div>

      {/* ===== TOP: Top performer, with state-average comparison ===== */}
      {stats.topMp && (
        <Link
          href={`/mps/${stats.topMp.id}`}
          className="block rounded-2xl border border-border bg-card p-6 hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-6">
            <img
              src={stats.topMp.image_url}
              className="w-24 h-24 rounded-full object-cover shrink-0"
              alt={stats.topMp.name}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-500 h-5 w-5 shrink-0" />
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">
                  Top Performer in {decodedState}
                </span>
              </div>
              <h2 className="text-2xl font-black text-foreground mt-1 truncate">
                {stats.topMp.name}
              </h2>
              <p className="text-muted-foreground truncate">
                {stats.topMp.party} · {stats.topMp.constituency}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  Attendance{' '}
                  <span className="font-bold text-foreground">
                    {stats.topMp.attendance_rate}%
                  </span>{' '}
                  <span className="text-emerald-400 font-semibold">
                    (state avg {stats.avgAttendance}%)
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Questions{' '}
                  <span className="font-bold text-foreground">
                    {stats.topMp.questions_count}
                  </span>{' '}
                  <span className="text-emerald-400 font-semibold">
                    (state avg {stats.avgQuestions})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ===== TOP: Key stat cards ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} title="MPs" value={mps.length} />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          title="Avg Attendance"
          value={`${stats.avgAttendance}%`}
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          title="Questions"
          value={stats.totalQuestions}
        />
        <StatCard
          icon={<MessageCircle className="h-5 w-5" />}
          title="Debates"
          value={stats.totalDebates}
        />
        <StatCard icon={<FileText className="h-5 w-5" />} title="Bills" value={stats.totalBills} />
      </div>

      {/* ===== BOTTOM: Constituency Performance grid (search-filterable) ===== */}
      <div className="pt-4 border-t border-border space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Constituency Performance</h2>
          <p className="text-sm text-muted-foreground">
            Performance ranking of all constituencies in {decodedState}
          </p>
          <ConstituencyMap stateName={decodedState} mps={mpsWithTier} />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by name, party, or constituency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            Top 20%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            Above Avg
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            Below Avg
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            Bottom 20%
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredMps.map((mp) => {
            const tier = getTierStyle(mp.percentile);
            return (
              <Link
                key={mp.id}
                href={`/mps/${mp.id}`}
                className={`rounded-xl border p-4 transition hover:scale-[1.03] ${tier.bg} ${tier.ring}`}
              >
                <div className={`h-2 rounded-full mb-3 ${tier.bar}`} />
                <h3 className="font-semibold text-sm truncate text-foreground">
                  {mp.constituency}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">{mp.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs font-bold ${tier.text}`}>{tier.label}</span>
                  <span className="text-xs font-bold text-indigo-400">{mp.overall_score}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredMps.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No results found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {title}
      </div>
      <div className="mt-3 text-3xl font-black text-foreground">{value}</div>
    </div>
  );
}