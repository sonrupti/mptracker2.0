'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Star, ExternalLink, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOPICS, getTopicDef, Scope } from '@/lib/activityTopics';

export interface ActivityListItem {
  id: string;
  date: string;
  title: string;
  ministry?: string;
  topicId: string;
  scope: Scope;
  starred?: boolean;
  href?: string;
}

interface ActivityListProps {
  items: ActivityListItem[];
  ctaLabel: string;
  emptyMessage: string;
  /** If set, only this many items show initially, with a "Show more" button. Omit to show everything. */
  pageSize?: number;
}

const TOPIC_CHIP_LIMIT = 6;

/**
 * Filterable, card-based list used for a single MP's Questions / Debates /
 * Bills tabs. Every card is a doorway to the raw record: topic + scope
 * badges up top, then a link out to the source (PRS / official URL) when
 * one is on record.
 */
export default function ActivityList({ items, ctaLabel, emptyMessage, pageSize }: ActivityListProps) {
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize || items.length);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => { counts[item.topicId] = (counts[item.topicId] || 0) + 1; });
    return counts;
  }, [items]);

  const presentTopics = useMemo(
    () => TOPICS.filter(t => topicCounts[t.id]).sort((a, b) => (topicCounts[b.id] || 0) - (topicCounts[a.id] || 0)),
    [topicCounts]
  );

  const visibleTopics = showAllTopics ? presentTopics : presentTopics.slice(0, TOPIC_CHIP_LIMIT);
  const hiddenTopicCount = presentTopics.length - visibleTopics.length;

  const filtered = topicFilter === 'all' ? items : items.filter(i => i.topicId === topicFilter);
  const visible = pageSize ? filtered.slice(0, visibleCount) : filtered;

  React.useEffect(() => {
    if (pageSize) setVisibleCount(pageSize);
  }, [topicFilter, pageSize]);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {presentTopics.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTopicFilter('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors',
              topicFilter === 'all'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-border/60 hover:border-orange-500/40'
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
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors',
                  active ? topic.badgeClass : 'bg-background text-foreground border-border/60 hover:border-orange-500/40'
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
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold border border-border/60 bg-background text-muted-foreground hover:border-orange-500/40"
            >
              +{hiddenTopicCount}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items match this topic.</p>
      ) : (
        <div className="space-y-3">
          {visible.map(item => {
            const topic = getTopicDef(item.topicId);
            const TopicIcon = topic.icon;
            return (
              <div key={item.id} className="p-4 bg-background rounded-xl border border-border/60">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold', topic.dotClass)}>
                      <TopicIcon className="w-3 h-3" /> {topic.label}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-border/60 text-[10px] font-semibold text-muted-foreground">
                      {item.scope}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground shrink-0">
                    <Calendar className="w-3 h-3" />
                    {item.date || 'Unknown date'}
                    {item.starred && (
                      <span className="inline-flex items-center gap-0.5 text-amber-500 ml-1">
                        <Star className="w-3 h-3 fill-amber-500" /> Starred
                      </span>
                    )}
                  </span>
                </div>

                <p className="text-sm font-medium leading-snug line-clamp-2">{item.title || 'Untitled'}</p>
                {item.ministry && (
                  <p className="text-[10px] text-muted-foreground mt-1">Ministry of {item.ministry}</p>
                )}

                {item.href && (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors mt-2.5"
                  >
                    {ctaLabel} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pageSize && visibleCount < filtered.length && (
        <div className="flex justify-center pt-1">
          <button
            onClick={() => setVisibleCount(c => c + pageSize)}
            className="px-5 py-2 bg-card border border-border/60 rounded-xl text-xs font-bold hover:border-orange-500/40 transition-colors"
          >
            Show more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
