'use client';

import { useLanguage } from '@/context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import IndiaMap from '@/components/IndiaMap';
import { LogOut, MapPin, Users, Clock, MessageSquare, FileText, ChevronRight } from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import ParliamentActivityCalendar from '@/components/ParliamentActivityCalendar';
import Sidebar from "@/components/Sidebar";
function ComparisonBar({ label, stateVal, nationalVal, unit = '' }: { label: string; stateVal: number; nationalVal: number; unit?: string }) {
  const diff = nationalVal > 0 ? ((stateVal - nationalVal) / nationalVal) * 100 : 0;
  const clamped = Math.max(-50, Math.min(50, diff));
  const dotPosition = 50 + clamped;
  const higher = diff >= 0;

  return (
    <div className="space-y-2">
      <p className="text-xs">
        <span className={cn('font-bold', higher ? 'text-emerald-400' : 'text-rose-400')}>
          {Math.abs(diff).toFixed(0)}% {higher ? 'Higher' : 'Lower'}
        </span>{' '}
        <span className="text-muted-foreground">than national average — {label}</span>
      </p>
      <div className="relative h-1.5 bg-border rounded-full">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted-foreground/40" />
        <div
          className={cn('absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background', higher ? 'bg-emerald-400' : 'bg-rose-400')}
          style={{ left: `${dotPosition}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-widest">
        <span>Lower</span>
        <span>National Avg</span>
        <span>Higher</span>
      </div>
    </div>
  );
}


function BenchmarkPanel({
  stateName,
}: {
  stateName: string;
  stateAttendance: number;
  nationalAttendance: number;
  stateAvgQuestions: number;
  nationalAvgQuestions: number;
  stateAvgBills: number;
  nationalAvgBills: number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <ParliamentActivityCalendar stateName={stateName} />
    </div>
  );
}
interface CitizenData {
  name: string;
  age: string;
  state: string;
  gender: string;
  constituency: string;
  loggedIn: boolean;
}
interface NationalInsights {
  avgAttendance: number;
  totalQuestions: number;
  totalBills: number;
}
export default function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [citizen, setCitizen] = useState<CitizenData | null>(null);
  const [stateMps, setStateMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
 const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
useEffect(() => {
    setSelectedState('Uttar Pradesh'); // sensible default; user can pick another state via the map
  }, []);
 
  useEffect(() => {
    if (!selectedState) return;
    setLoading(true);
    db.getMps().then(all => {
      console.log('selectedState:', selectedState);
   console.log('sample mp.state values:', [...new Set(all.map(mp => mp.state))]);
      const normalizeState = (state: string) => {
  const value = state.toLowerCase().trim();

  const aliases: Record<string, string> = {
    "orissa": "odisha",

    "pondicherry": "puducherry",

    "j&k": "jammu and kashmir",
    "jammu & kashmir": "jammu and kashmir",
    "jammu kashmir": "jammu and kashmir",
  };

  return aliases[value] || value;
};


const filtered = all.filter(mp =>
  mp.state &&
  normalizeState(mp.state) === normalizeState(selectedState)
);
      setStateMps(filtered);
      setLoading(false);
    });
  }, [selectedState]);
  const [national, setNational] = useState<NationalInsights | null>(null);

  useEffect(() => {
    db.getAggregatedInsights().then((data: any) => {
      setNational({
        avgAttendance: data.avgAttendance,
        totalQuestions: data.totalQuestions,
        totalBills: data.totalBills,
      });
    });
  }, []);

 

  const avgAttendance = stateMps.length
    ? (stateMps.reduce((s, m) => s + m.attendance_rate, 0) / stateMps.length).toFixed(1)
    : '0';

  const totalQuestions = stateMps.reduce((s, m) => s + m.questions_count, 0);
  const totalBills = stateMps.reduce((s, m) => s + m.bills_sponsored, 0);
  const topMp = [...stateMps].sort((a, b) => b.overall_score - a.overall_score)[0];

  // Party breakdown
  const partyMap: Record<string, number> = {};
  stateMps.forEach(mp => {
    partyMap[mp.party] = (partyMap[mp.party] || 0) + 1;
  });
  const parties = Object.entries(partyMap).sort((a, b) => b[1] - a[1]);

 
return (
  <div className="flex min-h-screen bg-background">
    <Sidebar />

    <main className="flex-1 overflow-auto">

      {/* Top nav */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/Emblem.webp.webp" alt="LokLens" className="w-16 h-16 object-contain mx-auto"
  style={{ filter: 'brightness(0) invert(1)' }}></img>
          <span className="font-black text-lg text-foreground">Lok<span className="text-indigo-500">Lens</span></span>
        </div>
       <div className="flex items-center gap-4">
          <p className="text-xs text-muted-foreground">Explore Parliamentary Data</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Welcome */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">{t.parliamentSnapshot}</p>
          <h1 className="text-2xl font-black text-foreground">
            Explore MPs by State
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Viewing: <span className="text-foreground font-bold ml-1">{selectedState}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — State selector + stats */}
          <div className="lg:col-span-1 space-y-4">

            {/* State selector */}
            {/* India Map */}
<div className="bg-card border border-border rounded-xl p-3 space-y-2">
  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.clickYourState}</p>
  <IndiaMap
    selectedState={selectedState}
    onStateClick={(state) => {
      if (state) setSelectedState(state);
    }}
    className="!border-0 !bg-transparent !p-0"
  />
</div>

            {/* State KPIs */}
            {!loading && (
              <div className="space-y-3">
                {[
                  { icon: <Users className="h-4 w-4 text-indigo-400" />, label: 'Total MPs', value: stateMps.length },
                  { icon: <Clock className="h-4 w-4 text-emerald-400" />, label: 'Avg Attendance', value: `${avgAttendance}%` },
                  { icon: <MessageSquare className="h-4 w-4 text-violet-400" />, label: 'Total Questions', value: totalQuestions },
                  { icon: <FileText className="h-4 w-4 text-amber-400" />, label: 'Bills Sponsored', value: totalBills },
                ].map(stat => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stat.icon}
                      <span className="text-xs text-muted-foreground font-bold">{stat.label}</span>
                    </div>
                    <span className="text-lg font-black text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Party breakdown */}
            {!loading && parties.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.partyBreakdown}</p>
                {parties.slice(0, 5).map(([party, count]) => (
                  <div key={party} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground font-semibold truncate max-w-[160px]">{party}</span>
                      <span className="text-muted-foreground shrink-0">{count} MPs</span>
                    </div>
                    <div className="h-1.5 bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                        style={{ width: `${(count / stateMps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Top MP + MP list */}
          <div className="lg:col-span-2 space-y-4">

           {/* Benchmark Panel */}
            {!loading && national && (
              <BenchmarkPanel
                stateName={selectedState ?? ''}
                stateAttendance={Number(avgAttendance)}
                nationalAttendance={national.avgAttendance}
                stateAvgQuestions={stateMps.length ? totalQuestions / stateMps.length : 0}
                nationalAvgQuestions={national.totalQuestions / 544}
                stateAvgBills={stateMps.length ? totalBills / stateMps.length : 0}
                nationalAvgBills={national.totalBills / 544}
              />
            )}

            {/* MP list */}
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">All MPs from {selectedState}</p>
                  <Link
                    href={`/states/${selectedState?.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    View Full Page →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {stateMps.sort((a, b) => b.overall_score - a.overall_score).map(mp => (
                    <Link
                      key={mp.id}
                      href={`/mps/${mp.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-indigo-500/30 hover:bg-card/40 transition-all group"
                    >
                      <img src={mp.image_url} alt={mp.name} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-indigo-400 transition-colors">{mp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{mp.party}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{mp.constituency}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-indigo-400">{mp.overall_score}</p>
                        <p className="text-[9px] text-emerald-400">{mp.attendance_rate}%</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Go to full app */}
          {selectedState && (
  <Link
    href={`/states/${
      selectedState === "Odisha"
        ? "orissa"
        : selectedState.toLowerCase().replace(/\s+/g, "-")
    }`}
    className="mt-6 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 transition-colors"
  >
    View Complete {selectedState} Analysis →
  </Link>
)}
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
