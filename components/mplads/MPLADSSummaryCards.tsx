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

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 1,
    notation: amount > 10000000 ? 'compact' : 'standard',
  }).format(amount);

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
                ? 'rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-6'
                : 'rounded-2xl border border-border bg-card p-6'
            }
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{card.title}</p>
              <Icon className={card.accent ? 'text-amber-500' : 'text-muted-foreground'} size={16} />
            </div>
            <h3 className={`text-3xl font-black leading-none ${card.accent ? 'text-amber-500' : 'text-foreground'}`}>
              {card.value}
            </h3>
          </div>
        );
      })}
    </div>
  );
}
