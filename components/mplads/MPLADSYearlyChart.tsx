'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MPLADSRecommended, MPLADSExpenditure } from '@/lib/supabase';

interface Props {
  recommended: MPLADSRecommended[];
  expenditure: MPLADSExpenditure[];
}

function yearOf(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const y = new Date(dateStr).getFullYear();
  return Number.isFinite(y) ? y : null;
}

const compact = (v: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

/**
 * "Sanctioned vs Utilised — by year." There's no distinct "released" figure
 * in the MPLADS source data (only recommended vs. expenditure amounts), so
 * this shows the two series we can actually verify rather than inventing a
 * third one.
 */
export default function MPLADSYearlyChart({ recommended, expenditure }: Props) {
  const data = useMemo(() => {
    const sanctionedByYear: Record<number, number> = {};
    recommended.forEach(r => {
      const y = yearOf(r.recommendation_date);
      if (y) sanctionedByYear[y] = (sanctionedByYear[y] || 0) + (r.recommended_amount_rupees || 0);
    });

    const utilisedByYear: Record<number, number> = {};
    expenditure.forEach(e => {
      const y = yearOf(e.expenditure_date);
      if (y) utilisedByYear[y] = (utilisedByYear[y] || 0) + (e.expenditure_amount_rupees || 0);
    });

    const years = Array.from(new Set([...Object.keys(sanctionedByYear), ...Object.keys(utilisedByYear)]))
      .map(Number)
      .sort((a, b) => a - b);

    return years.map(year => ({
      year: String(year),
      sanctioned: sanctionedByYear[year] || 0,
      utilised: utilisedByYear[year] || 0,
    }));
  }, [recommended, expenditure]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm p-6 md:p-8">
      <h2 className="text-lg font-black mb-1">Sanctioned vs Utilised — by year</h2>
      <p className="text-sm text-muted-foreground mb-6">MPLAD works recommended vs. funds actually spent, per year.</p>
      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 10, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: any) => `₹${compact(Number(v) || 0)}`}
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="sanctioned" name="Sanctioned" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            <Bar dataKey="utilised" name="Utilised" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
