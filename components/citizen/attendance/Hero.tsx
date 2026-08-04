"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import type { MP } from "@/lib/supabase";

function percentile(mpId: string, allMps: MP[]) {
  if (!allMps?.length) return 0;
  const sorted = [...allMps].sort((a, b) => b.attendance_rate - a.attendance_rate);
  const idx = sorted.findIndex((m) => m.id === mpId);
  if (idx === -1) return 0;
  return Math.round((1 - idx / (sorted.length - 1)) * 100);
}

export default function AttendanceHero({
  mp,
  allMps,
  comparison,
}: {
  mp: MP;
  allMps: MP[];
  comparison: any;
}) {
  const [display, setDisplay] = useState(0);
  const pct = percentile(mp.id, allMps);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(progress * mp.attendance_rate));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [mp.attendance_rate]);

  const status =
    mp.attendance_rate >= 90
      ? "Excellent"
      : mp.attendance_rate >= 75
      ? "Good"
      : mp.attendance_rate >= 60
      ? "Average"
      : "Needs Improvement";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col justify-between"
    >
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground/80">
          <CalendarCheck className="h-3.5 w-3.5" />
          Attendance
        </div>

        <div className="mt-6">
          <div className="flex items-end gap-3">
            <span className="text-6xl font-black tracking-tight text-foreground">
              {display}
            </span>
            <span className="text-3xl font-semibold text-foreground/70 mb-1">%</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-foreground">{status}</p>
          <p className="mt-2 text-sm text-muted-foreground leading-6">
            Parliamentary sittings attended
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Attendance rate</span>
            <span>{mp.attendance_rate}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mp.attendance_rate}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full bg-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">National avg</p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {comparison?.india?.attendance_rate?.toFixed(1) ?? "—"}%
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Standing</p>
            <p className="mt-2 text-xl font-semibold text-foreground">Top {pct}%</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
