'use client';

import { useLanguage } from '@/context/LanguageContext';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  X, Plus, Trophy, MessageSquare, MessageCircle, 
  FileText, Clock, TrendingUp, BarChart2, Users,
  ChevronDown, ChevronUp, Share2, Trash2,Vote
} from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, Radar
} from 'recharts';

const CANDIDATE_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#a855f7'];
const PARTY_COLORS: Record<string, string> = {
  'Bharatiya Janata Party': '#f97316',
  'Indian National Congress': '#3b82f6',
  'Samajwadi Party': '#ef4444',
  'All India Trinamool Congress': '#22c55e',
  'Aam Aadmi Party': '#06b6d4',
  'Dravida Munnetra Kazhagam': '#8b5cf6',
  'Telugu Desam Party': '#eab308',
  'Shiv Sena': '#f97316',
  'Janata Dal (United)': '#10b981',
};

function getPartyColor(party: string) {
  return PARTY_COLORS[party] || '#6b7280';
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-foreground w-8 text-right shrink-0">{value}</span>
      <div className="flex-1 h-1.5 bg-card rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function InsightRow({ icon, color, text }: { icon: React.ReactNode; color: string; text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-background/40 border border-border/60">
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5', color)}>
        {icon}
      </div>
      <p className="text-xs text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

export default function ElectionComparePage() {
  const { t } = useLanguage();
  const [allMps, setAllMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MP[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreMetrics, setShowMoreMetrics] = useState(false);

  useEffect(() => {
  db.getMps().then(mps => {
    setAllMps(mps);
    setLoading(false);
    // Default candidates for visualization
    const defaults = ['Rahul Gandhi', 'Amit Shah', 'Om Birla', 'Akhilesh Yadav', 'Asaduddin Owaisi'];
    const defaultMps = defaults
      .map(name => mps.find(mp => mp.name.toLowerCase().includes(name.toLowerCase())))
      .filter(Boolean) as MP[];
    if (defaultMps.length > 0) setSelected(defaultMps.slice(0, 5));
  });
}, []);
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return allMps
      .filter(mp => !selected.find(s => s.id === mp.id))
      .filter(mp =>
        mp.name.toLowerCase().includes(search.toLowerCase()) ||
        mp.constituency.toLowerCase().includes(search.toLowerCase()) ||
        mp.party.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 8);
  }, [search, allMps, selected]);

  const addCandidate = (mp: MP) => {
    if (selected.length >= 5) return;
    setSelected(prev => [...prev, mp]);
    setSearch('');
    setShowDropdown(false);
  };

  const removeCandidate = (id: string) => {
    setSelected(prev => prev.filter(mp => mp.id !== id));
  };

  // Aggregate stats
  const avgStats = useMemo(() => {
    if (selected.length === 0) return null;
    return {
      questions: Math.round(selected.reduce((s, m) => s + m.questions_count, 0) / selected.length),
      debates: Math.round(selected.reduce((s, m) => s + m.debates_count, 0) / selected.length),
      bills: Math.round(selected.reduce((s, m) => s + m.bills_sponsored, 0) / selected.length),
      attendance: Number((selected.reduce((s, m) => s + m.attendance_rate, 0) / selected.length).toFixed(1)),
      score: Number((selected.reduce((s, m) => s + m.overall_score, 0) / selected.length).toFixed(1)),
    };
  }, [selected]);

  // Best performers
  const bestIn = useMemo(() => {
    if (selected.length === 0) return null;
    return {
      questions: selected.reduce((a, b) => a.questions_count > b.questions_count ? a : b),
      debates: selected.reduce((a, b) => a.debates_count > b.debates_count ? a : b),
      bills: selected.reduce((a, b) => a.bills_sponsored > b.bills_sponsored ? a : b),
      attendance: selected.reduce((a, b) => a.attendance_rate > b.attendance_rate ? a : b),
      score: selected.reduce((a, b) => a.overall_score > b.overall_score ? a : b),
    };
  }, [selected]);

  // Max values for mini bars
  const maxValues = useMemo(() => ({
    questions: Math.max(...selected.map(m => m.questions_count), 1),
    debates: Math.max(...selected.map(m => m.debates_count), 1),
    bills: Math.max(...selected.map(m => m.bills_sponsored), 1),
    attendance: 100,
    score: 100,
  }), [selected]);

  // Party-wise average comparison
  const partyComparison = useMemo(() => {
    if (selected.length === 0) return [];
    const parties = [...new Set(selected.map(m => m.party))];
    return parties.map(party => {
      const partyMps = selected.filter(m => m.party === party);
      return {
        party: party.length > 12 ? party.slice(0, 12) + '…' : party,
        fullParty: party,
        Questions: Math.round(partyMps.reduce((s, m) => s + m.questions_count, 0) / partyMps.length),
        Debates: Math.round(partyMps.reduce((s, m) => s + m.debates_count, 0) / partyMps.length),
        Bills: Math.round(partyMps.reduce((s, m) => s + m.bills_sponsored, 0) / partyMps.length),
        Attendance: Number((partyMps.reduce((s, m) => s + m.attendance_rate, 0) / partyMps.length).toFixed(1)),
        Score: Number((partyMps.reduce((s, m) => s + m.overall_score, 0) / partyMps.length).toFixed(1)),
        color: getPartyColor(party),
      };
    });
  }, [selected]);

  // Activity distribution donut
  const activityDistribution = useMemo(() => {
    if (selected.length === 0) return [];
    const totalQ = selected.reduce((s, m) => s + m.questions_count, 0);
    const totalD = selected.reduce((s, m) => s + m.debates_count, 0);
    const totalB = selected.reduce((s, m) => s + m.bills_sponsored, 0);
    const total = totalQ + totalD + totalB || 1;
    return [
      { name: 'Questions Asked', value: Math.round((totalQ / total) * 100), color: '#6366f1' },
      { name: 'Debates', value: Math.round((totalD / total) * 100), color: '#f43f5e' },
      { name: 'Bills Introduced', value: Math.round((totalB / total) * 100), color: '#f59e0b' },
    ];
  }, [selected]);

  // Radar data for all candidates
  const radarData = useMemo(() => {
    const metrics = ['Questions', 'Debates', 'Bills', 'Attendance', 'Score'];
    return metrics.map(metric => {
      const row: Record<string, any> = { metric };
      selected.forEach(mp => {
        const val = metric === 'Questions' ? mp.questions_count
          : metric === 'Debates' ? mp.debates_count
          : metric === 'Bills' ? mp.bills_sponsored
          : metric === 'Attendance' ? mp.attendance_rate
          : mp.overall_score;
        row[mp.name.split(' ')[0]] = val;
      });
      return row;
    });
  }, [selected]);

  // Key insights
  const insights = useMemo(() => {
    if (selected.length < 2 || !bestIn) return [];
    const ins = [];
    const topQ = bestIn.questions;
    const secondQ = [...selected].sort((a, b) => b.questions_count - a.questions_count)[1];
    if (secondQ && secondQ.questions_count > 0) {
      const diff = Math.round(((topQ.questions_count - secondQ.questions_count) / secondQ.questions_count) * 100);
      ins.push({ icon: <MessageSquare className="h-3.5 w-3.5 text-white" />, color: 'bg-indigo-500/20', text: `${topQ.name} has asked ${diff}% more questions than the next candidate` });
    }
    ins.push({ icon: <Clock className="h-3.5 w-3.5 text-white" />, color: 'bg-emerald-500/20', text: `Highest attendance rate of ${bestIn.attendance.attendance_rate}% by ${bestIn.attendance.name}` });
    ins.push({ icon: <FileText className="h-3.5 w-3.5 text-white" />, color: 'bg-amber-500/20', text: `${bestIn.bills.name} introduced the most bills (${bestIn.bills.bills_sponsored} in this tenure)` });
    ins.push({ icon: <Trophy className="h-3.5 w-3.5 text-white" />, color: 'bg-violet-500/20', text: `${bestIn.score.name} leads overall with a performance score of ${bestIn.score.overall_score}` });
    return ins;
  }, [selected, bestIn]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
        <span className="mt-3 text-xs text-muted-foreground font-medium">{t.loadingCandidateData}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t.electionCandComp}</h1>
        <p className="text-sm text-muted-foreground">{t.selectUpTo5}</p>
      </div>

      {/* Candidate Selector */}
      <div className="flex flex-wrap gap-3 items-start">
        {selected.map((mp, i) => (
          <div key={mp.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 bg-card"
            style={{ borderColor: CANDIDATE_COLORS[i] }}>
            <img src={mp.image_url} alt={mp.name} className="w-8 h-8 rounded-full object-cover border border-border" />
            <div className="min-w-0">
              <p className="text-xs font-black text-foreground truncate max-w-[100px]">{mp.name}</p>
              <p className="text-[9px] font-bold truncate max-w-[100px]" style={{ color: CANDIDATE_COLORS[i] }}>
                {mp.party.split(' ').map(w => w[0]).join('').slice(0, 4)}
              </p>
            </div>
            <button onClick={() => removeCandidate(mp.id)} className="text-muted-foreground hover:text-rose-400 transition-colors ml-1">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {/* Add candidate */}
        {selected.length < 6 && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border bg-card hover:border-indigo-500/50 transition-colors text-muted-foreground hover:text-indigo-400"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs font-bold">{t.addCandidate}</span>
              <span className="text-[9px] text-muted-foreground">(Max 5)</span>
            </button>

            {showDropdown && (
              <div className="absolute top-full mt-2 left-0 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-border">
                  <input
                    autoFocus
                    type="text"
                    placeholder={t.searchMpByName}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.length > 0 ? searchResults.map(mp => (
                    <button key={mp.id} onClick={() => addCandidate(mp)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-background/60 transition-colors text-left">
                      <img src={mp.image_url} alt={mp.name} className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{mp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{mp.party} · {mp.constituency}</p>
                      </div>
                      <span className="text-[9px] font-black text-indigo-400 shrink-0">{mp.overall_score}</span>
                    </button>
                  )) : (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      {search ? 'No MPs found' : 'Start typing to search'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {selected.length > 0 && (
          <button onClick={() => setSelected([])}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-colors ml-auto">
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />}

      {selected.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-2xl space-y-3">
          <Users className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm font-bold text-muted-foreground">{t.addCandidatesToStart}</p>
          <p className="text-xs text-muted-foreground">{t.searchAndSelect}</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Overview KPI Cards */}
          {avgStats && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{t.overviewAvg}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { icon: <MessageSquare className="h-6 w-6 text-indigo-400" />, label: 'Questions Asked', value: avgStats.questions, color: 'bg-indigo-500/10' },
                  { icon: <MessageCircle className="h-6 w-6 text-pink-400" />, label: 'Debates Participated', value: avgStats.debates, color: 'bg-pink-500/10' },
                  { icon: <FileText className="h-6 w-6 text-amber-400" />, label: 'Bills Introduced', value: avgStats.bills, color: 'bg-amber-500/10' },
                  { icon: <Clock className="h-6 w-6 text-emerald-400" />, label: 'Attendance Rate', value: `${avgStats.attendance}%`, color: 'bg-emerald-500/10' },
                  { icon: <Trophy className="h-6 w-6 text-violet-400" />, label: 'Avg. Performance Score', value: avgStats.score, color: 'bg-violet-500/10' },
                ].map(stat => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics Comparison Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-black text-foreground">{t.keyMetricsComp}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.candidate}</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">{t.questions}</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">{t.debates}</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">{t.bills}</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">{t.attendanceTracker}</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">{t.score}</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((mp, i) => (
                    <tr key={mp.id} className="border-b border-border/50 hover:bg-background/40 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: CANDIDATE_COLORS[i] }} />
                          <img src={mp.image_url} alt={mp.name} className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{mp.name}</p>
                            <p className="text-[9px]" style={{ color: getPartyColor(mp.party) }}>{mp.party.split(' ').slice(0, 2).join(' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><MiniBar value={mp.questions_count} max={maxValues.questions} color={CANDIDATE_COLORS[i]} /></td>
                      <td className="px-4 py-3"><MiniBar value={mp.debates_count} max={maxValues.debates} color={CANDIDATE_COLORS[i]} /></td>
                      <td className="px-4 py-3"><MiniBar value={mp.bills_sponsored} max={maxValues.bills} color={CANDIDATE_COLORS[i]} /></td>
                      <td className="px-4 py-3"><MiniBar value={mp.attendance_rate} max={100} color={CANDIDATE_COLORS[i]} /></td>
                      <td className="px-4 py-3"><MiniBar value={mp.overall_score} max={100} color={CANDIDATE_COLORS[i]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showMoreMetrics && (
              <div className="px-6 py-4 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-4">
                {selected.map((mp, i) => (
                  <div key={mp.id} className="p-3 rounded-xl bg-background/40 border border-border/60 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CANDIDATE_COLORS[i] }} />
                      <p className="text-xs font-bold text-foreground truncate">{mp.name}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t.state} <span className="text-foreground font-bold">{mp.state}</span></p>
                    <p className="text-[10px] text-muted-foreground">{t.term} <span className="text-foreground font-bold">{mp.term}</span></p>
                    <p className="text-[10px] text-muted-foreground">{t.age} <span className="text-foreground font-bold">{mp.age ?? '—'}</span></p>
                    <p className="text-[10px] text-muted-foreground">{t.education} <span className="text-foreground font-bold">{mp.education ?? '—'}</span></p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowMoreMetrics(!showMoreMetrics)}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-muted-foreground hover:text-indigo-400 transition-colors border-t border-border">
              {showMoreMetrics ? <><ChevronUp className="h-3.5 w-3.5" /> Show Less</> : <><ChevronDown className="h-3.5 w-3.5" /> Show More Metrics</>}
            </button>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Performance Radar */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-black text-foreground">{t.perfRadar}</h2>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="metric" stroke="#888888" fontSize={9} />
                  {selected.map((mp, i) => (
                    <Radar key={mp.id} name={mp.name.split(' ')[0]} dataKey={mp.name.split(' ')[0]}
                      stroke={CANDIDATE_COLORS[i]} fill={CANDIDATE_COLORS[i]} fillOpacity={0.15} />
                  ))}
                  <Tooltip contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '10px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Activity Distribution */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-black text-foreground">{t.activityDist} <span className="text-muted-foreground font-normal text-xs">{t.avg}</span></h2>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie data={activityDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {activityDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '10px' }} formatter={(val) => [`${val}%`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {activityDistribution.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-muted-foreground flex-1">{item.name}</span>
                      <span className="text-[10px] font-black text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Best Performer */}
            {bestIn && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-black text-foreground">{t.bestPerformerIn}</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Questions', mp: bestIn.questions, icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-indigo-400' },
                    { label: 'Debates', mp: bestIn.debates, icon: <MessageCircle className="h-3.5 w-3.5" />, color: 'text-pink-400' },
                    { label: 'Bills Introduced', mp: bestIn.bills, icon: <FileText className="h-3.5 w-3.5" />, color: 'text-amber-400' },
                    { label: 'Attendance', mp: bestIn.attendance, icon: <Clock className="h-3.5 w-3.5" />, color: 'text-emerald-400' },
                    { label: 'Performance Score', mp: bestIn.score, icon: <Trophy className="h-3.5 w-3.5" />, color: 'text-violet-400' },
                  ].map(item => (
                    <Link key={item.label} href={`/mps/${item.mp.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/60 transition-colors group">
                      <div className={cn('shrink-0', item.color)}>{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-muted-foreground">{item.label}</p>
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-indigo-400 transition-colors">{item.mp.name}</p>
                      </div>
                      <img src={item.mp.image_url} alt={item.mp.name} className="w-7 h-7 rounded-full object-cover border border-border shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Party-wise Average + Key Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Party-wise bar chart */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-black text-foreground">{t.partyWiseAvg}</h2>
              {partyComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={partyComparison} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="party" stroke="#888888" fontSize={9} />
                    <YAxis stroke="#888888" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey={t.questions} fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey={t.debates} fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey={t.bills} fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">{t.addCandidatesFromDiff}</p>
              )}
              <p className="text-[9px] text-muted-foreground">{t.basedOnSelected}</p>
            </div>

            {/* Key Insights */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-black text-foreground">{t.keyInsights}</h2>
              <div className="space-y-2">
                {insights.map((ins, i) => (
                  <InsightRow key={i} icon={ins.icon} color={ins.color} text={ins.text} />
                ))}
                {insights.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t.addAtLeast2}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
            <p className="text-[10px] text-muted-foreground">
              Note: Data is based on PRS Legislative Research and Lok Sabha records. 18th Lok Sabha · 2024–Present
            </p>
            <p className="text-[10px] text-muted-foreground">Source: PRS India · loksabha.nic.in</p>
          </div>
        </div>
      )}
    </div>
  );
}
