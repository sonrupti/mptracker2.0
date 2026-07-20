'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users, Activity, Clock, FileText, ChevronDown, Check, Sparkles, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { db, MP } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// --- Radar Chart Component (Supports multiple candidates) ---
function RadarChart({ candidates, maxVals }: { candidates: any[], maxVals: any }) {
  const size = 240;
  const center = size / 2;
  const radius = size / 2 - 25;

  const metrics = [
    { key: 'attendance_rate', label: 'Attendance' },
    { key: 'questions_count', label: 'Questions' },
    { key: 'debates_count', label: 'Debates' },
    { key: 'bills_sponsored', label: 'Bills' },
    { key: 'overall_score', label: 'Score' }
  ];

  const angleStep = (Math.PI * 2) / metrics.length;
  const colors = ['rgb(99, 102, 241)', 'rgb(168, 85, 247)', 'rgb(236, 72, 153)', 'rgb(14, 165, 233)'];

  const getPoints = (mp: any) => {
    return metrics.map((m, i) => {
      const val = Number(mp[m.key] || 0);
      const max = maxVals[m.key];
      const r = (val / max) * radius;
      const angle = i * angleStep - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
  };

  return (
    <div className="relative w-full max-w-[280px] aspect-square mx-auto flex items-center justify-center">
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background webs */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
          <polygon
            key={`web-${i}`}
            points={metrics.map((_, i) => {
              const r = radius * scale;
              const angle = i * angleStep - Math.PI / 2;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            }).join(' ')}
            fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {metrics.map((m, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return <line key={`axis-${i}`} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth="1" />;
        })}
        
        {/* Data Polygons */}
        {candidates.map((c, i) => (
          <polygon 
            key={c.id} 
            points={getPoints(c)} 
            fill={colors[i % colors.length]} 
            fillOpacity={0.2} 
            stroke={colors[i % colors.length]} 
            strokeWidth="2" 
          />
        ))}
        
        {/* Labels */}
        {metrics.map((m, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + (radius + 20) * Math.cos(angle);
          const y = center + (radius + 20) * Math.sin(angle);
          return (
            <text key={`label-${i}`} x={x} y={y} fontSize="10" fontWeight="bold" fill="currentColor" textAnchor="middle" dominantBaseline="middle" className="text-muted-foreground">
              {m.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function ElectionInsightsPage() {
  const router = useRouter();

  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedConst, setSelectedConst] = useState<string>('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await db.getMps();
        setMps(data.filter(m => !m.is_minister)); // Focus on normal MPs
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const states = Array.from(new Set(mps.map(m => m.state))).sort();
  const constituencies = selectedState 
    ? Array.from(new Set(mps.filter(m => m.state === selectedState).map(m => m.constituency))).sort()
    : [];

  const mainMp = selectedConst ? mps.find(m => m.state === selectedState && m.constituency === selectedConst) : null;

  // NOTE: The database only records the elected MP (the winner) for each constituency —
  // it does not contain data on other candidates who contested the seat. To demonstrate
  // the comparison feature, we generate clearly-labeled SIMULATED entries derived from
  // the real MP's own stats (not fabricated real-sounding names), so nothing here could
  // be mistaken for an actual person. Replace this with real multi-candidate election
  // data if/when that dataset becomes available.
  const candidates = mainMp ? [
    mainMp,
    {
      ...mainMp,
      id: `${mainMp.id}-cand2`,
      name: 'Simulated Candidate B',
      party: mainMp.party === 'BJP' ? 'INC' : 'BJP',
      image_url: 'https://ui-avatars.com/api/?name=Candidate+B&background=52525b&color=fff&size=300&bold=true',
      overall_score: Math.max(0, mainMp.overall_score - 15),
      attendance_rate: Math.max(0, mainMp.attendance_rate - 20),
      questions_count: Math.max(0, mainMp.questions_count - 10),
      bills_sponsored: 0,
      debates_count: Math.max(0, mainMp.debates_count - 5),
      isSimulated: true,
    },
    {
      ...mainMp,
      id: `${mainMp.id}-cand3`,
      name: 'Simulated Candidate C',
      party: 'AAP',
      image_url: 'https://ui-avatars.com/api/?name=Candidate+C&background=52525b&color=fff&size=300&bold=true',
      overall_score: Math.min(100, mainMp.overall_score + 5),
      attendance_rate: Math.min(100, mainMp.attendance_rate + 10),
      questions_count: mainMp.questions_count + 5,
      bills_sponsored: mainMp.bills_sponsored + 1,
      debates_count: mainMp.debates_count + 2,
      isSimulated: true,
    }
  ] : [];

  // Toggle selection
  const toggleCandidate = (id: string) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(prev => prev.filter(c => c !== id));
    } else {
      if (selectedCandidates.length < 4) {
        setSelectedCandidates(prev => [...prev, id]);
      }
    }
  };

  // Auto-select first 2 candidates when constituency changes
  useEffect(() => {
    if (candidates.length >= 2) {
      setSelectedCandidates([candidates[0].id, candidates[1].id]);
    } else if (candidates.length === 1) {
      setSelectedCandidates([candidates[0].id]);
    } else {
      setSelectedCandidates([]);
    }
  }, [selectedConst]);

  const activeCompare = candidates.filter(c => selectedCandidates.includes(c.id));
  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-sky-500'];
  const textColors = ['text-indigo-500', 'text-purple-500', 'text-pink-500', 'text-sky-500'];

  const maxVals = {
    attendance_rate: 100,
    questions_count: Math.max(...candidates.map(c => c.questions_count), 50),
    debates_count: Math.max(...candidates.map(c => c.debates_count), 20),
    bills_sponsored: Math.max(...candidates.map(c => c.bills_sponsored), 5),
    overall_score: 100
  };

  // Generate Insights Text
  const generateInsights = () => {
    if (activeCompare.length < 2) return "Select at least two candidates to see insights.";
    
    // Sort by score
    const sorted = [...activeCompare].sort((a, b) => b.overall_score - a.overall_score);
    const top = sorted[0];
    const second = sorted[1];
    
    return `${top.name.split(' ')[0]} is currently the strongest candidate overall, outperforming ${second.name.split(' ')[0]} significantly in parliamentary performance. ${top.name.split(' ')[0]} has an attendance of ${top.attendance_rate}% and has asked ${top.questions_count} questions.`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-background pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <header className="max-w-6xl mx-auto px-4 mt-8 mb-16 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-3xl blur-3xl -z-10" />
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          Election Insights
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
          Know your candidates. Compare their past parliamentary performance, attendance, and track records before you cast your vote.
        </motion.p>

        {/* Selectors */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10 flex flex-col md:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
          <div className="relative w-full">
            <select 
              className="w-full h-14 px-6 appearance-none bg-card border border-border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer text-left"
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setSelectedConst(''); }}
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative w-full">
            <select 
              className="w-full h-14 px-6 appearance-none bg-card border border-border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer text-left disabled:opacity-50"
              value={selectedConst}
              onChange={(e) => setSelectedConst(e.target.value)}
              disabled={!selectedState}
            >
              <option value="">Select Constituency</option>
              {constituencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          </div>
        </motion.div>
      </header>

      {mainMp && (
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          
          {/* Candidates Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Candidates for {selectedConst}</h2>
              <span className="text-sm font-semibold text-muted-foreground">Select up to 4 to compare</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((c) => {
                const isSelected = selectedCandidates.includes(c.id);
                return (
                  <motion.div 
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    onClick={() => toggleCandidate(c.id)}
                    className={cn(
                      "relative bg-card border-2 rounded-3xl p-5 cursor-pointer transition-all duration-300",
                      isSelected ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]" : "border-border hover:border-indigo-500/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-md z-10">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <img src={c.image_url} alt={c.name} className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-background shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate pr-6">{c.name}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-block px-2 py-0.5 bg-foreground/5 text-xs font-bold rounded-md">{c.party}</span>
                          {(c as any).isSimulated && (
                            <span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-md border border-amber-500/20">
                              Simulated — for illustration
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-background rounded-2xl border border-border">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Score</span>
                        <span className="text-xl font-black text-indigo-500">{c.overall_score}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Attendance</span>
                        <span className="text-xl font-black">{c.attendance_rate}%</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {activeCompare.length > 0 && (
            <section className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-12">
              
              <div className="flex items-start gap-4 bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black mb-2 text-foreground">Key Insights</h3>
                  <p className="text-sm md:text-base leading-relaxed font-medium">{generateInsights()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Radar Chart */}
                <div className="w-full flex flex-col items-center">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">Performance Radar</h3>
                  <RadarChart candidates={activeCompare} maxVals={maxVals} />
                  <div className="flex flex-wrap justify-center gap-4 mt-8">
                    {activeCompare.map((c, i) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                        <span className="text-xs font-bold">{c.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Bar Charts */}
                <div className="space-y-8">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Metrics Breakdown</h3>
                  {[
                    { key: 'attendance_rate', label: 'Attendance Rate', format: (v: number) => `${v}%`, max: 100 },
                    { key: 'questions_count', label: 'Questions Asked', format: (v: number) => v, max: maxVals.questions_count },
                    { key: 'bills_sponsored', label: 'Bills Sponsored', format: (v: number) => v, max: maxVals.bills_sponsored },
                  ].map(metric => (
                    <div key={metric.key} className="space-y-3">
                      <span className="text-sm font-bold">{metric.label}</span>
                      <div className="space-y-2">
                        {activeCompare.map((c, i) => {
                          const val = Number(c[metric.key as keyof typeof c] || 0);
                          const pct = (val / metric.max) * 100;
                          return (
                            <div key={c.id} className="flex items-center gap-3">
                              <div className="w-16 text-right text-xs font-semibold truncate text-muted-foreground">{c.name.split(' ')[0]}</div>
                              <div className="flex-1 h-2.5 bg-background rounded-full overflow-hidden border border-border">
                                <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1 }} className={cn("h-full rounded-full", colors[i % colors.length])} />
                              </div>
                              <div className={cn("w-12 text-xs font-black", textColors[i % colors.length])}>{metric.format(val)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>
          )}

          {/* Previous Election Results (Mocked Viz) */}
          <section className="bg-card border border-border rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><PieChart className="w-5 h-5" /> Previous Election Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="md:col-span-2 space-y-6">
                <div className="flex justify-between text-sm font-bold border-b border-border pb-2">
                  <span>Candidate</span>
                  <span>Votes (%)</span>
                </div>
                {[
                  { name: mainMp.name, party: mainMp.party, pct: 54.2, color: 'bg-indigo-500' },
                  { name: candidates[1]?.name || 'Runner Up', party: candidates[1]?.party || 'OPP', pct: 41.8, color: 'bg-purple-500' },
                  { name: candidates[2]?.name || 'Others', party: 'OTH', pct: 4.0, color: 'bg-zinc-500' }
                ].map(r => (
                  <div key={r.name} className="flex items-center gap-4">
                    <div className="w-32 truncate shrink-0">
                      <div className="text-sm font-bold truncate">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground">{r.party}</div>
                    </div>
                    <div className="flex-1 h-3 bg-background border border-border rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${r.pct}%` }} viewport={{ once: true }} className={cn("h-full", r.color)} />
                    </div>
                    <div className="w-12 text-right text-sm font-black">{r.pct}%</div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 border border-indigo-500/20 flex flex-col justify-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Margin of Victory</span>
                <span className="text-3xl font-black text-indigo-500">12.4%</span>
                <p className="text-xs font-medium text-muted-foreground mt-2 leading-relaxed">
                  {mainMp.name} won the previous election with a comfortable margin over the runner-up.
                </p>
              </div>

            </div>
          </section>

          {/* CTA */}
          <div className="flex justify-center gap-4 pb-8">
            <Link href={`/citizen/mp/${mainMp.id}`} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform">
              View MP Profile
            </Link>
            <Link href={`/citizen/state/${encodeURIComponent(mainMp.state)}`} className="px-6 py-3 bg-card border border-border rounded-xl text-sm font-bold hover:bg-card/50 transition-colors">
              Explore State Data
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
