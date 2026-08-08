'use client';

import { IndianRupee, TrendingUp, PiggyBank } from 'lucide-react';

interface Summary {
  allocated: number;
  utilized: number;
  remaining: number;
}

interface Props {
  summary: Summary;
}

const money = (amount: number) => {
  const compact = amount > 10000000; // switch to ₹1.2Cr-style notation above 1 crore
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 0,
  }).format(amount);
};

/**
 * Three-card summary: Sanctioned / Utilised / Unspent.
 * "Sanctioned" = sum of recommended_amount_rupees, "Utilised" = sum of
 * expenditure_amount_rupees, "Unspent" = the difference. There's no
 * separate "released" figure in the underlying MPLADS data, so unlike a
 * typical scheme-tracker we only show what's actually verifiable from the
 * two source tables.
 */
export default function MPLADSSummaryCards({ summary }: Props) {
  const cards = [
    { title: 'Sanctioned', value: money(summary.allocated), icon: IndianRupee, accent: false },
    { title: 'Utilised', value: money(summary.utilized), icon: TrendingUp, accent: false },
    { title: 'Unspent', value: money(summary.remaining), icon: PiggyBank, accent: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={
              card.accent
                ? 'rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-6 overflow-hidden'
                : 'rounded-2xl border border-border bg-card p-6 overflow-hidden'
            }
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{card.title}</p>
              <Icon className={card.accent ? 'text-amber-500' : 'text-muted-foreground'} size={16} />
            </div>
            <h3
              className={`font-black leading-none truncate ${card.accent ? 'text-amber-500' : 'text-foreground'}`}
              style={{ fontSize: 'clamp(1.05rem, 3.4vw, 1.875rem)' }}
              title={card.value}
            >
              {card.value}
            </h3>
          </div>
        );
      })}
    </div>
  );
}
