'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, TrendingUp, Clock, MessageSquare, FileText } from 'lucide-react';
import { db } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface PartyStats {
  name: string;
  count: number;
  avgScore: number;
  avgAttendance: number;
  avgQuestions: number;
  avgDebates: number;
  avgBills: number;
}

export default function PartiesPage() {
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState<PartyStats[]>([]);
  const [sortBy, setSortBy] = useState<keyof PartyStats>('count');

  useEffect(() => {
    async function load() {
      try {
        const allMps = await db.getMps();

        const partyMap: Record<string, {
          count: number;
          totalScore: number;
          totalAttendance: number;
          totalQuestions: number;
          totalDebates: number;
          totalBills: number;
        }> = {};

        allMps.forEach(mp => {
          if (!partyMap[mp.party]) {
            partyMap[mp.party] = {
              count: 0,
              totalScore: 0,
              totalAttendance: 0,
              totalQuestions: 0,
              totalDebates: 0,
              totalBills: 0,
            };
          }
          partyMap[mp.party].count += 1;
          partyMap[mp.party].totalScore += mp.overall_score;
          partyMap[mp.party].totalAttendance += mp.attendance_rate;
          partyMap[mp.party].totalQuestions += mp.questions_count;
          partyMap[mp.party].totalDebates += mp.debates_count;
          partyMap[mp.party].totalBills += mp.bills_sponsored;
        });

        const result: PartyStats[] = Object.entries(partyMap).map(([name, data]) => ({
          name,
          count: data.count,
          avgScore: Number((data.totalScore / data.count).toFixed(1)),
          avgAttendance: Number((data.totalAttendance / data.count).toFixed(1)),
          avgQuestions: Number((data.totalQuestions / data.count).toFixed(1)),
          avgDebates: Number((data.totalDebates / data.count).toFixed(1)),
          avgBills: Number((data.totalBills / data.count).toFixed(1)),
        }));

        setParties(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sorted = [...parties].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
  const maxCount = sorted[0]?.count ?? 1;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
        <span className="mt-3 text-xs text-muted-foreground font-medium">Loading party data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">

      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-indigo-400 text-xs font-semibold transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Party Performance</h1>
        <p className="text-sm text-muted-foreground">Average parliamentary activity metrics across all parties in the 18th Lok Sabha.</p>
      </div>

      {/* Sort controls */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'count', label: 'MPs Count' },
          { key: 'avgScore', label: 'Avg Score' },
          { key: 'avgAttendance', label: 'Avg Attendance' },
          { key: 'avgQuestions', label: 'Avg Questions' },
          { key: 'avgDebates', label: 'Avg Debates' },
          { key: 'avgBills', label: 'Avg Bills' },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key as keyof PartyStats)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
              sortBy === opt.key
                ? 'bg-indigo-600 text-white'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Party Cards */}
      <div className="space-y-3">
        {sorted.map((party, i) => (
          <div key={party.name} className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-zinc-700 transition-colors">

            {/* Party name + rank */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-zinc-600 w-6">#{i + 1}</span>
                <div>
                  <p className="text-sm font-black text-foreground">{party.name}</p>
                  <p className="text-[10px] text-muted-foreground">{party.count} MPs in Lok Sabha</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-indigo-400">{party.avgScore}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">avg score</p>
              </div>
            </div>

            {/* Seat bar */}
            <div className="space-y-1">
              <div className="h-1.5 bg-card rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-700"
                  style={{ width: `${(party.count / maxCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Clock className="h-3 w-3 text-emerald-400" />, label: 'Avg Attendance', value: `${party.avgAttendance}%`, color: 'text-emerald-400' },
                { icon: <MessageSquare className="h-3 w-3 text-violet-400" />, label: 'Avg Questions', value: party.avgQuestions, color: 'text-violet-400' },
                { icon: <Users className="h-3 w-3 text-pink-400" />, label: 'Avg Debates', value: party.avgDebates, color: 'text-pink-400' },
                { icon: <FileText className="h-3 w-3 text-amber-400" />, label: 'Avg Bills', value: party.avgBills, color: 'text-amber-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-background/40 rounded-lg p-3 border border-border/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    {stat.icon}
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">{stat.label}</span>
                  </div>
                  <p className={cn('text-sm font-black', stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Link to filter MPs by party */}
            <Link
              href={`/mps?party=${encodeURIComponent(party.name)}`}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              View all {party.name} MPs →
            </Link>
          </div>
        ))}
      </div>

      {/* Data note */}
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-[10px] text-muted-foreground">
          Averages are calculated across all active MPs per party. Data source: PRS India · 18th Lok Sabha · 2024–Present
        </p>
      </div>

    </div>
  );
}