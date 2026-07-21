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

const money = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    notation: amount > 10000000 ? 'compact' : 'standard',
  }).format(amount);
};

export default function MPLADSStatCards({ summary }: Props) {
  const cards = [
    {
      title: 'Funds Allocated',
      value: money(summary.allocated),
      sub: `${summary.recommendedCount} Recommended Works`,
      color: 'border-blue-500',
      bg: 'bg-blue-500/10',
      icon: IndianRupee,
      iconColor: 'text-blue-600',
    },
    {
      title: 'Fund Utilization',
      value: `${summary.utilization}%`,
      sub: money(summary.utilized),
      color: 'border-green-500',
      bg: 'bg-green-500/10',
      icon: TrendingUp,
      iconColor: 'text-green-600',
    },
    {
      title: 'Completed Works',
      value: summary.completedCount,
      sub: `${summary.ongoingCount} Ongoing`,
      color: 'border-orange-500',
      bg: 'bg-orange-500/10',
      icon: CheckCircle2,
      iconColor: 'text-orange-600',
    },
    {
      title: 'Completion Rate',
      value: `${summary.completionRate}%`,
      sub: 'Overall Progress',
      color: 'border-purple-500',
      bg: 'bg-purple-500/10',
      icon: Target,
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`
              relative
              rounded-2xl
              border
              border-border
              ${card.color}
              bg-card
              p-6
              shadow-sm
              hover:shadow-lg
              hover:-translate-y-1
              transition-all
              duration-300
            `}
          >
            {/* colored stripe */}
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-current opacity-70" />

            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  {card.title}
                </p>

                <h2 className="text-3xl font-black mt-3">
                  {card.value}
                </h2>

                <p className="text-sm text-muted-foreground mt-2">
                  {card.sub}
                </p>
              </div>

              <div
                className={`
                  ${card.bg}
                  h-14
                  w-14
                  rounded-2xl
                  flex
                  items-center
                  justify-center
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