'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MPLADSCard from '@/components/citizen/MPLADSCard';
import MPLADSDashboard from "@/components/mplads/MPLADSDashboard";
import {
  Clock, MessageSquare, FileText, Activity, MapPin, TrendingUp, Award, Calendar,
  LayoutGrid, Sparkles, ExternalLink, Wallet,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { db, MP, MPPerformanceHistory, MPBill, MPQuestion, MPDebate } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  PageLoader, ErrorBanner, BackButton, ScoreBadge, PartyLogo,
  Tabs,
} from '@/components/citizen/CitizenUI';
import AttendanceDetail from '@/components/mp/AttendanceDetail';

export default function MPProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [mp, setMp] = useState<MP | null>(null);
  const [history, setHistory] = useState<MPPerformanceHistory[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [related, setRelated] = useState<MP[]>([]);
  const [allMps, setAllMps] = useState<MP[]>([]);
  const [nationalTrend, setNationalTrend] = useState<{ year: number; avg_attendance_rate: number }[]>([]);
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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
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
  setSelectedTopic(null);

  Promise.all([
    db.getMpById(id),
    db.getMpHistory(id),
    db.getMpComparison(id),
    db.getMps(),
    db.getMpQuestions(id),
    db.getMpDebates(id),
    db.getMpBills(id),
    db.getNationalHistoryTrend(),
  ])
    .then(async ([mpData, historyData, compData, mpsData, questionsData, debatesData, billsData, nationalTrendData]) => {
      if (!mpData) {
        setError(true);
        return;
      }

      setMp(mpData);
      setHistory(historyData || []);
      setComparison(compData);
      setNationalTrend(nationalTrendData || []);

      if (mpsData && Array.isArray(mpsData)) {
        setAllMps(mpsData);
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

  const filteredQuestions = useMemo(() => {
    if (!selectedTopic) return questions;
    return questions.filter(
      q => q.category === selectedTopic || (q.keywords || []).includes(selectedTopic)
    );
  }, [questions, selectedTopic]);

  if (loading) return <PageLoader />;
  if (error || !mp) return <ErrorBanner message="This MP profile could not be loaded." onRetry={() => router.refresh()} />;

  const perfStatus =
    mp.overall_score >= 80
      ? { text: 'Excellent', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
      : mp.overall_score >= 60
      ? { text: 'Good', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' }
      : mp.overall_score >= 40
      ? { text: 'Average', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
      : { text: 'Below Avg', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };

 
const kpis = [
  {
    icon: Clock,
    label: "Attendance",
    value: `${mp.attendance_rate}%`,
    subtitle: `Attended about ${Math.round(mp.attendance_rate / 10)} of every 10 sittings`,
    percentile: 28,
    national: comparison?.india?.attendance_rate ?? 74.7,
    state: comparison?.state?.attendance_rate ?? 74.3,
    marker: mp.attendance_rate,
color: "text-orange-500",
  },

  {
    icon: MessageSquare,
    label: "Questions Raised",
    value: mp.questions_count,
    subtitle: `${mp.questions_count} questions raised in Parliament`,
    percentile: 84,
    national: comparison?.india?.questions_count ?? 23.3,
    state: comparison?.state?.questions_count ?? 27,
    marker: Math.min((mp.questions_count / 60) * 100, 100),
color: "text-orange-500",
  },

  {
    icon: Activity,
    label: "Debates",
    value: mp.debates_count,
    subtitle:
      mp.debates_count === 1
        ? "1 debate participated in"
        : `${mp.debates_count} debates participated in`,
    percentile: 37,
    national: comparison?.india?.debates_count ?? 5.5,
    state: comparison?.state?.debates_count ?? 6.3,
   marker: Math.min((mp.debates_count / 40) * 100, 100),
color: "text-orange-500",
  },

  {
    icon: FileText,
    label: "Bills Sponsored",
    value: mp.bills_sponsored,
    subtitle:
      mp.bills_sponsored === 0
        ? "No private member bills sponsored"
        : `${mp.bills_sponsored} private member bill${mp.bills_sponsored > 1 ? "s" : ""} sponsored`,
    percentile: 95,
    national: comparison?.india?.bills_sponsored ?? 0.1,
    state: comparison?.state?.bills_sponsored ?? 0,
   marker: Math.min((mp.bills_sponsored / 10) * 100, 100),
color: "text-orange-500",
  },
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
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-green-600/10 blur-3xl pointer-events-none" />

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
 <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {kpis.map((stat, i) => {
      const IconComponent = stat.icon;

      return (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.06 }}
         className="rounded-2xl border border-border/60 bg-card p-6 min-h-[250px] flex flex-col justify-between hover:border-orange-500/30 hover:shadow-lg transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </h3>

            <IconComponent
              className={cn("h-5 w-5", stat.color)}
            />
          </div>

          {/* Value */}
          <div className="text-5xl font-black leading-none">
            {stat.value}
          </div>

          {/* Subtitle */}
          <p className="mt-3 text-sm text-muted-foreground leading-5">
            {stat.subtitle}
          </p>

        <div className="relative mt-6 h-14">

  {/* Green bars */}
  <div className="flex items-end gap-1 h-full">
    {[18, 10, 8, 8, 20, 14, 6, 42].map((height, index) => (
      <div
        key={index}
        className="flex-1 bg-green-700 rounded-full"
        style={{ height }}
      />
    ))}
  </div>

  {/* Orange performance marker */}
  <div
    className="absolute bottom-0 w-[3px] bg-orange-500 rounded-full"
    style={{
      left: `${stat.marker}%`,
      height: "48px",
      transform: "translateX(-50%)",
    }}
  />

</div>

          {/* Bottom Text */}
          <p className="mt-4 text-xs font-semibold leading-5">
            <span className="text-orange-500">
              {stat.percentile}th percentile
            </span>

            <span className="text-muted-foreground">
              {" "}
              · Nat. avg {stat.national}
              {" "}
              · State avg {stat.state}
            </span>
          </p>
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
                <section className="bg-gradient-to-br from-orange-500/8 to-green-600/8 border border-orange-500/15 rounded-2xl p-5 md:p-7 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-orange-500" />
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
                      <TrendingUp className="w-5 h-5 text-orange-500" /> Performance Trend
                    </h2>
                    <div className="h-56 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                          <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                          <Line type="monotone" dataKey="overall_score" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} name="Overall Score" />
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
                          <div className="absolute w-2.5 h-2.5 bg-green-600 rounded-full -left-[6px] top-1 ring-2 ring-background" />
                          <span className="text-[10px] font-bold text-muted-foreground mb-1 block">{q.date} · Question to {q.ministry}</span>
                          <h3 className="text-sm font-semibold leading-snug line-clamp-2">{q.question_text}</h3>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {tab === 'attendance' && mounted && (
              <AttendanceDetail
                mp={mp}
                comparison={comparison}
                allMps={allMps}
                history={history}
                nationalTrend={nationalTrend}
              />
            )}

            {tab === 'questions' && (
              <>
                <section className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* "BY SCOPE" in the wireframe -- we don't have a scope
                      field on MPQuestion (only ministry/category), so this
                      shows the ministry breakdown instead and is labeled
                      honestly. */}
                  <div className="bg-card border border-border/60 rounded-2xl p-5 md:p-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                      By Ministry
                    </p>
                    {mounted && ministryBreakdown.length > 0 ? (
                      <div className="h-32 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ministryBreakdown} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={40} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                            <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-8 text-center">No ministry data yet.</p>
                    )}
                  </div>

                  <div className="bg-card border border-border/60 rounded-2xl p-5 md:p-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                      Answered vs Pending
                    </p>
                    <span className="text-4xl font-black tabular-nums block">{answeredCount}</span>
                    <span className="text-sm font-semibold text-muted-foreground">answered</span>
                    <p className="text-xs text-muted-foreground mt-3">
                      {Math.max(mp.questions_count - answeredCount, 0)} pending
                    </p>
                  </div>
                </section>

                {popularTopics.length > 0 && (
                  <section className="bg-card border border-border/60 rounded-2xl p-6">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                      Filter by Topic
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedTopic(null)}
                        className={cn(
                          'px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors',
                          selectedTopic === null
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-foreground/5 border-border/60 hover:border-orange-500/60'
                        )}
                      >
                        All
                      </button>
                      {popularTopics.map(t => (
                        <button
                          key={t}
                          onClick={() => setSelectedTopic(t === selectedTopic ? null : t)}
                          className={cn(
                            'px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors',
                            selectedTopic === t
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-foreground/5 border-border/60 hover:border-orange-500/60'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black">Questions</h2>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {filteredQuestions.length} question{filteredQuestions.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {filteredQuestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedTopic ? `No questions found for "${selectedTopic}".` : 'No questions on record for this MP.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredQuestions.slice(0, 8).map(q => {
                        const detailUrl = q.source_url || q.prs_url || q.official_url || q.link;
                        return (
                          <div key={q.id} className="p-4 bg-background rounded-xl border border-border/60">
                            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider">
                                  {q.category || 'General'}
                                </span>
                                {(q.ministry_name || q.ministry) && (
                                  <span className="px-2 py-0.5 rounded-full bg-foreground/5 border border-border/60 text-[10px] font-semibold text-muted-foreground">
                                    {q.ministry_name || q.ministry}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground shrink-0">{q.date}</span>
                            </div>

                            <p className="text-sm font-medium leading-snug line-clamp-2">{q.question_text}</p>

                            {detailUrl && (
                              <a
                                href={detailUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-400 mt-3"
                              >
                                Read full question &amp; ministry reply
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        );
                      })}
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
                              <a href={b.prs_bill_page_url} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400">
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
                <section className="bg-gradient-to-br from-orange-500/8 to-green-600/8 border border-orange-500/15 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-orange-500" />
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
                          <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.35} />
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
                    <span key={topic} className="px-3 py-1.5 rounded-lg bg-foreground/5 border border-border/60 text-xs font-semibold hover:border-orange-500/40 transition-colors">
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
                        <h3 className="text-sm font-semibold truncate group-hover:text-orange-500 transition-colors">{r.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{r.party}</p>
                      </div>
                      <ScoreBadge score={r.overall_score} size="sm" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-gradient-to-br from-orange-500 to-green-700 rounded-2xl p-6 text-white">
              <h2 className="text-sm font-black uppercase tracking-widest opacity-80 mb-4">Actions</h2>
              <div className="flex flex-col gap-2.5">
                <Link href={`/citizen/compare?mp1=${mp.id}`} className="w-full text-center px-4 py-2.5 bg-white text-orange-600 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all">
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