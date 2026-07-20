'use client';

import {
  Building2,
  CheckCircle2,
  Clock3,
  IndianRupee
} from 'lucide-react';

import { MPLADSSummary } from '@/lib/supabase';

interface Props {
  summary: MPLADSSummary | null;
}

export default function MPLADSCard({ summary }: Props) {
  if (!summary) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6">
        <h2 className="text-xl font-black mb-2">
          MPLADS Development
        </h2>

        <p className="text-sm text-muted-foreground">
          No MPLADS data available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
            MPLADS
          </p>

          <h2 className="text-2xl font-black">
            Development Fund
          </h2>
        </div>

        <div className="text-right">

          <p className="text-xs text-muted-foreground">
            Utilisation
          </p>

          <p className="text-3xl font-black text-indigo-500">
            {summary.utilisation_percentage}%
          </p>

        </div>

      </div>

      <div className="mt-6">

        <div className="flex justify-between text-sm mb-2">

          <span>Fund Utilised</span>

          <span className="font-bold">
            ₹{summary.total_utilised} Cr
          </span>

        </div>

        <div className="w-full h-3 rounded-full bg-background overflow-hidden">

          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-700"
            style={{
              width: `${summary.utilisation_percentage}%`
            }}
          />

        </div>

      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">

        <div className="bg-background rounded-2xl p-4">

          <IndianRupee className="w-5 h-5 text-indigo-500 mb-2"/>

          <p className="text-xs text-muted-foreground">
            Sanctioned
          </p>

          <p className="font-black text-lg">
            ₹{summary.total_sanctioned} Cr
          </p>

        </div>

        <div className="bg-background rounded-2xl p-4">

          <Building2 className="w-5 h-5 text-violet-500 mb-2"/>

          <p className="text-xs text-muted-foreground">
            Projects
          </p>

          <p className="font-black text-lg">
            {summary.total_projects}
          </p>

        </div>

        <div className="bg-background rounded-2xl p-4">

          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2"/>

          <p className="text-xs text-muted-foreground">
            Completed
          </p>

          <p className="font-black text-lg">
            {summary.completed_projects}
          </p>

        </div>

        <div className="bg-background rounded-2xl p-4">

          <Clock3 className="w-5 h-5 text-amber-500 mb-2"/>

          <p className="text-xs text-muted-foreground">
            Ongoing
          </p>

          <p className="font-black text-lg">
            {summary.ongoing_projects}
          </p>

        </div>

      </div>

    </div>
  );
}