'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info, BarChart2, Clock, MessageSquare, MessageCircle, FileText } from 'lucide-react';

const BREAKDOWN = [
  { icon: <Clock className="h-4 w-4 text-emerald-500" />, label: 'Attendance', weight: '35%', max: '100%', note: 'Percentage of sessions attended out of total sessions held.' },
  { icon: <MessageSquare className="h-4 w-4 text-violet-500" />, label: 'Questions Asked', weight: '25%', max: 'Cap: 500', note: 'Total oral and written questions raised in Lok Sabha.' },
  { icon: <MessageCircle className="h-4 w-4 text-pink-500" />, label: 'Debates Participated', weight: '25%', max: 'Cap: 200', note: 'Number of debates and discussions the MP contributed to.' },
  { icon: <FileText className="h-4 w-4 text-amber-500" />, label: 'Bills Sponsored', weight: '15%', max: 'Cap: 20', note: 'Private member bills introduced by the MP.' },
];

const LIMITATIONS = [
  'The score does not measure quality of questions or debates — only quantity.',
  'Attendance data may not reflect reasons for absence (illness, constituency work, etc.).',
  'Ministers often participate less in debates due to executive responsibilities — this may lower their score unfairly.',
  'New MPs (first term) have had less time to accumulate activity.',
  'The score should be used as a starting point for exploration, not a final verdict.',
];

export default function CitizenMethodologyPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-3xl mx-auto w-full px-4 md:px-8 py-10 space-y-8"
    >
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">How We Measure</h1>
        <p className="text-sm text-muted-foreground">A transparent breakdown of how MP scores and metrics are calculated.</p>
      </div>

      {/* Data Source */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-black text-indigo-500">Data Source</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All data is sourced from{' '}
          <a href="https://prsindia.org" target="_blank" rel="noreferrer" className="text-indigo-500 underline">
            PRS Legislative Research
          </a>{' '}
          and the official Lok Sabha records. The dataset covers the 18th Lok Sabha (June 2024 onwards). Data is static and was last updated in 2024.
        </p>
      </div>

      {/* Score Formula */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-black text-foreground">Overall Score Formula</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The overall score is a weighted index out of 100, combining four activity metrics. It is meant as a rough indicator of parliamentary activity — not a definitive judgment of an MP's performance.
        </p>

        <div className="rounded-xl bg-background border border-border p-4 font-mono text-xs text-foreground leading-relaxed overflow-x-auto">
          Score = (Attendance × 0.35) + (Questions/500 × 25) + (Debates/200 × 25) + (Bills/20 × 15)
        </div>

        <div className="space-y-3">
          {BREAKDOWN.map(item => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/70">
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <p className="text-xs font-bold text-foreground">{item.label}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold">{item.weight}</span>
                    <span className="text-[9px] text-muted-foreground">{item.max}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
        <p className="text-sm font-black text-amber-600 dark:text-amber-400">Important Limitations</p>
        <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed list-none">
          {LIMITATIONS.map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">→</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Raw metrics note */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <p className="text-sm font-black text-foreground">We recommend looking at raw metrics too</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Rather than relying solely on the overall score, we encourage users to look at individual metrics — attendance %, number of questions, debates, and bills — and compare them against state and national averages on each MP's profile page. This gives a more honest picture.
        </p>
      </div>
    </motion.div>
  );
}
