'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Database, Building2, SearchCheck, FileText, HelpCircle, ChevronDown, ArrowRightLeft, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/citizen/CitizenUI';

const FAQS = [
  { q: 'Where does the data come from?', a: 'All raw data is fetched directly from official government portals — Lok Sabha, Rajya Sabha, the Election Commission, and PRS Legislative Research. We do not generate our own data.' },
  { q: 'How often is it updated?', a: 'Data is synchronised at the end of every parliamentary session, ensuring all metrics reflect the most recent sitting.' },
  { q: 'Is this politically neutral?', a: 'Yes. The algorithm that calculates the overall score is entirely data-driven and applies identical weightings to every MP regardless of party affiliation.' },
  { q: 'Can I verify the information?', a: 'Absolutely. Every MP profile links directly to official Lok Sabha/Rajya Sabha transcripts and PDFs so you can read the original source material.' },
];

const SOURCES = [
  { title: 'Lok Sabha & Rajya Sabha', desc: 'Official session records, attendance registers, Q&A transcripts, and member participation logs.', icon: Building2, accent: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' },
  { title: 'PRS Legislative Research', desc: 'Verified statistical breakdowns of parliamentary participation and private member bills.', icon: FileText, accent: 'bg-amber-500/10 border-amber-500/20 text-amber-500' },
  { title: 'Election Commission of India', desc: 'Past election results, margins of victory, voter turnout, and candidate affidavits.', icon: Database, accent: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' },
  { title: 'Government Open Data', desc: 'Public APIs and datasets published and maintained by the Government of India.', icon: SearchCheck, accent: 'bg-sky-500/10 border-sky-500/20 text-sky-500' },
];

const SCORE_BREAKDOWN = [
  { label: 'Attendance', weight: 30, desc: 'Consistency in showing up for parliamentary sessions.', color: 'bg-emerald-500' },
  { label: 'Questions Asked', weight: 25, desc: 'Holding the government accountable during Question Hour.', color: 'bg-indigo-500' },
  { label: 'Bills Sponsored', weight: 20, desc: 'Drafting and introducing Private Member Bills.', color: 'bg-purple-500' },
  { label: 'Debates', weight: 15, desc: 'Active participation in legislative discussions.', color: 'bg-pink-500' },
  { label: 'Committee Participation', weight: 10, desc: 'Work done outside the main floor in specialised committees.', color: 'bg-amber-500' },
];

export default function AboutPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex-1 w-full bg-background pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <BackButton onClick={() => router.back()} />
      </div>

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-4 pt-10 pb-16 text-center relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-500/8 to-transparent -z-10 rounded-b-[3rem]" />
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="w-16 h-16 bg-card border border-border shadow-xl rounded-2xl mx-auto flex items-center justify-center mb-8">
          <ShieldCheck className="w-9 h-9 text-indigo-500" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-black tracking-tight mb-5">
          How We Measure MP Performance
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base md:text-lg text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
          All scores on this platform are derived exclusively from publicly available, official parliamentary records. No bias. Just data.
        </motion.p>
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-20">

        {/* Data Sources */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-3">Our Data Sources</h2>
            <p className="text-sm text-muted-foreground">Every data point is independently verifiable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOURCES.map((src, i) => (
              <motion.div key={src.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={cn('p-6 rounded-2xl border hover:scale-[1.02] transition-transform duration-200 cursor-default', src.accent)}
              >
                <src.icon className="w-7 h-7 mb-4" />
                <h3 className="font-bold text-base mb-2">{src.title}</h3>
                <p className="text-sm font-medium opacity-80 leading-relaxed">{src.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Score Breakdown */}
        <section className="bg-card border border-border/60 rounded-[2rem] p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-3">How the Score is Calculated</h2>
            <p className="text-sm text-muted-foreground">A balanced representation of parliamentary duties.</p>
          </div>
          <div className="space-y-8">
            {SCORE_BREAKDOWN.map((metric, i) => (
              <motion.div key={metric.label} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="flex justify-between items-start mb-2 gap-4">
                  <div>
                    <h3 className="font-bold">{metric.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{metric.desc}</p>
                  </div>
                  <span className="text-xl font-black shrink-0">{metric.weight}%</span>
                </div>
                <div className="h-3 bg-background border border-border/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${metric.weight * 2}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: i * 0.1 }}
                    className={cn('h-full rounded-full', metric.color)}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-8">
            Maximum weight per metric is 50 of 100 total points, ensuring no single factor dominates.
          </p>
        </section>

        {/* Why This Matters */}
        <section className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black mb-5">Why This Matters</h2>
          <p className="text-base text-muted-foreground leading-relaxed font-medium">
            Democracy thrives on accountability. When citizens have clear, understandable access to their representatives' actual performance, they can make informed decisions — rather than relying solely on political rhetoric or party loyalty.
          </p>
        </section>

        {/* FAQs */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-3 flex items-center justify-center gap-2">
              <HelpCircle className="w-7 h-7 text-indigo-500" /> Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQS.map((faq, i) => (
              <div key={i} className={cn('bg-card border rounded-2xl overflow-hidden transition-colors duration-200', openFaq === i ? 'border-indigo-500/30' : 'border-border/60 hover:border-indigo-500/20')}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-bold text-sm md:text-base pr-4">{faq.q}</span>
                  <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0', openFaq === i && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto text-center">
          <h3 className="text-base font-black text-amber-500 mb-3">Disclaimer</h3>
          <p className="text-sm text-amber-600/80 dark:text-amber-400/70 leading-relaxed font-medium">
            LokLens is an independent civic technology initiative. It provides data-driven insights to foster democratic transparency. We are not affiliated with the Government of India and do not endorse any political party, candidate, or ideology.
          </p>
        </section>

        {/* CTAs */}
        <section className="pt-8 border-t border-border/50">
          <h2 className="text-xl font-black text-center mb-8">Start Exploring</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { href: '/citizen/search', icon: SearchCheck, label: 'Find Your MP', color: 'bg-indigo-500/10 text-indigo-500' },
              { href: '/citizen/compare', icon: ArrowRightLeft, label: 'Compare MPs', color: 'bg-purple-500/10 text-purple-500' },
              { href: '/citizen', icon: MapPin, label: 'Explore India Map', color: 'bg-pink-500/10 text-pink-500' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="p-5 bg-card border border-border/60 rounded-2xl hover:border-indigo-500/30 hover:shadow-sm transition-all group text-center flex flex-col items-center gap-3">
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform', item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
