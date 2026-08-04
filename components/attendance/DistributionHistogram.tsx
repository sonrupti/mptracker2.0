import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import type { MP } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function AttendanceDistribution({
  allMps,
  mpAttendance,
}: {
  allMps: MP[];
  mpAttendance: number;
}) {
  const bins = useMemo(() => {
    const ranges = [
      { name: '0-10', low: 0, high: 10 },
      { name: '10-30', low: 10, high: 30 },
      { name: '30-50', low: 30, high: 50 },
      { name: '50-70', low: 50, high: 70 },
      { name: '70-90', low: 70, high: 90 },
      { name: '90-100', low: 90, high: 100 },
    ];

    return ranges.map((range) => ({
      ...range,
      count: allMps.filter((mp) => {
        const attendance = Math.min(
          100,
          Math.max(0, Number(mp.attendance_rate))
        );

        return (
          attendance >= range.low &&
          attendance <= range.high
        );
      }).length,
    }));
  }, [allMps]);

  const activeBin = bins.find(
    (b) =>
      mpAttendance >= b.low &&
      mpAttendance <= b.high
  )?.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        w-full h-48
        rounded-2xl
        border border-white/10
        bg-black/40
        backdrop-blur-xl
        p-3
      "
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={bins}
          margin={{
            top: 10,
            right: 10,
            left: -15,
            bottom: 5,
          }}
        >
          <XAxis
            dataKey="name"
            stroke="#71717a"
            fontSize={11}
          />

          <YAxis
            stroke="#71717a"
            fontSize={11}
          />

          <Tooltip
            cursor={{
              fill: 'rgba(255,255,255,0.05)',
            }}
            contentStyle={{
              background:
                '#09090b',
              border:
                '1px solid #27272a',
              borderRadius: 12,
              color: '#fff',
            }}
            formatter={(value) => [
              value,
              'MPs',
            ]}
            labelFormatter={(label) =>
              `Attendance ${label}%`
            }
          />

          <Bar
            dataKey="count"
            radius={[
              8,
              8,
              0,
              0,
            ]}
            animationDuration={900}
          >
            {bins.map((entry) => (
              <Cell
                key={entry.name}
                fill={
                  entry.name === activeBin
                    ? '#f97316'
                    : '#334155'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}