'use client';

import {
  IndianRupee,
  Wallet,
  TrendingUp,
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

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: value > 10000000 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(value);

export default function PerformanceSummary({
  summary,
}: Props) {
  const items = [
    {
      icon: IndianRupee,
      color: 'bg-blue-500/10 text-blue-600',
      title: 'Allocated',
      value: money(summary.allocated),
    },
    {
      icon: Wallet,
      color: 'bg-green-500/10 text-green-600',
      title: 'Utilized',
      value: money(summary.utilized),
    },
    {
      icon: Wallet,
      color: 'bg-orange-500/10 text-orange-600',
      title: 'Remaining',
      value: money(summary.remaining),
    },
    {
      icon: TrendingUp,
      color: 'bg-purple-500/10 text-purple-600',
      title: 'Utilization',
      value: `${summary.utilization}%`,
    },
  ];

  return (
    <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h2 className="text-2xl font-black">
            Performance Summary
          </h2>

          <p className="text-muted-foreground mt-1">
            Financial overview of MPLADS works
          </p>
        </div>

        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <Target className="text-indigo-600" />
        </div>

      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-border p-5"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}
              >
                <Icon size={22} />
              </div>

              <p className="text-sm text-muted-foreground mt-5">
                {item.title}
              </p>

              <h3 className="text-2xl font-black mt-2">
                {item.value}
              </h3>
            </div>
          );
        })}

      </div>

      <div className="mt-10">

        <div className="flex justify-between text-sm mb-2">
          <span>Project Completion</span>
          <span className="font-bold">
            {summary.completionRate}%
          </span>
        </div>

        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-700"
            style={{
              width: `${summary.completionRate}%`,
            }}
          />
        </div>

      </div>

      <div className="grid grid-cols-3 gap-6 mt-8 text-center">

        <div>
          <h2 className="text-3xl font-black text-green-600">
            {summary.completedCount}
          </h2>
          <p className="text-sm text-muted-foreground">
            Completed
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-black text-yellow-600">
            {summary.ongoingCount}
          </h2>
          <p className="text-sm text-muted-foreground">
            Ongoing
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-black text-blue-600">
            {summary.recommendedCount}
          </h2>
          <p className="text-sm text-muted-foreground">
            Recommended
          </p>
        </div>

      </div>

    </section>
  );
}