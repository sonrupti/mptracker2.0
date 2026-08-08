'use client';

import React, { useMemo } from 'react';
import { MPLADSRecommended } from '@/lib/supabase';

interface Props {
  recommended: MPLADSRecommended[];
}

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 1,
    notation: amount > 100000 ? 'compact' : 'standard',
  }).format(amount);

/**
 * Sums recommended_amount_rupees by category (the closest thing the source
 * data has to a "sector"), sorted highest first.
 */
export default function MPLADSSectorBreakdown({ recommended }: Props) {
  const sectors = useMemo(() => {
    const totals: Record<string, number> = {};
    recommended.forEach(r => {
      const cat = r.category || 'Other';
      totals[cat] = (totals[cat] || 0) + (r.recommended_amount_rupees || 0);
    });
    return Object.entries(totals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [recommended]);

  if (sectors.length === 0) return null;

  const max = Math.max(...sectors.map(s => s.amount));

  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm p-6 md:p-8">
      <h2 className="text-lg font-black mb-6">Where it went — by sector</h2>
      <div className="space-y-4">
        {sectors.map(s => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="w-32 md:w-40 shrink-0 text-xs font-semibold text-muted-foreground truncate">{s.name}</span>
            <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.max(3, (s.amount / max) * 100)}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-xs font-bold tabular-nums">{money(s.amount)}</span>
          </div>
        ))}
      </div>

      <a
        href="#mplad-works"
        className="inline-block mt-6 text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors"
      >
        See individual sanctioned works →
      </a>
    </div>
  );
}
