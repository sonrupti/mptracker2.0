"use client";

import { CheckCircle2, TrendingUp, Trophy } from "lucide-react";
import type { MP } from "@/lib/supabase";

interface Props {
  mp: MP;
  comparison: any;
}

export default function AttendanceInsights({
  mp,
  comparison,
}: Props) {
  const indiaAvg = comparison?.india?.attendance_rate ?? 0;

  const insights = [
    {
      icon: CheckCircle2,
      title: "Attendance",
      text:
        mp.attendance_rate >= indiaAvg
          ? "Above national average"
          : "Below national average",
      color: "text-green-500",
    },
    {
      icon: TrendingUp,
      title: "Consistency",
      text:
        mp.attendance_rate >= 90
          ? "Excellent attendance record"
          : "Moderate attendance record",
      color: "text-orange-500",
    },
    {
      icon: Trophy,
      title: "Performance",
      text:
        mp.overall_score >= 80
          ? "Top performing MP"
          : "Good parliamentary performance",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 h-full">
      <h3 className="text-lg font-bold mb-5">
        Key Insights
      </h3>

      <div className="space-y-5">
        {insights.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-start gap-3"
            >
              <Icon className={`w-5 h-5 mt-0.5 ${item.color}`} />

              <div>
                <p className="font-semibold">
                  {item.title}
                </p>

                <p className="text-sm text-muted-foreground">
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}