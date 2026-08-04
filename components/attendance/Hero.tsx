import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { MP } from '@/lib/supabase';

const getStatus = (n: number) => {
  if (n >= 85) return { label: 'Excellent', color: 'text-emerald-400' };
  if (n >= 70) return { label: 'Above Average', color: 'text-amber-400' };
  if (n >= 50) return { label: 'Average', color: 'text-yellow-400' };
  return { label: 'Needs Improvement', color: 'text-rose-400' };
};

function percentile(mpId: string, allMps: MP[]) {
  const sorted = [...allMps].sort((a, b) => b.attendance_rate - a.attendance_rate);
  const idx = sorted.findIndex(m => m.id === mpId);
  if (idx === -1) return 0;
  return Number(((1 - idx / (sorted.length - 1)) * 100).toFixed(0));
}

export default function AttendanceHero({ mp, allMps, comparison }: { mp: MP; allMps: MP[]; comparison: any }) {
  const attendance = mp.attendance_rate;
  const status = getStatus(attendance);
  const [display, setDisplay] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    let start = 0;
    const duration = 900;
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad approx
      const value = Math.round(eased * attendance);
      setDisplay(value);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    controls.start({ opacity: 1, y: 0 });
  }, [attendance, controls]);

  const pct = allMps ? percentile(mp.id, allMps) : null;

  return (
    <motion.div className="rounded-2xl bg-card p-6 border border-zinc-900 flex items-center justify-between gap-6"
      initial={{ opacity: 0, y: 12 }} animate={controls}>
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance</p>
        <h2 className="text-[80px] sm:text-[100px] md:text-[120px] font-extrabold tracking-tight text-foreground leading-none">
          {display}%
        </h2>
        <p className="mt-1 text-sm font-semibold flex items-center gap-3">
          <span className={`${status.color} mr-2`}>●</span>
          <span className="text-muted-foreground">{status.label}</span>
          {pct !== null && (
            <span className="text-xs text-zinc-500 ml-3">Top {pct}%</span>
          )}
        </p>
      </div>
      <div className="hidden md:block text-right max-w-xs">
        <p className="text-sm text-muted-foreground">Automatically determined performance band based on attendance.</p>
      </div>
    </motion.div>
  );
}
