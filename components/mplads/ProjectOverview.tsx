'use client';

import {
  CheckCircle2,
  Clock3,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

interface Props {
  completed: number;
  ongoing: number;
  recommended: number;
}

export default function ProjectOverview({
  completed,
  ongoing,
  recommended,
}: Props) {
  const total = recommended;

  const completion =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  const cards = [
    {
      title: 'Completed',
      value: completed,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Ongoing',
      value: ongoing,
      icon: Clock3,
      color: 'text-yellow-600',
      bg: 'bg-yellow-500/10',
    },
    {
      title: 'Recommended',
      value: recommended,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Total',
      value: total,
      icon: BarChart3,
      color: 'text-purple-600',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm p-8">

      <div className="flex items-center justify-between mb-8">

        <div>

          <h2 className="text-2xl font-black">
            Project Overview
          </h2>

          <p className="text-muted-foreground mt-1">
            Current MPLADS project status
          </p>

        </div>

      </div>

      <div className="grid grid-cols-2 gap-5">

        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-border p-5 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-sm text-muted-foreground">
                    {card.title}
                  </p>

                  <h3 className="text-3xl font-black mt-2">
                    {card.value}
                  </h3>

                </div>

                <div
                  className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center`}
                >
                  <Icon
                    className={card.color}
                    size={28}
                  />
                </div>

              </div>

            </div>
          );
        })}

      </div>

      <div className="mt-10">

        <div className="flex justify-between mb-2">

          <span className="font-medium">
            Overall Completion
          </span>

          <span className="font-black">
            {completion}%
          </span>

        </div>

        <div className="h-3 rounded-full bg-muted overflow-hidden">

          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700"
            style={{
              width: `${completion}%`,
            }}
          />

        </div>

      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center">

        <div>

          <p className="text-2xl font-black text-green-600">
            {completed}
          </p>

          <p className="text-sm text-muted-foreground">
            Finished
          </p>

        </div>

        <div>

          <p className="text-2xl font-black text-yellow-600">
            {ongoing}
          </p>

          <p className="text-sm text-muted-foreground">
            Running
          </p>

        </div>

        <div>

          <p className="text-2xl font-black text-blue-600">
            {recommended}
          </p>

          <p className="text-sm text-muted-foreground">
            Total
          </p>

        </div>

      </div>

    </div>
  );
}