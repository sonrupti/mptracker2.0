"use client";

import React from "react";
import AttendanceInsights from "./Insights";
import StateLeaderboard from "./StateLeaderboard";
import AttendanceHero from "./Hero";
import AttendanceTrend from "./TrendChart";
import AttendanceDistribution from "./Distribution";

import type { MP, MPPerformanceHistory } from "@/lib/supabase";

export default function AttendanceSection({
  mp,
  history,
  comparison,
  allMps,
}: {
  mp: MP;
  history: MPPerformanceHistory[];
  comparison: any;
  allMps: MP[];
}) {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Attendance Analysis</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-6">
            Session-wise attendance, comparison against national averages, and overall distribution among Members of Parliament.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <div className="h-full rounded-2xl border border-border/60 bg-card shadow-sm p-6 md:p-8">
              <AttendanceHero mp={mp} allMps={allMps} comparison={comparison} />
            </div>
          </div>

         <div className="lg:col-span-8 space-y-6">
  <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 md:p-8">
    <AttendanceTrend
      history={history}
      indiaAvg={comparison?.india?.attendance_rate ?? 0}
      mpAttendance={mp.attendance_rate}
    />
  </div>

  <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 md:p-8">
    <AttendanceDistribution
      allMps={allMps}
      mpAttendance={mp.attendance_rate}
      stateAvg={comparison?.state?.attendance_rate ?? 0}
      indiaAvg={comparison?.india?.attendance_rate ?? 0}
    />
  </div>

  <div className="grid gap-6 lg:grid-cols-2">
    <AttendanceInsights
      mp={mp}
      comparison={comparison}
    />

    <StateLeaderboard
      mp={mp}
      allMps={allMps}
    />
  </div>
          </div>
        </div>
      </div>
    </section>
  );
}