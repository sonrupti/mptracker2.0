import React from "react";
import AttendanceHero from "@/components/attendance/Hero";
import AttendanceTrendChart from "@/components/attendance/LineChart";
import AttendanceDistribution from "@/components/attendance/DistributionHistogram";
import { motion } from "framer-motion";

import { MP, MPPerformanceHistory } from "@/lib/supabase";

type Props = {
  mp: MP;
  history: MPPerformanceHistory[];
  allMps: MP[];
  comparison: any;
};

export default function AttendanceAnalytics({
  mp,
  history,
  allMps,
  comparison,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        rounded-3xl
        border border-zinc-200
        bg-[#f8f7f3]
        p-6 lg:p-10
        space-y-8
      "
    >

      {/* Breadcrumb */}
      <div className="
        flex items-center gap-3
        text-sm text-zinc-500
        border-b border-zinc-200
        pb-5
      ">
        <span className="font-bold text-blue-600">
          SansadWatch
        </span>

        <span>›</span>

        <span className="font-semibold text-zinc-900">
          {mp.constituency}
        </span>

        <span>›</span>

        <span>
          Attendance
        </span>
      </div>


      {/* Hero */}
      <AttendanceHero
        mp={mp}
        allMps={allMps}
        comparison={comparison}
      />


      {/* Session trend */}
      <div
        className="
          rounded-2xl
          border border-zinc-200
          bg-white
          p-5 lg:p-6
        "
      >

        <h3 className="
          text-xs
          tracking-wider
          font-semibold
          text-zinc-500
          mb-5
        ">
          SESSION-BY-SESSION ACROSS THE TERM
        </h3>


        <AttendanceTrendChart
          history={history}
          indiaAvg={comparison.india.attendance_rate}
          mpAttendance={mp.attendance_rate}
        />

        <div className="
          flex justify-between
          text-xs
          mt-4
          text-zinc-500
        ">
          <div className="flex gap-5">

            <span>
              🔵 this MP
            </span>

            <span>
              🟧 national avg
            </span>

          </div>

          <span>
            ↑ improving over term
          </span>

        </div>

      </div>



      {/* Distribution */}
      <div
        className="
          rounded-2xl
          border border-zinc-200
          bg-white
          p-5 lg:p-6
        "
      >

        <h3 className="
          text-xs
          tracking-wider
          font-semibold
          text-zinc-500
          mb-5
        ">
          HOW THIS COMPARES — FULL DISTRIBUTION OF ALL 543 MPS
        </h3>


        <AttendanceDistribution
          allMps={allMps}
          mpAttendance={mp.attendance_rate}
        />


        <div className="
          flex gap-6
          text-xs
          mt-4
          text-zinc-500
        ">
          <span className="text-red-700">
            ■ this MP
          </span>

          <span>
            │ national avg
          </span>

          <span>
            │ state avg
          </span>

        </div>

      </div>


    </motion.section>
  );
}