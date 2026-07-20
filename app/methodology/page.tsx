'use client';

import { useLanguage } from '@/context/LanguageContext';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Info, BarChart2, Clock, MessageSquare, MessageCircle, FileText } from 'lucide-react';

export default function MethodologyPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 max-w-3xl mx-auto w-full">

      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-indigo-400 text-xs font-semibold transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-foreground tracking-tight">{t.howWeMeasure}</h1>
        <p className="text-sm text-muted-foreground">{t.transparentBreakdown}</p>
      </div>

      {/* Data Source */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-400" />
          <p className="text-sm font-black text-indigo-400">{t.dataSource}</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All data is sourced from <a href="https://prsindia.org" target="_blank" rel="noreferrer" className="text-indigo-400 underline">PRS Legislative Research</a> and the official Lok Sabha records. The dataset covers the 18th Lok Sabha (June 2024 onwards). Data is static and was last updated in 2024.
        </p>
      </div>

      {/* Score Formula */}
      <div className="rounded-xl border border-zinc-900 bg-muted/30 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-black text-foreground">{t.overallScoreFormula}</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The overall score is a weighted index out of 100, combining four activity metrics. It is meant as a rough indicator of parliamentary activity — not a definitive judgment of an MP's performance.
        </p>

        {/* Formula */}
        <div className="rounded-lg bg-card-950 border border-border p-4 font-mono text-xs text-foreground leading-relaxed">
          Score = (Attendance × 0.35) + (Questions/500 × 25) + (Debates/200 × 25) + (Bills/20 × 15)
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {[
            { icon: <Clock className="h-4 w-4 text-emerald-400" />, label: 'Attendance', weight: '35%', max: '100%', note: 'Percentage of sessions attended out of total sessions held.' },
            { icon: <MessageSquare className="h-4 w-4 text-violet-400" />, label: 'Questions Asked', weight: '25%', max: 'Cap: 500', note: 'Total oral and written questions raised in Lok Sabha.' },
            { icon: <MessageCircle className="h-4 w-4 text-pink-400" />, label: 'Debates Participated', weight: '25%', max: 'Cap: 200', note: 'Number of debates and discussions the MP contributed to.' },
            { icon: <FileText className="h-4 w-4 text-amber-400" />, label: 'Bills Sponsored', weight: '15%', max: 'Cap: 20', note: 'Private member bills introduced by the MP.' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-zinc-900">
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">{item.label}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold">{item.weight}</span>
                    <span className="text-[9px] text-zinc-600">{item.max}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
        <p className="text-sm font-black text-amber-400">{t.importantLimitations}</p>
        <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed list-none">
          {[
            'The score does not measure quality of questions or debates — only quantity.',
            'Attendance data may not reflect reasons for absence (illness, constituency work, etc.).',
            'Ministers often participate less in debates due to executive responsibilities — this may lower their score unfairly.',
            'New MPs (first term) have had less time to accumulate activity.',
            'The score should be used as a starting point for exploration, not a final verdict.',
          ].map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-400 font-bold shrink-0">→</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Raw metrics note */}
      <div className="rounded-xl border border-zinc-900 bg-card-950 p-5 space-y-2">
        <p className="text-sm font-black text-foreground">{t.recommendRaw}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Rather than relying solely on the overall score, we encourage users to look at individual metrics — attendance %, number of questions, debates, and bills — and compare them against state and national averages on each MP's profile page. This gives a more honest picture.
        </p>
      </div>

    </div>
  );
}