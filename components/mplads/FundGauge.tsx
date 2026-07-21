'use client';

import { TrendingUp } from 'lucide-react';

interface Props {
  utilization: number;
}

export default function FundGauge({ utilization }: Props) {
  const percent = Math.min(Math.max(utilization, 0), 100);

  // Semi-circle (180°)
  const radius = 110;
  const circumference = Math.PI * radius;
  const progress = circumference - (percent / 100) * circumference;

  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h2 className="text-2xl font-black">
            Fund Utilization
          </h2>

          <p className="text-muted-foreground mt-1">
            Overall MPLADS expenditure efficiency
          </p>
        </div>

        <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <TrendingUp className="text-green-600" size={24} />
        </div>

      </div>

      <div className="flex justify-center">

        <div className="relative w-[280px] h-[170px]">

          <svg
            width="280"
            height="170"
            viewBox="0 0 280 170"
          >
            {/* Background Arc */}

            <path
              d="M30 140 A110 110 0 0 1 250 140"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="18"
              strokeLinecap="round"
            />

            {/* Progress Arc */}

            <path
              d="M30 140 A110 110 0 0 1 250 140"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
            />

            <defs>
              <linearGradient
                id="gaugeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
              >
                <stop
                  offset="0%"
                  stopColor="#22c55e"
                />

                <stop
                  offset="100%"
                  stopColor="#3b82f6"
                />
              </linearGradient>
            </defs>

          </svg>

          {/* Center Number */}

          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 text-center">

            <h1 className="text-5xl font-black">
              {percent.toFixed(1)}%
            </h1>

            <p className="text-muted-foreground text-sm mt-2">
              Funds Utilized
            </p>

          </div>

        </div>

      </div>

      {/* Bottom Stats */}

      <div className="grid grid-cols-3 gap-4 mt-8">

        <div className="rounded-2xl bg-muted/40 p-4 text-center">

          <p className="text-xs text-muted-foreground">
            Poor
          </p>

          <p className="font-bold mt-2">
            0–40%
          </p>

        </div>

        <div className="rounded-2xl bg-muted/40 p-4 text-center">

          <p className="text-xs text-muted-foreground">
            Average
          </p>

          <p className="font-bold mt-2">
            40–70%
          </p>

        </div>

        <div className="rounded-2xl bg-muted/40 p-4 text-center">

          <p className="text-xs text-muted-foreground">
            Excellent
          </p>

          <p className="font-bold mt-2">
            70–100%
          </p>

        </div>

      </div>

    </div>
  );
}