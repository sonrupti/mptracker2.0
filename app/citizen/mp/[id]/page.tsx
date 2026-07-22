'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MPLADSCard from '@/components/citizen/MPLADSCard';
import MPLADSDashboard from "@/components/mplads/MPLADSDashboard";
import {
  Clock, MessageSquare, FileText, Activity, MapPin, TrendingUp, Award, Calendar,
  LayoutGrid, CheckCircle2, HelpCircle, Sparkles, ExternalLink, Wallet,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { db, MP, MPPerformanceHistory, MPBill, MPQuestion, MPDebate } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  PageLoader, ErrorBanner, BackButton, ScoreBadge, PartyLogo,
  Tabs, BenchmarkRow, ComparisonChip,
} from '@/components/citizen/CitizenUI';

export default function MPProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [mp, setMp] = useState<MP | null>(null);
  const [history, setHistory] = useState<MPPerformanceHistory[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [related, setRelated] = useState<MP[]>([]);
  const [questions, setQuestions] = useState<MPQuestion[]>([]);
  const [debates, setDebates] = useState<MPDebate[]>([]);
  const [bills, setBills] = useState<MPBill[]>([]);

 const [mpladsRecommended, setMPLADSRecommended] = useState<any[]>([]);
const [mpladsCompleted, setMPLADSCompleted] = useState<any[]>([]);
const [mpladsExpenditure, setMPLADSExpenditure] = useState<any[]>([]);
const [mpladsLoading, setMPLADSLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('overview');
  
  // Prevent Recharts server hydration mismatches
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
  if (!id) return;

  setLoading(true);
  setError(false);
  setTab('overview');

  Promise.all([
    db.getMpById(id),
    db.getMpHistory(id),
    db.getMpComparison(id),
    db.getMps(),
    db.getMpQuestions(id),
    db.getMpDebates(id),
    db.getMpBills(id),
  ])
    .then(async ([mpData, historyData, compData, mpsData, questionsData, debatesData, billsData]) => {
      if (!mpData) {
        setError(true);
        return;
      }

      setMp(mpData);
      setHistory(historyData || []);
      setComparison(compData);

      if (mpsData && Array.isArray(mpsData)) {
        setRelated(
          mpsData
            .filter(m => m.state === mpData.state && m.id !== mpData.id)
            .slice(0, 3)
        );
      }

      setQuestions(questionsData || []);
      setDebates(debatesData || []);
      setBills(billsData || []);

     const [recommended, completed, expenditure] = await Promise.all([
  db.getMPLADSRecommended(mpData.id),
  db.getMPLADSCompleted(mpData.id),
  db.getMPLADSExpenditure(mpData.id),
]);

      setMPLADSRecommended(recommended || []);
      setMPLADSCompleted(completed || []);
      setMPLADSExpenditure(expenditure || []);
    })
    .catch(() => setError(true))
    .finally(() => {
      setLoading(false);
      setMPLADSLoading(false);
    });

}, [id]);
  const ministryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach(q => {
      const m = q.ministry_name || q.ministry || 'Other';
      counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [questions]);

  const popularTopics = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach(q => {
      (q.keywords || []).forEach(k => { counts[k] = (counts[k] || 0) + 1; });
      if (q.category) counts[q.category] = (counts[q.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name]) => name);
  }, [questions]);

  const answeredCount = useMemo(
    () => questions.filter(q => q.response_text || q.full_answer || q.answer_date).length,
    [questions]
  );

  if (loading) return <PageLoader />;
  if (error || !mp) return <ErrorBanner message="This MP profile could not be loaded." onRetry={() => router.refresh()} />;

  const perfStatus =
    mp.overall_score >= 80
      ? { text: 'Excellent', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
      : mp.overall_score >= 60
      ? { text: 'Good', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' }
      : mp.overall_score >= 40
      ? { text: 'Average', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
      : { text: 'Below Avg', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };

  const kpis = [
    { icon: Clock, label: 'Attendance', value: `${mp.attendance_rate}%`, color: 'text-emerald-500' },
    { icon: MessageSquare, label: 'Questions', value: mp.questions_count, color: 'text-violet-500' },
    { icon: Activity, label: 'Debates', value: mp.debates_count, color: 'text-sky-500' },
    { icon: FileText, label: 'Bills', value: mp.bills_sponsored, color: 'text-amber-500' },
  ];

  const successRate = mp.bills_sponsored > 0 ? Math.round((mp.bills_passed / mp.bills_sponsored) * 100) : 0;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'questions', label: 'Questions', icon: MessageSquare },
    { id: 'debates', label: 'Debates', icon: Activity },
    { id: 'bills', label: 'Bills', icon: FileText },
    { id: 'mplad', label: 'MPLAD Funds', icon: Wallet },
    { id: 'ai', label: 'AI Summary', icon: Sparkles },
  ];

  return (
    <div className="flex-1 w-full bg-background pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <BackButton onClick={() => router.back()} />
      </div>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-4 mt-8 mb-8">
        <div className="relative bg-card border border-border/60 rounded-[2rem] p-6 md:p-10 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="shrink-0 relative">
              <img
                src={mp.image_url || '/placeholder-avatar.png'}
                alt={mp.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-background shadow-2xl"
              />
              <div className="absolute top-1 right-1">
                <PartyLogo party={mp.party} size="lg" />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background border border-border shadow-md px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                <ScoreBadge score={mp.overall_score} size="sm" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Score</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{mp.name}</h1>
                <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 w-fit mx-auto md:mx-0', perfStatus.color)}>
                  <Award className="h-3 w-3" /> {perfStatus.text}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-5">
                <span className="px-2.5 py-1 rounded-full bg-foreground/5 text-foreground text-xs font-bold border border-border/60">{mp.party}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {mp.constituency}, {mp.state}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {mp.term || '18th Lok Sabha'}
                </span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {mp.ai_summary || `${mp.name} represents ${mp.constituency} in the 18th Lok Sabha.`}
              </p>
            </motion.div>
          </div>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {kpis.map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                className="p-5 rounded-2xl bg-card border border-border/60 flex flex-col justify-between hover:border-indigo-500/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  <IconComponent className={cn('h-4 w-4', stat.color)} />
                </div>
                <span className="text-2xl md:text-3xl font-black tabular-nums">{stat.value}</span>
              </motion.div>
            );
          })}
        </section>
      </div>

      {/* Tab navigation */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">

            {tab === 'overview' && (
              <>
                <section className="bg-gradient-to-br from-indigo-500/8 to-purple-500/8 border border-indigo-500/15 rounded-2xl p-5 md:p-7 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-black mb-1.5">Key Highlights</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {mp.name} has{' '}
                      <strong className="text-foreground">{mp.attendance_rate >= (comparison?.india?.attendance_rate || 75) ? 'above-average' : 'below-average'}</strong>{' '}
                      attendance, participated in <strong className="text-foreground">{mp.debates_count}</strong> debates, and asked{' '}
                      <strong className="text-foreground">{mp.questions_count}</strong> questions.
                      {mp.bills_sponsored > 0
                        ? ` They have also sponsored ${mp.bills_sponsored} private member bill${mp.bills_sponsored !== 1 ? 's' : ''}.`
                        : ''}
                    </p>
                  </div>
                </section>

                {mounted && history.length > 0 && (
                  <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" /> Performance Trend
                    </h2>
                    <div className="h-56 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                          <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                          <Line type="monotone" dataKey="overall_score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} name="Overall Score" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                  <h2 className="text-lg font-black mb-6">Recent Activity</h2>
                  {debates.length === 0 && questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No detailed activity data available for this MP.</p>
                  ) : (
                    <div className="space-y-5">
                      {debates.slice(0, 3).map(d => (
                        <div key={d.id} className="relative pl-6 border-l-2 border-border/40">
                          <div className="absolute w-2.5 h-2.5 bg-sky-500 rounded-full -left-[6px] top-1 ring-2 ring-background" />
                          <span className="text-[10px] font-bold text-muted-foreground mb-1 block">{d.date} · Debate</span>
                          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{d.title}</h3>
                        </div>
                      ))}
                      {questions.slice(0, 3).map(q => (
                        <div key={q.id} className="relative pl-6 border-l-2 border-border/40">
                          <div className="absolute w-2.5 h-2.5 bg-violet-500 rounded-full -left-[6px] top-1 ring-2 ring-background" />
                          <span className="text-[10px] font-bold text-muted-foreground mb-1 block">{q.date} · Question to {q.ministry}</span>
                          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{q.question_text}</h3>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {tab === 'attendance' && (
              <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                <h2 className="text-lg font-black mb-2">Attendance</h2>
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-4xl font-black tabular-nums">{mp.attendance_rate}%</span>
                  {comparison && <ComparisonChip value={mp.attendance_rate} benchmark={comparison.india.attendance_rate} />}
                </div>

                {comparison && (
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="p-4 bg-background rounded-xl border border-border/60 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">National Average</p>
                      <p className="text-xl font-black">{comparison.india.attendance_rate}%</p>
                    </div>
                    <div className="p-4 bg-background rounded-xl border border-border/60 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">State Average</p>
                      <p className="text-xl font-black">{comparison.state.attendance_rate}%</p>
                    </div>
                    <div className="p-4 bg-background rounded-xl border border-border/60 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Party Average</p>
                      <p className="text-xl font-black">{comparison.party.attendance_rate}%</p>
                    </div>
                  </div>
                )}

                {comparison && (
                  <BenchmarkRow
                    label="This MP"
                    value={mp.attendance_rate}
                    max={100}
                    format={v => `${v}%`}
                    benchmarks={[
                      { label: 'Party avg', value: comparison.party.attendance_rate, color: 'bg-purple-400/80' },
                      { label: 'State avg', value: comparison.state.attendance_rate, color: 'bg-zinc-400/70' },
                      { label: 'National avg', value: comparison.india.attendance_rate, color: 'bg-zinc-500/50' },
                    ]}
                  />
                )}

                {mounted && history.length > 0 && (
                  <div className="h-48 mt-8 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                        <Line type="monotone" dataKey="attendance_rate" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} name="Attendance %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            )}

            {tab === 'questions' && (
              <>
                <section className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="p-5 bg-card border border-border/60 rounded-2xl text-center">
                    <HelpCircle className="w-4 h-4 text-violet-500 mx-auto mb-2" />
                    <span className="text-2xl font-black block">{mp.questions_count}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Questions Asked</span>
                  </div>
                  <div className="p-5 bg-card border border-border/60 rounded-2xl text-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-2" />
                    <span className="text-2xl font-black block">{answeredCount}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Answered</span>
                  </div>
                </section>

                {mounted && ministryBreakdown.length > 0 && (
                  <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-black mb-6">Top Ministries</h2>
                    <div className="h-56 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ministryBreakdown} layout="vertical" margin={{ left: 10, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                          <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {popularTopics.length > 0 && (
                  <section className="bg-card border border-border/60 rounded-2xl p-6">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Popular Topics</h2>
                    <div className="flex flex-wrap gap-2">
                      {popularTopics.map(t => (
                        <span key={t} className="px-3 py-1.5 rounded-lg bg-foreground/5 border border-border/60 text-xs font-semibold">{t}</span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                  <h2 className="text-lg font-black mb-6">Recent Questions</h2>
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No questions on record for this MP.</p>
                  ) : (
                    <div className="space-y-3">
                      {questions.slice(0, 8).map(q => (
                        <div key={q.id} className="p-4 bg-background rounded-xl border border-border/60">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{q.ministry_name || q.ministry || 'General'}</span>
                            <span className="text-[10px] font-medium text-muted-foreground">{q.date}</span>
                          </div>
                          <p className="text-sm font-medium leading-snug line-clamp-2">{q.question_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {tab === 'debates' && (
              <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                <h2 className="text-lg font-black mb-2">Debates</h2>
                <p className="text-sm text-muted-foreground mb-6">{mp.debates_count} contributions on record in the 18th Lok Sabha.</p>
                {debates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No debate records available for this MP.</p>
                ) : (
                  <div className="space-y-3">
                    {debates.map(d => (
                      <div key={d.id} className="p-4 bg-background rounded-xl border border-border/60">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">{d.topic || d.debate_type || 'Debate'}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">{d.date}</span>
                        </div>
                        <h3 className="text-sm font-semibold leading-snug mb-1">{d.title}</h3>
                        {d.speech_snippet && <p className="text-xs text-muted-foreground line-clamp-2">{d.speech_snippet}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === 'bills' && (
              <>
                <section className="grid grid-cols-3 gap-3 md:gap-4">
                  <div className="p-5 bg-card border border-border/60 rounded-2xl text-center">
                    <span className="text-2xl font-black block">{mp.bills_sponsored}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sponsored</span>
                  </div>
                  <div className="p-5 bg-card border border-border/60 rounded-2xl text-center">
                    <span className="text-2xl font-black block">{mp.bills_passed}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Passed</span>
                  </div>
                  <div className="p-5 bg-card border border-border/60 rounded-2xl text-center">
                    <span className="text-2xl font-black block">{successRate}%</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Success Rate</span>
                  </div>
                </section>

                <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                  <h2 className="text-lg font-black mb-6">Bill Timeline</h2>
                  {bills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bill records available for this MP.</p>
                  ) : (
                    <div className="space-y-4">
                      {bills.map(b => (
                        <div key={b.id} className="relative pl-6 border-l-2 border-border/40">
                          <div className="absolute w-2.5 h-2.5 bg-amber-500 rounded-full -left-[6px] top-1 ring-2 ring-background" />
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-muted-foreground">{b.date_introduced || '—'}</span>
                            {b.status && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">{b.status}</span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold leading-snug flex items-center gap-1.5">
                            {b.title}
                            {b.prs_bill_page_url && (
                              <a href={b.prs_bill_page_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </h3>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

           {tab === "mplad" && (
  mpladsLoading ? (
    <PageLoader />
  ) : (
    <MPLADSDashboard
      mp={mp}
      recommended={mpladsRecommended}
      completed={mpladsCompleted}
      expenditure={mpladsExpenditure}
    />
  )
)}

            {tab === 'ai' && (
              <>
                <section className="bg-gradient-to-br from-indigo-500/8 to-purple-500/8 border border-indigo-500/15 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-black">AI Summary</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {mp.ai_summary || `${mp.name} represents ${mp.constituency} in the 18th Lok Sabha.`}
                  </p>
                </section>

                {mounted && mp.top_topics && mp.top_topics.length > 0 && mp.topic_scores && (
                  <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                    <h2 className="text-lg font-black mb-6">Topic Focus</h2>
                    <div className="h-64 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={mp.top_topics.slice(0, 6).map(t => ({ topic: t, score: mp.topic_scores?.[t] || 0 }))}>
                          <PolarGrid stroke="var(--border)" />
                          <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                          <PolarRadiusAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
                          <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          <div className="space-y-6">
            {mp.top_topics && mp.top_topics.length > 0 && (
              <section className="bg-card border border-border/60 rounded-2xl p-5">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Topics of Interest</h2>
                <div className="flex flex-wrap gap-2">
                  {mp.top_topics.map(topic => (
                    <span key={topic} className="px-3 py-1.5 rounded-lg bg-foreground/5 border border-border/60 text-xs font-semibold hover:border-indigo-500/40 transition-colors">
                      {topic}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {related.length > 0 && (
              <section className="bg-card border border-border/60 rounded-2xl p-5">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">From {mp.state}</h2>
                <div className="space-y-3">
                  {related.map(r => (
                    <Link key={r.id} href={`/citizen/mp/${r.id}`} className="flex items-center gap-3 group py-1">
                      <img src={r.image_url || '/placeholder-avatar.png'} alt={r.name} className="w-9 h-9 rounded-full object-cover border border-border" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate group-hover:text-indigo-500 transition-colors">{r.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{r.party}</p>
                      </div>
                      <ScoreBadge score={r.overall_score} size="sm" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h2 className="text-sm font-black uppercase tracking-widest opacity-80 mb-4">Actions</h2>
              <div className="flex flex-col gap-2.5">
                <Link href={`/citizen/compare?mp1=${mp.id}`} className="w-full text-center px-4 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all">
                  Compare with another MP
                </Link>
                <Link href={`/citizen/state/${encodeURIComponent(mp.state)}`} className="w-full text-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors">
                  Explore {mp.state}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}