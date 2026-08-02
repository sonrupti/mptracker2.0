'use client';

import {
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  Target,
} from 'lucide-react';

interface Summary {
  allocated: number;
  utilized: number;
  remaining: number;
  utilization: number;
  recommendedCount: number;
  completedCount: number;
  ongoingCount: number;
  completionRate: number;
}

interface Props {
  summary: Summary;
}

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: amount > 10000000 ? 'compact' : 'standard',
  }).format(amount);

export default function MPLADSStatCards({ summary }: Props) {
  const cards = [
    {
      title: 'Funds Allocated',
      value: money(summary.allocated),
      sub: `${summary.recommendedCount} Recommended Works`,
      accent: 'bg-[#f59e0b]',
      bg: 'bg-[#f59e0b]/10',
      icon: IndianRupee,
      iconColor: 'text-[#f59e0b]',
    },
    {
      title: 'Fund Utilization',
      value: `${summary.utilization}%`,
      sub: money(summary.utilized),
      accent: 'bg-[#16a34a]',
      bg: 'bg-[#16a34a]/10',
      icon: TrendingUp,
      iconColor: 'text-[#16a34a]',
    },
    {
      title: 'Completed Works',
      value: summary.completedCount,
      sub: `${summary.ongoingCount} Ongoing`,
      accent: 'bg-[#1e3a8a]',
      bg: 'bg-[#1e3a8a]/10',
      icon: CheckCircle2,
      iconColor: 'text-[#1e3a8a]',
    },
    {
      title: 'Completion Rate',
      value: `${summary.completionRate}%`,
      sub: 'Overall Progress',
      accent: 'bg-slate-400',
      bg: 'bg-slate-400/10',
      icon: Target,
      iconColor: 'text-slate-400',
    },
  ];

  return (
   <div
  className="
    grid
    gap-6
    [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]
  "
>
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-border
              bg-card
              p-6
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-lg
            "
          >
            <div
              className={`absolute left-0 top-0 h-full w-1 ${card.accent}`}
            />

            <div className="flex items-start justify-between gap-4">
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>

                <h2 className="mt-3 text-3xl font-black leading-none whitespace-nowrap">
                  {card.value}
                </h2>

                <p className="mt-3 text-sm text-muted-foreground">
                  {card.sub}
                </p>
              </div>

              {/* Icon */}
              <div
                className={`
                  ${card.bg}
                  flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl
                `}
              >
                <Icon className={card.iconColor} size={28} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}