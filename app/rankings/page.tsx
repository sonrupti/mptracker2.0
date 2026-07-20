'use client';

import { useLanguage } from '@/context/LanguageContext';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  MapPin, 
  Clock, 
  FileText, 
  MessageSquare, 
  MessageCircle, 
  Award,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type RankingMetric = 'overall_score' | 'attendance_rate' | 'questions_count' | 'debates_count' | 'bills_sponsored';

export default function RankingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [mps, setMps] = useState<MP[]>([]);
  const [activeMetric, setActiveMetric] = useState<RankingMetric>('overall_score');

  useEffect(() => {
    async function loadRankings() {
      setLoading(true);
      try {
        const sortedData = await db.getMps({
          sortBy: activeMetric,
          sortOrder: 'desc'
        });
        setMps(sortedData);
      } catch (err) {
        console.error('Failed to load rankings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRankings();
  }, [activeMetric]);

  const metrics = [
    { id: 'overall_score', label: 'Overall Score', icon: Award, color: 'text-indigo-400', unit: 'pts' },
    { id: 'attendance_rate', label: 'Attendance', icon: Clock, color: 'text-emerald-400', unit: '%' },
    { id: 'questions_count', label: 'Questions Asked', icon: MessageSquare, color: 'text-violet-400', unit: '' },
    { id: 'debates_count', label: 'Debates Count', icon: MessageCircle, color: 'text-pink-400', unit: '' },
    { id: 'bills_sponsored', label: 'Bills Sponsored', icon: FileText, color: 'text-amber-400', unit: '' }
  ];

  const getPartyBg = (party: string) => {
    switch (party) {
      case 'Labour': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'Conservative': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'SNP': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'Liberal Democrat': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'Green': return 'bg-green-500/10 border-green-500/20 text-green-400';
      default: return 'bg-zinc-500/10 border-zinc-500/20 text-muted-foreground';
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.15)] font-black scale-105';
      case 2:
        return 'bg-zinc-300/15 border-zinc-300/30 text-foreground font-extrabold';
      case 3:
        return 'bg-amber-600/15 border-amber-600/30 text-amber-500 font-bold';
      default:
        return 'bg-card border-border text-muted-foreground font-medium';
    }
  };

  const currentMetricInfo = metrics.find(m => m.id === activeMetric)!;

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Trophy className="h-7 w-7 text-indigo-400" />
          <span>{t.perfRankings}</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          National legislative leaderboard parsed by activity density, voting attendance, bills sponsored, and questions.
        </p>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-muted border border-border rounded-xl max-w-fit backdrop-blur-md">
        {metrics.map(metric => {
          const Icon = metric.icon;
          const isActive = activeMetric === metric.id;
          return (
            <button
              key={metric.id}
              onClick={() => setActiveMetric(metric.id as RankingMetric)}
              className={cn(
                "px-4 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 border border-transparent",
                isActive 
                  ? "bg-card text-indigo-400 border-border/80 shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-card/20"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? metric.color : "text-muted-foreground")} />
              <span>{metric.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table Content */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
            <span className="mt-3 text-xs text-muted-foreground">{t.calcStandings}</span>
          </div>
        ) : mps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse -w-[650pminx]"
>
              <thead>
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-card/30">
                  <th className="py-4 px-6 text-center w-16">{t.rank}</th>
                  <th className="py-4 px-4">{t.memberProfile}</th>
                  <th className="py-4 px-4">{t.constituency}</th>
                  <th className="py-4 px-4">{t.partyAffiliation}</th>
                  <th className="py-4 px-4 text-center">{t.scoreCard}</th>
                  <th className="py-4 px-6 text-right w-44">{currentMetricInfo.label}</th>
                </tr>
              </thead>
              <tbody className="text-xs text-foreground divide-y divide-zinc-900/50">
                {mps.map((mp, index) => {
                  const rank = index + 1;
                  const metricValue = mp[activeMetric as keyof MP] as string | number | null | undefined;
                  
                  return (
                    <tr 
                      key={mp.id} 
                      className={cn(
                        "hover:bg-muted/50 transition-colors group",
                        rank <= 3 ? "bg-card/10" : ""
                      )}
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-6 text-center">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center border text-xs shrink-0 mx-auto transition-transform",
                          getRankBadge(rank)
                        )}>
                          {rank}
                        </div>
                      </td>

                      {/* MP Profile */}
                      <td className="py-4 px-4">
                        <Link 
                          href={`/mps/${mp.id}`} 
                          className="flex items-center gap-3 group-hover:text-indigo-400 transition-colors max-w-fit"
                        >
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-border shrink-0">
                            <img src={mp.image_url} alt={mp.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground group-hover:text-indigo-400 transition-colors block">
                              {mp.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Office: {mp.active_term_years ?? '2024 – Present'}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Constituency */}
                      <td className="py-4 px-4">
                        <span className="font-medium text-foreground">{mp.constituency}</span>
                        <span className="text-[10px] text-muted-foreground block">{mp.region}</span>
                      </td>

                      {/* Party */}
                      <td className="py-4 px-4">
                        <span className={cn("text-[9px] px-2 py-0.5 rounded border font-semibold uppercase", getPartyBg(mp.party))}>
                          {mp.party}
                        </span>
                      </td>

                      {/* Aggregate score */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-foreground bg-muted border border-border px-2 py-0.5 rounded">
                          {mp.overall_score} pts
                        </span>
                      </td>

                      {/* Sorted metric value column */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <span className={cn("font-extrabold text-sm", rank <= 3 ? "text-indigo-300" : "text-foreground")}>
                           {metricValue ?? '—'}{currentMetricInfo.unit}
                          </span>
                          <Link 
                            href={`/mps/${mp.id}`}
                            className="p-1 rounded bg-muted border border-border opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-indigo-400 transition-all shadow-sm"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground text-xs font-medium">{t.noStandingsData}</div>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1 text-center sm:text-left flex-1">
          <h4 className="text-sm font-bold text-foreground">{t.howIsRank}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Standings are computed in real-time based on the sorted values of the active filter metric. In cases of identical scores, members share the higher rank index position. Ranks represent activity volumes, not policy outcomes.
          </p>
        </div>
      </div>
    </div>
  );
}
