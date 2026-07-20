'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowLeft, ArrowRightLeft, Clock, MessageSquare, FileText, Activity, MapPin, Share2, Sparkles } from 'lucide-react';
import { db, MP, MPDebate, MPQuestion } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// --- Radar Chart Component ---
function SimpleRadar({ mpA, mpB, maxVals }: { mpA: MP, mpB: MP, maxVals: any }) {
  const size = 200;
  const center = size / 2;
  const radius = size / 2 - 20;

  const metrics = [
  { key: 'attendance_rate', label: 'Attendance' },
  { key: 'questions_count', label: 'Questions' },
  { key: 'debates_count', label: 'Debates' },
  { key: 'bills_sponsored', label: 'Bills' },
  { key: 'mplad_utilisation', label: 'MPLAD' }
];

  const angleStep = (Math.PI * 2) / metrics.length;

  const getPoints = (mp: MP) => {
    return metrics.map((m, i) => {
      const val = Number(mp[m.key as keyof MP] || 0);
      const max = maxVals[m.key];
      const r = (val / max) * radius;
      const angle = i * angleStep - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
  };

  const aPoints = getPoints(mpA);
  const bPoints = getPoints(mpB);

  return (
    <div className="relative w-[240px] h-[240px] mx-auto flex items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background webs */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
          <polygon
            key={i}
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
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth="1" />;
        })}
        {/* Data Polygons */}
        <polygon points={aPoints} fill="rgb(99, 102, 241)" fillOpacity={0.3} stroke="rgb(99, 102, 241)" strokeWidth="2" />
        <polygon points={bPoints} fill="rgb(168, 85, 247)" fillOpacity={0.3} stroke="rgb(168, 85, 247)" strokeWidth="2" />
        
        {/* Labels */}
        {metrics.map((m, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + (radius + 20) * Math.cos(angle);
          const y = center + (radius + 20) * Math.sin(angle);
          return (
            <text key={i} x={x} y={y} fontSize="10" fontWeight="bold" fill="currentColor" textAnchor="middle" dominantBaseline="middle" className="text-muted-foreground">
              {m.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}


function MPSearchSelect({ mps, selectedId, onSelect, placeholder, accent }: { mps: MP[], selectedId: string | null, onSelect: (id: string) => void, placeholder: string, accent: string }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedMp = mps.find(m => m.id === selectedId);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = mps.filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.constituency.toLowerCase().includes(query.toLowerCase()) || m.state.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

  return (
    <div className="relative w-full" ref={containerRef}>
      {selectedMp && !open ? (
        <div 
          onClick={() => { setOpen(true); setQuery(''); }}
          className={cn("flex items-center gap-3 p-3 rounded-xl border bg-card cursor-pointer hover:border-foreground/30 transition-colors", accent)}
        >
          <img src={selectedMp.image_url} className="w-10 h-10 rounded-full object-cover shrink-0 bg-background" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{selectedMp.name}</h3>
            <p className="text-[10px] text-muted-foreground truncate">{selectedMp.party} • {selectedMp.constituency}</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus={open}
            type="text"
            className={cn("w-full h-12 pl-10 pr-4 bg-background border rounded-xl focus:outline-none focus:ring-2", accent)}
            placeholder={placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">No MPs found.</div>
            ) : (
              filtered.map(mp => (
                <div 
                  key={mp.id} 
                  onClick={() => { onSelect(mp.id); setOpen(false); }}
                  className="flex items-center gap-3 p-3 hover:bg-background cursor-pointer transition-colors border-b border-border/50 last:border-0"
                >
                  <img src={mp.image_url} className="w-8 h-8 rounded-full object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{mp.name}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{mp.party} • {mp.constituency}</p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMp1 = searchParams.get('mp1');
  const initialMp2 = searchParams.get('mp2');

  const [mps, setMps] = useState<MP[]>([]);
  const [mp1Id, setMp1Id] = useState<string | null>(initialMp1);
  const [mp2Id, setMp2Id] = useState<string | null>(initialMp2);
  const [loading, setLoading] = useState(true);

  // Activity data
  const [activityA, setActivityA] = useState<{ debates: MPDebate[], questions: MPQuestion[] } | null>(null);
  const [activityB, setActivityB] = useState<{ debates: MPDebate[], questions: MPQuestion[] } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await db.getMps();
        setMps(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function fetchActivity(id: string, setter: any) {
      try {
        const [debates, questions] = await Promise.all([
          db.getMpDebates(id),
          db.getMpQuestions(id)
        ]);
        setter({ debates: debates || [], questions: questions || [] });
      } catch (e) {
        console.error(e);
      }
    }
    if (mp1Id) fetchActivity(mp1Id, setActivityA);
    if (mp2Id) fetchActivity(mp2Id, setActivityB);
  }, [mp1Id, mp2Id]);

  const mpA = mps.find(m => m.id === mp1Id);
  const mpB = mps.find(m => m.id === mp2Id);

  // Update URL silently
  useEffect(() => {
    if (mp1Id || mp2Id) {
      const params = new URLSearchParams();
      if (mp1Id) params.set('mp1', mp1Id);
      if (mp2Id) params.set('mp2', mp2Id);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  }, [mp1Id, mp2Id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  const maxVals = {
  attendance_rate: 100,
  questions_count: Math.max(mpA?.questions_count || 10, mpB?.questions_count || 10, 50),
  debates_count: Math.max(mpA?.debates_count || 5, mpB?.debates_count || 5, 20),
  bills_sponsored: Math.max(mpA?.bills_sponsored || 1, mpB?.bills_sponsored || 1, 5),
  mplad_utilisation: 100
};

  

 const generateInsights = () => {
  if (!mpA || !mpB) return [];

  const insights: string[] = [];

  // Attendance
  if (Math.abs(mpA.attendance_rate - mpB.attendance_rate) < 5) {
    insights.push("Both MPs have similar attendance records.");
  } else if (mpA.attendance_rate > mpB.attendance_rate) {
    insights.push(`${mpA.name} attended more parliamentary sittings.`);
  } else {
    insights.push(`${mpB.name} attended more parliamentary sittings.`);
  }

  // Questions
  if (Math.abs(mpA.questions_count - mpB.questions_count) < 20) {
    insights.push("Both MPs raised a comparable number of questions.");
  } else if (mpA.questions_count > mpB.questions_count) {
    insights.push(`${mpA.name} raised more parliamentary questions.`);
  } else {
    insights.push(`${mpB.name} raised more parliamentary questions.`);
  }

  // Debates
  if (Math.abs(mpA.debates_count - mpB.debates_count) < 5) {
    insights.push("Debate participation is similar.");
  } else if (mpA.debates_count > mpB.debates_count) {
    insights.push(`${mpA.name} participated in more debates.`);
  } else {
    insights.push(`${mpB.name} participated in more debates.`);
  }

  // Bills
  if (mpA.bills_sponsored === mpB.bills_sponsored) {
    insights.push("Both MPs sponsored the same number of bills.");
  } else if (mpA.bills_sponsored > mpB.bills_sponsored) {
    insights.push(`${mpA.name} sponsored more private member bills.`);
  } else {
    insights.push(`${mpB.name} sponsored more private member bills.`);
  }

  return insights;
};

  return (
    <div className="flex-1 w-full bg-background pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <header className="max-w-6xl mx-auto px-4 mt-8 mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Compare MPs</h1>
        <p className="text-muted-foreground font-medium">Evaluate two representatives side-by-side.</p>
        
        <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm max-w-3xl mx-auto">
          <MPSearchSelect mps={mps} selectedId={mp1Id} onSelect={setMp1Id} placeholder="Search first MP..." accent="border-indigo-500/50 focus:ring-indigo-500/50" />
          <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0 shadow-sm z-10 -my-4 md:-mx-4 md:my-0">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground rotate-90 md:rotate-0" />
          </div>
          <MPSearchSelect mps={mps} selectedId={mp2Id} onSelect={setMp2Id} placeholder="Search second MP..." accent="border-purple-500/50 focus:ring-purple-500/50" />
        </div>
      </header>

      {mpA && mpB && (
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          
          
<motion.section
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-card border border-border rounded-3xl p-6 md:p-8"
>
  <h2 className="text-xl font-black mb-4">
    Comparison Insights
  </h2>

  <p className="text-sm text-muted-foreground mb-6">
    These observations summarize publicly available parliamentary activity.
    They do not represent an overall judgement of performance.
  </p>

  <div className="space-y-3">
    {generateInsights().map((item, index) => (
      <div
        key={index}
        className="flex items-start gap-3 rounded-xl border border-border p-4"
      >
        <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
        <p className="text-sm">{item}</p>
      </div>
    ))}
  </div>
</motion.section>
          {/* Dual Profile Hero */}
          <section className="grid grid-cols-2 gap-4 md:gap-8">
            {[
              { mp: mpA, color: 'text-indigo-500', bg: 'bg-indigo-500' },
              { mp: mpB, color: 'text-purple-500', bg: 'bg-purple-500' }
            ].map(({ mp, color, bg }, i) => (
              <motion.div key={mp.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className={`absolute inset-0 opacity-5 ${bg}`} />
                <img src={mp.image_url} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-background shadow-lg relative z-10" />
                <h2 className="text-xl md:text-3xl font-black mt-4 relative z-10">{mp.name}</h2>
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1 ${color} relative z-10`}>{mp.party}</span>
                <span className="text-xs text-muted-foreground mt-1 relative z-10">{mp.constituency}, {mp.state}</span>
                
                <div className="mt-6 flex flex-col items-center relative z-10">
                  
                 
                </div>
              </motion.div>
            ))}
          </section>

          {/* Performance Comparison & Radar */}
          <section className="bg-card border border-border rounded-3xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              
              <div className="flex-1 w-full space-y-8">
                <h3 className="text-xl font-black mb-6">Metrics Showdown</h3>
                {[
                  { key: 'attendance_rate', label: 'Attendance Rate', max: 100, format: (v: number) => `${v}%` },
                  { key: 'questions_count', label: 'Questions Asked', max: maxVals.questions_count, format: (v: number) => v },
                  { key: 'debates_count', label: 'Debates Participated', max: maxVals.debates_count, format: (v: number) => v },
                  { key: 'bills_sponsored', label: 'Bills Sponsored', max: maxVals.bills_sponsored, format: (v: number) => v },
                ].map(metric => {
                  const valA = Number(mpA[metric.key as keyof MP] || 0);
                  const valB = Number(mpB[metric.key as keyof MP] || 0);
                  const pctA = (valA / metric.max) * 100;
                  const pctB = (valB / metric.max) * 100;
                  const winner = valA > valB ? 1 : valB > valA ? 2 : 0;

                  return (
                    <div key={metric.key} className="space-y-3">
                      <div className="flex justify-between text-sm font-bold">
                        <span className={winner === 1 ? 'text-indigo-500' : ''}>{metric.format(valA)}</span>
                        <span className="text-muted-foreground text-xs uppercase tracking-wider">{metric.label}</span>
                        <span className={winner === 2 ? 'text-purple-500' : ''}>{metric.format(valB)}</span>
                      </div>
                      <div className="flex items-center gap-2 h-2">
                        <div className="flex-1 bg-border rounded-l-full overflow-hidden flex justify-end h-full">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${pctA}%` }} viewport={{ once: true }} className="bg-indigo-500 h-full" />
                        </div>
                        <div className="w-0.5 h-4 bg-foreground/20 rounded-full shrink-0" />
                        <div className="flex-1 bg-border rounded-r-full overflow-hidden h-full">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${pctB}%` }} viewport={{ once: true }} className="bg-purple-500 h-full" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="w-full lg:w-[350px] shrink-0 border border-border/50 rounded-2xl p-6 bg-background/50 flex flex-col items-center">
                <h3 className="text-sm font-bold text-muted-foreground mb-4">Radar Analysis</h3>
                <SimpleRadar mpA={mpA} mpB={mpB} maxVals={maxVals} />
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500 opacity-60"/> <span className="text-xs font-semibold">{mpA.name.split(' ')[0]}</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500 opacity-60"/> <span className="text-xs font-semibold">{mpB.name.split(' ')[0]}</span></div>
                </div>
              </div>

            </div>
          </section>

        

          {/* Side-by-side Activity */}
          <section className="bg-card border border-border rounded-3xl p-6 md:p-8">
             <h2 className="text-xl font-black mb-8">Recent Parliament Activity</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
               
               {[
                 { act: activityA, color: 'bg-indigo-500', mp: mpA },
                 { act: activityB, color: 'bg-purple-500', mp: mpB }
               ].map(({ act, color, mp }) => (
                 <div key={mp.id} className="space-y-6">
                   <h3 className="text-sm font-bold border-b border-border pb-3">{mp.name}'s Activity</h3>
                   
                   {!act ? (
                     <div className="animate-pulse h-20 bg-foreground/5 rounded-xl" />
                   ) : (act.debates.length === 0 && act.questions.length === 0) ? (
                     <p className="text-xs text-muted-foreground">No recent activity found.</p>
                   ) : (
                     <div className="space-y-6">
                       {act.debates.slice(0,2).map(d => (
                         <div key={d.id} className="relative pl-5 border-l-2 border-border/50">
                           <div className={`absolute w-2.5 h-2.5 ${color} rounded-full -left-[5.5px] top-1`} />
                           <span className="text-[10px] font-bold text-muted-foreground mb-1 block">{d.date} • Debate</span>
                           <h4 className="text-sm font-semibold line-clamp-2 leading-snug">{d.title}</h4>
                         </div>
                       ))}
                       {act.questions.slice(0,2).map(q => (
                         <div key={q.id} className="relative pl-5 border-l-2 border-border/50">
                           <div className={`absolute w-2.5 h-2.5 ${color} rounded-full -left-[5.5px] top-1`} />
                           <span className="text-[10px] font-bold text-muted-foreground mb-1 block">{q.date} • Question</span>
                           <h4 className="text-sm font-semibold line-clamp-2 leading-snug">{q.question_text}</h4>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               ))}
               
             </div>
          </section>

          {/* CTAs */}
          <div className="flex justify-center gap-4 pt-8">
            <Link href={`/citizen/mp/${mpA.id}`} className="px-6 py-3 bg-card border border-border rounded-xl text-sm font-bold hover:bg-card/50 transition-colors">
              View {mpA.name.split(' ')[0]}
            </Link>
            <Link href={`/citizen/mp/${mpB.id}`} className="px-6 py-3 bg-card border border-border rounded-xl text-sm font-bold hover:bg-card/50 transition-colors">
              View {mpB.name.split(' ')[0]}
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}