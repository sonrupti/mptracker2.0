"use client";

import { MapPinned, Trophy, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
import type { MP } from "@/lib/supabase";

interface Props {
  mp: MP;
  allMps: MP[];
}

export default function StateSnapshot({
  mp,
  allMps,
}: Props) {
  const stats = useMemo(() => {
    const stateMps = allMps.filter(
      (m) => m.state === mp.state
    );

    const sorted = [...stateMps].sort(
      (a, b) => b.attendance_rate - a.attendance_rate
    );

    const rank =
      sorted.findIndex((m) => m.id === mp.id) + 1;

    const avg =
      stateMps.reduce(
        (sum, m) => sum + m.attendance_rate,
        0
      ) / Math.max(stateMps.length, 1);

    return {
      total: stateMps.length,
      rank,
      avg,
      best: sorted[0]?.attendance_rate ?? 0,
    };
  }, [mp, allMps]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <MapPinned className="w-5 h-5 text-orange-500" />

        <h3 className="text-lg font-bold">
          From {mp.state}
        </h3>
      </div>

      <div className="space-y-5">

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              MPs
            </span>
          </div>

          <span className="font-bold">
            {stats.total}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm">
              State Average
            </span>
          </div>

          <span className="font-bold">
            {stats.avg.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">
              Your Rank
            </span>
          </div>

          <span className="font-bold text-orange-500">
            #{stats.rank}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">
              Best Attendance
            </span>
          </div>

          <span className="font-bold">
            {stats.best.toFixed(1)}%
          </span>
        </div>

        <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 mt-2">
          <p className="text-sm leading-relaxed">
            This MP attends{" "}
            <span className="font-semibold text-orange-500">
              {(mp.attendance_rate - stats.avg >= 0 ? "+" : "")}
              {(mp.attendance_rate - stats.avg).toFixed(1)}%
            </span>{" "}
            compared to the average MP from{" "}
            <span className="font-semibold">
              {mp.state}
            </span>.
          </p>
        </div>

      </div>
    </div>
  );
}