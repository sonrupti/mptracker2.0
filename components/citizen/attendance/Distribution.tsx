"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from "recharts";

import type { MP } from "@/lib/supabase";

interface Props {
  allMps: MP[];
  mpAttendance: number;
  stateAvg: number;
  indiaAvg: number;
}

export default function AttendanceDistribution({
  allMps,
  mpAttendance,
  stateAvg,
  indiaAvg,
}: Props) {
  const bins = useMemo(() => {
    const counts = new Array(10).fill(0);
    allMps.forEach((m) => {
      const value = Math.max(0, Math.min(100, Math.round(m.attendance_rate)));
      const index = Math.min(9, Math.floor(value / 10));
      counts[index]++;
    });
    return counts.map((count, i) => ({
      name: `${i * 10}-${i * 10 + 9}`,
      count,
    }));
  }, [allMps]);

  const mpIndex = Math.min(9, Math.floor(mpAttendance / 10));
  const diffToIndia = mpAttendance - indiaAvg;
  const diffToState = mpAttendance - stateAvg;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-bold">Attendance Distribution</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-6">
            Compare this MP's attendance with all Members of Parliament.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-500">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            This MP
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            State Avg
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            National Avg
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">National avg</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{indiaAvg.toFixed(1)}%</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">State avg</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{stateAvg.toFixed(1)}%</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Difference</p>
          <p className={`mt-2 text-3xl font-semibold ${diffToIndia >= 0 ? "text-orange-500" : "text-red-500"}`}>
            {diffToIndia >= 0 ? "+" : ""}{diffToIndia.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="h-56 rounded-[1.5rem] border border-border/60 bg-background/80 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 10, right: 10, left: -14, bottom: 5 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <Tooltip cursor={{ fill: "rgba(249,115,22,0.08)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14 }} />
            <Bar dataKey="count" radius={[10, 10, 0, 0]}>
              {bins.map((_, index) => (
                <Cell key={index} fill={index === mpIndex ? "#f97316" : "#94a3b8"} />
              ))}
            </Bar>
            <ReferenceLine x={bins[mpIndex]?.name} stroke="#f97316" strokeWidth={1.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-border/60 bg-orange-500/5 px-4 py-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-orange-500">Insight:</span>{" "}
          This MP's attendance of <span className="font-semibold text-foreground">{mpAttendance.toFixed(1)}%</span> is <span className="font-semibold text-orange-500">{diffToIndia >= 0 ? "+" : ""}{diffToIndia.toFixed(1)}%</span> compared to the national average and <span className="font-semibold text-foreground">{diffToState >= 0 ? "+" : ""}{diffToState.toFixed(1)}%</span> compared to the state average.
        </p>
      </div>
    </div>
  );
}
