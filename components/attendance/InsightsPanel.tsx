import React, { useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import type { MP, MPPerformanceHistory } from '@/lib/supabase';
import { motion } from 'framer-motion';

function percentile(mp: MP, all: MP[]) {
  const sorted = [...all].sort((a, b) => b.attendance_rate - a.attendance_rate);
  const idx = sorted.findIndex(m => m.id === mp.id);
  if (idx === -1) return 0;
  return Number(((1 - idx / (sorted.length - 1)) * 100).toFixed(0));
}

function consistencyScore(history: MPPerformanceHistory[]) {
  if (!history || history.length === 0) return { score: 0, label: 'Unknown' };
  const vals = history.map(h => h.attendance_rate);
  const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
  const variance = vals.reduce((a,b)=>a + Math.pow(b-mean,2),0)/vals.length;
  const sd = Math.sqrt(variance);
  // Map sd to score: lower sd -> more consistent
  const score = Math.max(0, Math.min(100, Math.round((1 - (sd/50)) * 100)));
  const label = score >= 80 ? 'Consistent' : score >= 60 ? 'Moderate' : 'Variable';
  return { score, label, sd: Number(sd.toFixed(1)) };
}

export default function AttendanceInsights({ mp, allMps, comparison, history }: { mp: MP; allMps: MP[]; comparison:any; history: MPPerformanceHistory[] }) {
  const pct = useMemo(() => percentile(mp, allMps), [mp, allMps]);
  const cons = useMemo(() => consistencyScore(history), [history]);

  const insights = [
    { text: `Attendance is ${(mp.attendance_rate - comparison.india.attendance_rate).toFixed(1)}% above national average` },
    { text: `Better than the ${comparison.state.label} state average by ${(mp.attendance_rate - comparison.state.attendance_rate).toFixed(1)}%` },
    { text: `Better than party average by ${(mp.attendance_rate - comparison.party.attendance_rate).toFixed(1)}%` },
    { text: `Ranked in the top ${pct}% of MPs` },
    { text: `Consistency: ${cons.label} (SD ${cons.sd})` },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-black text-foreground">Insights</h3>
      <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ staggerChildren: 0.08 }} className="space-y-2">
        {insights.map((i, idx) => (
          <motion.li key={idx} className="flex items-start gap-3" whileHover={{ x: 6 }}>
            <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
            <p className="text-sm text-foreground">{i.text}</p>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
