'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  MessageCircle,
  Award,
  Sparkles,
  TrendingUp,
  Search,
  ExternalLink,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { db, MP, MPPerformanceHistory, MPTopic, MPBill, MPQuestion, MPDebate } from '@/lib/supabase';
type MpComparison = Awaited<ReturnType<typeof db.getMpComparison>>;
import { cn } from '@/lib/utils';

function DetailModal({ item, type, onClose }: { item: any; type: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
              {type === 'bill' ? 'Private Member Bill' : type === 'question' ? 'Parliamentary Question' : 'Debate'}
            </p>
            <h3 className="text-sm font-black text-foreground leading-snug">
              {type === 'bill' ? item.title : type === 'question' ? item.question_text : item.title}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg font-bold shrink-0">✕</button>
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          {type === 'question' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Ministry</p>
                  <p className="text-xs text-foreground font-bold mt-0.5">{item.category || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Type</p>
                  <p className="text-xs text-foreground font-bold mt-0.5">{item.type || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Date</p>
                  <p className="text-xs text-foreground font-bold mt-0.5">{item.date || '—'}</p>
                </div>
              </div>
              {item.source_url && item.source_url.startsWith('http') && (
                <a href={item.source_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors w-full justify-center">
                  View Full Question PDF →
                </a>
              )}
            </>
          )}
          {type === 'bill' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Status</p>
                  <p className="text-xs text-amber-400 font-bold mt-0.5">{item.status || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Date Introduced</p>
                  <p className="text-xs text-foreground font-bold mt-0.5">{item.date_introduced || '—'}</p>
                </div>
              </div>
              {item.source_url && item.source_url.startsWith('http') && (
                <a href={item.source_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors w-full justify-center">
                  View Bill PDF →
                </a>
              )}
            </>
          )}
          {type === 'debate' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Type</p>
                  <p className="text-xs text-foreground font-bold mt-0.5">{item.debate_type || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Date</p>
                  <p className="text-xs text-foreground font-bold mt-0.5">{item.date || '—'}</p>
                </div>
              </div>
              {item.source_url && item.source_url.startsWith('http') && (
                <a href={item.source_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-colors w-full justify-center">
                  View Debate →
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getSession(dateStr: string): string {
  if (!dateStr) return 'Unknown';

  let month: number, year: string;

  if (dateStr.includes('.')) {
    const parts = dateStr.split('.');
    month = parseInt(parts[1] || '0');
    year = parts[2] || '';
  } else {
    const parts = dateStr.split('-');
    month = parseInt(parts[1] || '0');
    year = parts[0] || '';
  }

  if (month >= 1 && month <= 5) return `Budget ${year}`;
  if (month >= 6 && month <= 9) return `Monsoon ${year}`;
  if (month >= 10 && month <= 12) return `Winter ${year}`;
  return `Unknown ${year}`;
}

function getYear(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  if (dateStr.includes('.')) return dateStr.split('.')[2] || 'Unknown';
  return dateStr.split('-')[0] || 'Unknown';
}

export default function MpDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [mp, setMp] = useState<MP | null>(null);
  const [history, setHistory] = useState<MPPerformanceHistory[]>([]);
  const [topics, setTopics] = useState<MPTopic[]>([]);
  const [bills, setBills] = useState<MPBill[]>([]);
  const [questions, setQuestions] = useState<MPQuestion[]>([]);
  const [debates, setDebates] = useState<MPDebate[]>([]);
  const [comparison, setComparison] = useState<MpComparison>(null);
  const [allMps, setAllMps] = useState<MP[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'bill' | 'question' | 'debate' | null>(null);
  const [activeTab, setActiveTab] = useState<'bills' | 'questions' | 'debates'>('bills');
  const [tabSearch, setTabSearch] = useState('');
  const [timelineView, setTimelineView] = useState<'year' | 'session'>('year');
  const [timelineType, setTimelineType] = useState<'questions' | 'debates'>('questions');

  useEffect(() => {
    async function loadMpData() {
      setLoading(true);
      try {
        const mpData = await db.getMpById(id);
        if (!mpData) { router.push('/mps'); return; }
        setMp(mpData);
        const [histData, topicData, billData, qData, dData, compData, allMpsData] = await Promise.all([
          db.getMpHistory(id),
          db.getMpTopics(id),
          db.getMpBills(id),
          db.getMpQuestions(id),
          db.getMpDebates(id),
          db.getMpComparison(id),
          db.getMps()
        ]);
        setHistory(histData);
        setTopics(topicData);
        setBills(billData);
        setQuestions(qData);
        setDebates(dData);
        setComparison(compData);
        setAllMps(allMpsData);
      } catch (err) {
        console.error('Error loading MP details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMpData();
  }, [id, router]);

  const getPartyBg = (party: string) => {
    switch (party) {
      case 'BJP': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'INC': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'AAP': return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
      case 'TMC': return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'SP': return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: return 'bg-zinc-500/10 border-zinc-500/20 text-muted-foreground';
    }
  };

  if (loading || !mp) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-125">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
        <span className="mt-4 text-sm text-muted-foreground font-medium">Assembling Member Dashboard...</span>
      </div>
    );
  }

  const radarData = topics.map(t => ({ subject: t.topic_name, Score: t.score }));
  const areaData = history.map(h => ({ name: h.year.toString(), Score: h.overall_score, Attendance: h.attendance_rate }));

  const filteredBills = bills.filter(b =>
    b.title.toLowerCase().includes(tabSearch.toLowerCase()) ||
    (b.description ?? '').toLowerCase().includes(tabSearch.toLowerCase())
  );
  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(tabSearch.toLowerCase()) ||
    (q.response_text?.toLowerCase() ?? '').includes(tabSearch.toLowerCase())
  );
  const filteredDebates = debates.filter(d =>
    d.title.toLowerCase().includes(tabSearch.toLowerCase()) ||
    (d.speech_snippet?.toLowerCase() ?? '').includes(tabSearch.toLowerCase())
  );

  // Build timeline data
  const buildTimelineData = () => {
    const source = timelineType === 'questions' ? questions : debates;
    const groupMap: Record<string, number> = {};
    source.forEach((item: any) => {
      const key = timelineView === 'year' ? getYear(item.date) : getSession(item.date);
      if (key && !key.includes('Unknown')) groupMap[key] = (groupMap[key] || 0) + 1;
    });
    return Object.entries(groupMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, Count: count }));
  };

  // Ministry breakdown from questions
  const ministryMap: Record<string, number> = {};
  questions.forEach((q: any) => {
    const m = q.category || 'Other';
    ministryMap[m] = (ministryMap[m] || 0) + 1;
  });
  const top5Ministries = Object.entries(ministryMap).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxMinistry = top5Ministries[0]?.[1] || 1;

  // Attendance comparison
  const stateAvg = allMps.filter(m => m.state === mp.state).length > 0
    ? allMps.filter(m => m.state === mp.state).reduce((s, m) => s + m.attendance_rate, 0) / allMps.filter(m => m.state === mp.state).length
    : 0;
  const indiaAvg = allMps.length > 0
    ? allMps.reduce((s, m) => s + m.attendance_rate, 0) / allMps.length
    : 0;
  const attendanceChartData = [
    { name: 'This MP', Attendance: mp.attendance_rate },
    { name: `${mp.state} Avg`, Attendance: Number(stateAvg.toFixed(1)) },
    { name: 'India Avg', Attendance: Number(indiaAvg.toFixed(1)) },
  ];
const activeSessions = new Set(
    [...questions, ...debates]
      .map((item: any) => getSession(item.date))
      .filter((s) => !s.includes('Unknown'))
  );
  const sessionCount = activeSessions.size || 1;
  const mpQuestionsPerSession = (mp.questions_count / sessionCount).toFixed(1);
  const stateQuestionsPerSession = comparison ? (comparison.state.questions_count / sessionCount).toFixed(1) : '0';
  const indiaQuestionsPerSession = comparison ? (comparison.india.questions_count / sessionCount).toFixed(1) : '0';

  
  const timelineData = buildTimelineData();

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {selectedItem && modalType && (
        <DetailModal item={selectedItem} type={modalType} onClose={() => { setSelectedItem(null); setModalType(null); }} />
      )}

      {/* Back Button */}
      <Link href="/mps" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-indigo-400 text-xs font-semibold transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Return to MP Directory</span>
      </Link>

      {/* MP Profile Header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-card p-6 sm:p-8 backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-indigo-500/20 shrink-0 shadow-xl">
            <img src={mp.image_url} alt={mp.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{mp.name}</h1>
                <span className={cn("text-[9px] px-2 py-0.5 rounded border font-semibold uppercase mt-0.5", getPartyBg(mp.party))}>{mp.party}</span>
                <span className="text-[9px] px-2 py-0.5 rounded border font-semibold uppercase mt-0.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400">Active</span>
                {mp.is_minister && (
                  <span className="text-[9px] px-2 py-0.5 rounded border font-semibold uppercase mt-0.5 bg-amber-500/10 border-amber-500/20 text-amber-400">Minister</span>
                )}
              </div>
              <p className="text-muted-foreground text-sm flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{mp.constituency}, {mp.state}</span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Since: {mp.start_of_term ?? '2024'}</span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1">{mp.term ?? 'First Term'}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground">
              {mp.prs_url && (
                <a href={mp.prs_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /><span>PRS India Profile</span>
                </a>
              )}
              {mp.gender && <span className="flex items-center gap-1.5"><span className="text-zinc-600">Gender:</span><span>{mp.gender}</span></span>}
              {mp.education && <span className="flex items-center gap-1.5"><span className="text-zinc-600">Education:</span><span>{mp.education}</span></span>}
              {mp.age && <span className="flex items-center gap-1.5"><span className="text-zinc-600">Age:</span><span>{mp.age}</span></span>}
            </div>
            {mp.top_topics && mp.top_topics.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {mp.top_topics.map(topic => (
                  <span key={topic} className="text-[9px] px-2 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 font-semibold">{topic}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
{/* At a Glance */}
      {comparison && (
        <div className="bg-muted/30 border border-zinc-900 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-black text-foreground">At a Glance</h2>
          </div>
          <div className="space-y-2 text-sm text-foreground leading-relaxed">
            <p>
              <span className="font-bold text-foreground">Attendance</span> is{' '}
              <span className={cn('font-bold', comparison.mp.attendance_rate >= comparison.state.attendance_rate ? 'text-emerald-400' : 'text-rose-400')}>
                {Math.abs(comparison.mp.attendance_rate - comparison.state.attendance_rate).toFixed(1)}%{' '}
                {comparison.mp.attendance_rate >= comparison.state.attendance_rate ? 'above' : 'below'}
              </span>{' '}
              the {comparison.state.label} average, and{' '}
              <span className={cn('font-bold', comparison.mp.attendance_rate >= comparison.india.attendance_rate ? 'text-emerald-400' : 'text-rose-400')}>
                {Math.abs(comparison.mp.attendance_rate - comparison.india.attendance_rate).toFixed(1)}%{' '}
                {comparison.mp.attendance_rate >= comparison.india.attendance_rate ? 'above' : 'below'}
              </span>{' '}
              the national average.
            </p>
            <p>
              <span className="font-bold text-foreground">Questions asked</span> ({comparison.mp.questions_count} total) is{' '}
              <span className={cn('font-bold', comparison.mp.questions_count >= comparison.state.questions_count ? 'text-emerald-400' : 'text-rose-400')}>
                {comparison.mp.questions_count >= comparison.state.questions_count ? 'higher than' : 'lower than'}
              </span>{' '}
              the {comparison.state.label} average ({comparison.state.questions_count}), and{' '}
              <span className={cn('font-bold', comparison.mp.questions_count >= comparison.india.questions_count ? 'text-emerald-400' : 'text-rose-400')}>
                {comparison.mp.questions_count >= comparison.india.questions_count ? 'higher than' : 'lower than'}
              </span>{' '}
              the national average ({comparison.india.questions_count}).
            </p>
            <p>
              <span className="font-bold text-foreground">Questions per session</span> averages{' '}
              <span className="font-bold text-foreground">{mpQuestionsPerSession}</span>{' '}
              (based on {sessionCount} active session{sessionCount !== 1 ? 's' : ''}), compared to a{' '}
              {comparison.state.label} average of{' '}
              <span className="font-bold text-foreground">{stateQuestionsPerSession}</span>, and a national
              average of <span className="font-bold text-foreground">{indiaQuestionsPerSession}</span>.
            </p>
          </div>
          <p className="text-[10px] text-zinc-600 pt-2 border-t border-zinc-900">
            Numbers reflect total activity to date, not adjusted for number of sessions attended.
          </p>
        </div>
      )}
       {/* KPI Cards Grid */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

  {/* Attendance */}
  <div className="glow-card bg-card border border-zinc-900 p-5 rounded-xl flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Attendance
      </span>
      <Clock className="h-4 w-4 text-emerald-400" />
    </div>

    <div className="mt-4">
      <h3 className="text-3xl font-bold text-foreground">
        {mp.attendance_rate}%
      </h3>

      {comparison && (
        <div className="mt-2 space-y-1 text-[10px]">

          <p
            className={cn(
              "font-semibold",
              comparison.mp.attendance_rate >= comparison.state.attendance_rate
                ? "text-emerald-400"
                : "text-rose-400"
            )}
          >
            {comparison.mp.attendance_rate >= comparison.state.attendance_rate
              ? `▲ ${Math.abs(
                  comparison.mp.attendance_rate -
                    comparison.state.attendance_rate
                ).toFixed(1)}% vs State`
              : `▼ ${Math.abs(
                  comparison.mp.attendance_rate -
                    comparison.state.attendance_rate
                ).toFixed(1)}% vs State`}
          </p>

          <p
            className={cn(
              "font-semibold",
              comparison.mp.attendance_rate >= comparison.india.attendance_rate
                ? "text-emerald-400"
                : "text-rose-400"
            )}
          >
            {comparison.mp.attendance_rate >= comparison.india.attendance_rate
              ? `▲ ${Math.abs(
                  comparison.mp.attendance_rate -
                    comparison.india.attendance_rate
                ).toFixed(1)}% vs India`
              : `▼ ${Math.abs(
                  comparison.mp.attendance_rate -
                    comparison.india.attendance_rate
                ).toFixed(1)}% vs India`}
          </p>

        </div>
      )}
    </div>
  </div>

  {/* Questions */}
  <Link href={`/mps/${id}/questions`}>
    <div className="glow-card bg-card border border-zinc-900 p-5 rounded-xl cursor-pointer hover:border-violet-500 transition flex flex-col justify-between">

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">
          Questions
        </span>

        <MessageSquare className="h-4 w-4 text-violet-400" />
      </div>

      <div className="mt-4">

        <h3 className="text-3xl font-bold text-foreground">
          {mp.questions_count}
        </h3>

        {comparison && (
          <div className="mt-2 space-y-1 text-[10px]">

            <p
              className={cn(
                "font-semibold",
                comparison.mp.questions_count >= comparison.state.questions_count
                  ? "text-emerald-400"
                  : "text-rose-400"
              )}
            >
              {comparison.mp.questions_count >= comparison.state.questions_count
                ? `▲ ${comparison.mp.questions_count - comparison.state.questions_count} vs State`
                : `▼ ${comparison.state.questions_count - comparison.mp.questions_count} vs State`}
            </p>

            <p
              className={cn(
                "font-semibold",
                comparison.mp.questions_count >= comparison.india.questions_count
                  ? "text-emerald-400"
                  : "text-rose-400"
              )}
            >
              {comparison.mp.questions_count >= comparison.india.questions_count
                ? `▲ ${comparison.mp.questions_count - comparison.india.questions_count} vs India`
                : `▼ ${comparison.india.questions_count - comparison.mp.questions_count} vs India`}
            </p>

          </div>
        )}

      </div>

    </div>
  </Link>

  {/* Debates */}
  <Link href={`/mps/${id}/debates`}>
    <div className="glow-card bg-card border border-zinc-900 p-5 rounded-xl cursor-pointer hover:border-pink-500 transition flex flex-col justify-between">

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">
          Debates
        </span>

        <MessageCircle className="h-4 w-4 text-pink-400" />
      </div>

      <div className="mt-4">

        <h3 className="text-3xl font-bold text-foreground">
          {mp.debates_count}
        </h3>

        {comparison && (
          <div className="mt-2 space-y-1 text-[10px]">

            <p
              className={cn(
                "font-semibold",
                comparison.mp.debates_count >= comparison.state.debates_count
                  ? "text-emerald-400"
                  : "text-rose-400"
              )}
            >
              {comparison.mp.debates_count >= comparison.state.debates_count
                ? `▲ ${comparison.mp.debates_count - comparison.state.debates_count} vs State`
                : `▼ ${comparison.state.debates_count - comparison.mp.debates_count} vs State`}
            </p>

            <p
              className={cn(
                "font-semibold",
                comparison.mp.debates_count >= comparison.india.debates_count
                  ? "text-emerald-400"
                  : "text-rose-400"
              )}
            >
              {comparison.mp.debates_count >= comparison.india.debates_count
                ? `▲ ${comparison.mp.debates_count - comparison.india.debates_count} vs India`
                : `▼ ${comparison.india.debates_count - comparison.mp.debates_count} vs India`}
            </p>

          </div>
        )}

      </div>

    </div>
  </Link>

  {/* Bills */}
  <Link href={`/mps/${id}/bills`}>
    <div className="glow-card bg-card border border-zinc-900 p-5 rounded-xl cursor-pointer hover:border-amber-500 transition flex flex-col justify-between">

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">
          Bills
        </span>

        <FileText className="h-4 w-4 text-amber-400" />
      </div>

      <div className="mt-4">

        <h3 className="text-3xl font-bold text-foreground">
          {mp.bills_sponsored}
        </h3>

        {comparison && (
          <div className="mt-2 space-y-1 text-[10px]">

            <p
              className={cn(
                "font-semibold",
                comparison.mp.bills_sponsored >= comparison.state.bills_sponsored
                  ? "text-emerald-400"
                  : "text-rose-400"
              )}
            >
              {comparison.mp.bills_sponsored >= comparison.state.bills_sponsored
                ? `▲ ${comparison.mp.bills_sponsored - comparison.state.bills_sponsored} vs State`
                : `▼ ${comparison.state.bills_sponsored - comparison.mp.bills_sponsored} vs State`}
            </p>

            <p
              className={cn(
                "font-semibold",
                comparison.mp.bills_sponsored >= comparison.india.bills_sponsored
                  ? "text-emerald-400"
                  : "text-rose-400"
              )}
            >
              {comparison.mp.bills_sponsored >= comparison.india.bills_sponsored
                ? `▲ ${comparison.mp.bills_sponsored - comparison.india.bills_sponsored} vs India`
                : `▼ ${comparison.india.bills_sponsored - comparison.mp.bills_sponsored} vs India`}
            </p>

          </div>
        )}

      </div>

    </div>
  </Link>

</div>

      {/* State vs India Comparison */}
      {comparison && (
        <div className="bg-muted/30 border border-zinc-900 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-black text-foreground">How does this MP compare?</h2>
          </div>
          <div className="grid grid-cols-4 gap-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1">
            <span>Metric</span>
            <span className="text-center text-indigo-400">This MP</span>
            <span className="text-center text-emerald-400">{comparison.state.label} Avg</span>
            <span className="text-center text-amber-400">India Avg</span>
          </div>
          {[
            { label: 'Attendance %', mp: comparison.mp.attendance_rate, state: comparison.state.attendance_rate, india: comparison.india.attendance_rate },
            { label: 'Questions', mp: comparison.mp.questions_count, state: comparison.state.questions_count, india: comparison.india.questions_count },
            { label: 'Debates', mp: comparison.mp.debates_count, state: comparison.state.debates_count, india: comparison.india.debates_count },
            { label: 'Bills', mp: comparison.mp.bills_sponsored, state: comparison.state.bills_sponsored, india: comparison.india.bills_sponsored },
          ].map(row => (
            <div key={row.label} className="grid grid-cols-4 gap-4 items-center px-1 py-2 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className={cn('text-center text-sm font-black', row.mp >= row.india ? 'text-indigo-400' : 'text-rose-400')}>{row.mp}</span>
              <span className="text-center text-sm font-bold text-emerald-400">{row.state}</span>
              <span className="text-center text-sm font-bold text-amber-400">{row.india}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-zinc-900 text-xs text-muted-foreground">
            <span className="text-indigo-400 font-bold">↑</span> above India avg &nbsp;|&nbsp;
            <span className="text-rose-400 font-bold">↓</span> below India avg
          </div>
        </div>
      )}

      {/* Activity Timeline — Full GitHub-style */}
      <div className="bg-muted/30 border border-zinc-900 rounded-xl p-6 space-y-6">
        {/* Header + controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-black text-foreground">Activity Timeline</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type toggle */}
            {(['questions', 'debates'] as const).map(t => (
              <button key={t} onClick={() => setTimelineType(t)}
                className={cn('px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors',
                  timelineType === t ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                )}
              >{t}</button>
            ))}
            <div className="w-px h-4 bg-border" />
            {/* View toggle */}
            {(['year', 'session'] as const).map(v => (
              <button key={v} onClick={() => setTimelineView(v)}
                className={cn('px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors',
                  timelineView === v ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                )}
              >By {v}</button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        {timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#888888" fontSize={10} tick={{ fontSize: 9 }} />
              <YAxis stroke="#888888" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                formatter={(val) => [val, timelineType === 'questions' ? 'Questions' : 'Debates']}
              />
              <Bar dataKey="Count" radius={[4, 4, 0, 0]}
                fill={timelineType === 'questions' ? '#6366f1' : '#ec4899'}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
            No {timelineType} data available
          </div>
        )}

        {/* Summary stats row */}
        <div className="grid grid-cols-3 gap-4 border-t border-zinc-900 pt-4">
          <div className="text-center">
            <p className="text-2xl font-black text-violet-400">{questions.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Total Questions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-pink-400">{debates.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Total Debates</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-amber-400">{bills.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Total Bills</p>
          </div>
        </div>

        {/* Top ministries questioned */}
        {top5Ministries.length > 0 && (
          <div className="space-y-2 border-t border-zinc-900 pt-4">
            <p className="text-xs font-bold text-muted-foreground">Top Ministries Questioned</p>
            {top5Ministries.map(([ministry, count]) => (
              <div key={ministry} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground truncate max-w-[200px]">{ministry}</span>
                  <span className="text-muted-foreground shrink-0">{count} questions</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${(count / maxMinistry) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance Comparison */}
      {allMps.length > 0 && (
        <div className="bg-muted/30 border border-zinc-900 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-black text-foreground">Attendance Comparison</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={attendanceChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#888888" fontSize={10} unit="%" />
              <YAxis type="category" dataKey="name" stroke="#888888" fontSize={10} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                formatter={(val) => [`${val}%`, 'Attendance']}
              />
              <Bar dataKey="Attendance" radius={[0, 4, 4, 0]}>
                {attendanceChartData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#6366f1' : i === 1 ? '#10b981' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> This MP: {mp.attendance_rate}%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {mp.state}: {stateAvg.toFixed(1)}%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> India: {indiaAvg.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* AI Summary & Topic Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-muted/30 border border-zinc-900 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h2 className="text-lg font-bold text-foreground">MP Profile Summary</h2>
            </div>
            <p className="text-sm text-foreground leading-relaxed font-normal">{mp.ai_summary}</p>
          </div>
          <div className="mt-6 border-t border-zinc-900/80 pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Source: PRS Legislative Research</span>
            <span>18th Lok Sabha</span>
          </div>
        </div>
        <div className="lg:col-span-2 bg-muted/30 border border-zinc-900 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Legislative Focus Area</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Questions by ministry group</p>
          </div>
          <div className="h-64 mt-6 w-full flex items-center justify-center">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#1f2937" />
                  <PolarAngleAxis dataKey="subject" stroke="#888888" fontSize={9} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#374151" fontSize={8} />
                  <Radar name={mp.name} dataKey="Score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                  <Tooltip contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-muted-foreground">No focus metrics available</span>
            )}
          </div>
        </div>
      </div>

      {/* Legislative Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-muted/30 border border-zinc-900 rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Legislative Focus Areas</h2>
          <div className="space-y-4">
            {topics.map((topic) => (
              <div key={topic.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{topic.topic_name}</span>
                  <span className="text-indigo-400">{topic.score}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${topic.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bills / Questions / Debates Tabs */}
        <div className="bg-card border border-zinc-900 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            {(['bills', 'questions', 'debates'] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setTabSearch(''); }}
                className={cn('px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors',
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab} {tab === 'bills' ? `(${bills.length})` : tab === 'questions' ? `(${questions.length})` : `(${debates.length})`}
              </button>
            ))}
            <div className="ml-auto relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input type="text" placeholder="Search..." value={tabSearch} onChange={e => setTabSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-muted border border-border rounded-lg text-foreground placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 w-48"
              />
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeTab === 'bills' && (
              filteredBills.length > 0 ? filteredBills.map(b => (
                <div key={b.id} onClick={() => { setSelectedItem(b); setModalType('bill'); }}
                  className="p-3 rounded-lg bg-muted/40 border border-zinc-900 space-y-1 cursor-pointer hover:border-amber-500 hover:bg-card/70 transition-all">
                  <p className="text-xs font-bold text-foreground">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground">{b.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">{b.status}</span>
                    <span className="text-[9px] text-zinc-600">{b.date_introduced}</span>
                  </div>
                </div>
              )) : <p className="text-xs text-muted-foreground text-center py-6">No bills found</p>
            )}
            {activeTab === 'questions' && (
              filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                <div key={q.id} onClick={() => { setSelectedItem(q); setModalType('question'); }}
                  className="p-3 rounded-lg bg-muted/40 border border-zinc-900 space-y-1 cursor-pointer hover:border-violet-500 hover:bg-card/70 transition-all">
                  <p className="text-xs font-bold text-foreground">{q.question_text}</p>
                  {q.response_text && <p className="text-[10px] text-muted-foreground">{q.response_text}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400">{q.category}</span>
                    <span className="text-[9px] text-zinc-600">{q.date}</span>
                  </div>
                </div>
              )) : <p className="text-xs text-muted-foreground text-center py-6">No questions found</p>
            )}
            {activeTab === 'debates' && (
              filteredDebates.length > 0 ? filteredDebates.map(d => (
                <div key={d.id} onClick={() => { setSelectedItem(d); setModalType('debate'); }}
                  className="p-3 rounded-lg bg-muted/40 border border-zinc-900 space-y-1 cursor-pointer hover:border-pink-500 hover:bg-card/70 transition-all">
                  <p className="text-xs font-bold text-foreground">{d.title}</p>
                  {d.speech_snippet && <p className="text-[10px] text-muted-foreground italic">"{d.speech_snippet}"</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-zinc-600">{d.contributions_count} contributions</span>
                    <span className="text-[9px] text-zinc-600">{d.date}</span>
                  </div>
                </div>
              )) : <p className="text-xs text-muted-foreground text-center py-6">No debates found</p>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
}
