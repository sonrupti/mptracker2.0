'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';
import { MP, MPPerformanceHistory } from '@/lib/supabase';
import { computeDistribution, compareLabel } from '@/lib/percentile';

interface Props {
  mp: MP;
  comparison: any;
  allMps: MP[];
  history: MPPerformanceHistory[];
  nationalTrend: { year: number; avg_attendance_rate: number }[];
}

export default function AttendanceDetail({
  mp,
  comparison,
  allMps,
  history,
  nationalTrend,
}: Props) {
  const stateAvg = comparison?.state?.attendance_rate ?? null;
  const nationalAvg = comparison?.india?.attendance_rate ?? null;

  const trendData = useMemo(() => {
    const nationalByYear = new Map(nationalTrend.map(n => [n.year, n.avg_attendance_rate]));
    return history.map(h => ({
      year: h.year,
      thisMp: h.attendance_rate,
      national: nationalByYear.get(h.year) ?? null,
    }));
  }, [history, nationalTrend]);

  const improving =
    trendData.length >= 2 && trendData[trendData.length - 1].thisMp > trendData[0].thisMp;

  const distribution = useMemo(
    () =>
      computeDistribution(
        allMps.map(m => m.attendance_rate),
        mp.attendance_rate
      ),
    [allMps, mp.attendance_rate]
  );

  const stateComparison = stateAvg !== null ? compareLabel(mp.attendance_rate, stateAvg) : null;
  const nationalComparison =
    nationalAvg !== null ? compareLabel(mp.attendance_rate, nationalAvg) : null;

  return (
    <section className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
      {/* Headline number + percentile summary */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-black tabular-nums">{mp.attendance_rate}%</span>
          <span className="text-sm font-semibold text-muted-foreground">sittings attended</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5">
          <span className="font-bold text-foreground">{distribution.percentile}th percentile</span>
          {stateComparison && stateAvg !== null && (
            <>
              {' '}· {stateComparison === 'above' ? 'above' : stateComparison === 'below' ? 'below' : 'equal to'}{' '}
              state ({stateAvg}%)
            </>
          )}
          {nationalComparison && nationalAvg !== null && (
            <> &amp; {nationalComparison === 'above' ? 'above' : nationalComparison === 'below' ? 'below' : 'equal to'} national ({nationalAvg}%) avg</>
          )}
        </p>
      </div>

      {/* Session-by-session trend vs national avg */}
      <div className="bg-background border border-border/60 rounded-2xl p-5 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Session-by-session across the term
          </p>
          {trendData.length >= 2 && (
            <span className={`text-xs font-bold ${improving ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              {improving ? '↑ improving over term' : ''}
            </span>
          )}
        </div>

        {trendData.length > 0 ? (
          <div className="h-48 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="thisMp" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} name="this MP" />
                <Line type="monotone" dataKey="national" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" dot={false} name="national avg" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No session history available yet.</p>
        )}

        <div className="flex items-center gap-5 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
            <span className="text-xs font-semibold text-muted-foreground">this MP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span className="text-xs font-semibold text-muted-foreground">national avg</span>
          </div>
        </div>
      </div>

      {/* Full distribution across all MPs, with this MP marked */}
      <div className="bg-background border border-border/60 rounded-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            How this compares — full distribution of all {allMps.length} MPs
          </p>
          {distribution.thisMpBucketIndex >= 0 && (
            <span className="text-xs font-bold text-red-500">this MP</span>
          )}
        </div>

        {distribution.buckets.length > 0 ? (
          <div className="h-40 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution.buckets} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <YAxis hide domain={[0, 'dataMax']} />
                <XAxis hide dataKey="rangeStart" />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.buckets.map((b, i) => (
                    <Cell key={i} fill={b.isThisMpBucket ? '#ef4444' : 'var(--muted)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">Not enough data to compare yet.</p>
        )}

        <div className="flex items-center gap-5 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="text-xs font-semibold text-muted-foreground">this MP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" />
            <span className="text-xs font-semibold text-muted-foreground">national avg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40" />
            <span className="text-xs font-semibold text-muted-foreground">state avg</span>
          </div>
        </div>
      </div>
    </section>
  );
}
