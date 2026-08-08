'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HelpCircle, Activity as ActivityIcon, FileText, Calendar, Star,
  ExternalLink, ChevronDown, Search,
} from 'lucide-react';
import { db, MP, MPQuestion, MPDebate, MPBill } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { PageLoader, ErrorBanner, EmptyState, PartyLogo } from '@/components/citizen/CitizenUI';
import { TOPICS, getTopicDef, classifyTopic, deriveScope, Scope } from '@/lib/activityTopics';

type ItemType = 'question' | 'debate' | 'bill';

interface ActivityItem {
  key: string;
  type: ItemType;
  mp: MP;
  date: string;
  title: string;
  ministry?: string;
  topicId: string;
  scope: Scope;
  starred?: boolean;
  href?: string; // external "raw record" link (PRS / official source)
}

const TYPE_META: Record<ItemType, { label: string; icon: typeof HelpCircle; ctaLabel: string; dotClass: string }> = {
  question: { label: 'Question', icon: HelpCircle, ctaLabel: 'Read full question & ministry reply', dotClass: 'text-green-600 bg-green-600/10 border-green-600/20' },
  debate: { label: 'Debate', icon: ActivityIcon, ctaLabel: 'Read full debate details', dotClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
  bill: { label: 'Bill', icon: FileText, ctaLabel: 'Read full bill details', dotClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
};

const PAGE_SIZE = 20;

export default function ActivityFeedPage() {
  const [mps, setMps] = useState<MP[]>([]);
  const [questions, setQuestions] = useState<MPQuestion[]>([]);
  const [debates, setDebates] = useState<MPDebate[]>([]);
  const [bills, setBills] = useState<MPBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setLoading(true);
    setError(false);

    Promise.all([db.getMps(), db.getAllQuestions(), db.getAllDebates(), db.getAllBills()])
      .then(([mpsData, questionsData, debatesData, billsData]) => {
        setMps(mpsData || []);
        setQuestions(questionsData || []);
        setDebates(debatesData || []);
        setBills(billsData || []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const mpById = useMemo(() => {
    const map = new Map<string, MP>();
    mps.forEach(mp => map.set(mp.id, mp));
    return map;
  }, [mps]);

  const items: ActivityItem[] = useMemo(() => {
    const out: ActivityItem[] = [];

    questions.forEach(q => {
      const mp = mpById.get(q.mp_id);
      if (!mp) return;
      out.push({
        key: `question-${q.id}`,
        type: 'question',
        mp,
        date: q.date,
        title: q.question_text,
        ministry: q.ministry_name || q.ministry,
        topicId: classifyTopic(q.category, q.ministry_name, q.ministry, q.keywords, q.question_text),
        scope: deriveScope(q.question_text, mp.constituency, mp.state),
        starred: (q.question_type || '').toLowerCase() === 'starred',
        href: q.source_url || q.prs_url || q.official_url || q.link || q.question_pdf,
      });
    });

    debates.forEach(d => {
      const mp = mpById.get(d.mp_id);
      if (!mp) return;
      out.push({
        key: `debate-${d.id}`,
        type: 'debate',
        mp,
        date: d.date,
        title: d.title,
        ministry: d.ministry,
        topicId: classifyTopic(d.topic, d.ministry, d.debate_type, d.title),
        scope: deriveScope(d.title, mp.constituency, mp.state),
        href: d.prs_url || d.video_url || d.transcript_url,
      });
    });

    bills.forEach(b => {
      const mp = mpById.get(b.mp_id);
      if (!mp) return;
      out.push({
        key: `bill-${b.id}`,
        type: 'bill',
        mp,
        date: b.date_introduced || '',
        title: b.title,
        topicId: classifyTopic(b.title, b.description),
        scope: deriveScope(b.title, mp.constituency, mp.state),
        href: b.prs_bill_page_url,
      });
    });

    return out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [questions, debates, bills, mpById]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => { counts[item.topicId] = (counts[item.topicId] || 0) + 1; });
    return counts;
  }, [items]);

  const presentTopics = useMemo(
    () => TOPICS.filter(t => topicCounts[t.id]).sort((a, b) => (topicCounts[b.id] || 0) - (topicCounts[a.id] || 0)),
    [topicCounts]
  );

  const visibleTopics = showAllTopics ? presentTopics : presentTopics.slice(0, 6);
  const hiddenTopicCount = presentTopics.length - visibleTopics.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (topicFilter !== 'all' && item.topicId !== topicFilter) return false;
      if (q && !item.title?.toLowerCase().includes(q) && !item.mp.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, typeFilter, topicFilter, search]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [typeFilter, topicFilter, search]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBanner message="Unable to load the activity feed." onRetry={() => window.location.reload()} />;

  const TYPE_TABS: { id: 'all' | ItemType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'question', label: 'Questions' },
    { id: 'debate', label: 'Debates' },
    { id: 'bill', label: 'Bills' },
  ];

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="flex-1 w-full bg-background pb-24">
      <header className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Parliament Activity</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Every question, debate and bill on record, straight from Parliament. Filter by topic and
          type — every card opens onto the raw record. This is activity, not outcomes.
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by keyword or MP name..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border/60 rounded-xl focus:outline-none focus:border-orange-500/50"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {TYPE_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold border transition-colors',
                typeFilter === t.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-foreground border-border/60 hover:border-orange-500/40'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Topic filter */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Filter by topic</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setTopicFilter('all')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold border transition-colors',
                topicFilter === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-foreground border-border/60 hover:border-orange-500/40'
              )}
            >
              All
            </button>
            {visibleTopics.map(topic => {
              const Icon = topic.icon;
              const active = topicFilter === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setTopicFilter(active ? 'all' : topic.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors',
                    active ? topic.badgeClass : 'bg-card text-foreground border-border/60 hover:border-orange-500/40'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {topic.label}
                </button>
              );
            })}
            {!showAllTopics && hiddenTopicCount > 0 && (
              <button
                onClick={() => setShowAllTopics(true)}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold border border-border/60 bg-card text-muted-foreground hover:border-orange-500/40"
              >
                +{hiddenTopicCount}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-5xl mx-auto px-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title="No activity found"
            description="Try a different topic, type, or search term."
          />
        ) : (
          <div className="space-y-4">
            {visible.map((item, i) => {
              const topic = getTopicDef(item.topicId);
              const TopicIcon = topic.icon;
              const typeMeta = TYPE_META[item.type];
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.03 }}
                  className="bg-card border border-border/60 rounded-2xl p-5 md:p-6 hover:border-orange-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold', topic.dotClass)}>
                        <TopicIcon className="w-3 h-3" /> {topic.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/60 text-[11px] font-semibold text-muted-foreground">
                        {item.scope}
                      </span>
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold', typeMeta.dotClass)}>
                        <typeMeta.icon className="w-3 h-3" /> {typeMeta.label}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground shrink-0">
                      <Calendar className="w-3 h-3" />
                      {item.date || 'Unknown date'}
                      {item.starred && (
                        <span className="inline-flex items-center gap-0.5 text-amber-500 ml-1">
                          <Star className="w-3 h-3 fill-amber-500" /> Starred
                        </span>
                      )}
                    </span>
                  </div>

                  <p className="text-sm md:text-base font-semibold leading-snug mb-1 line-clamp-2">{item.title || 'Untitled'}</p>
                  {item.ministry && (
                    <p className="text-[11px] text-muted-foreground mb-4">Ministry of {item.ministry}</p>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-border/40">
                    <Link href={`/citizen/mp/${item.mp.id}`} className="flex items-center gap-2 group min-w-0">
                      <img
                        src={item.mp.image_url || '/placeholder-avatar.png'}
                        alt={item.mp.name}
                        className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                      />
                      <span className="text-xs font-bold truncate group-hover:text-orange-500 transition-colors">{item.mp.name}</span>
                      <PartyLogo party={item.mp.party} size="sm" />
                    </Link>

                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors shrink-0"
                      >
                        {typeMeta.ctaLabel} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        href={`/citizen/mp/${item.mp.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors shrink-0"
                      >
                        View on {item.mp.name}'s page →
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {visibleCount < filtered.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="px-6 py-2.5 bg-card border border-border/60 rounded-xl text-sm font-bold hover:border-orange-500/40 transition-colors"
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
