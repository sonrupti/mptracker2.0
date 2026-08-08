'use client';

import {
  Building2,
  CheckCircle2,
  Clock3,
  IndianRupee,
  PiggyBank
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MPLADSSummary {
  total_sanctioned: number;
  total_utilised: number;
  utilisation_percentage: number;
  total_projects: number;
  completed_projects: number;
  ongoing_projects: number;
}

interface Props {
  summary: MPLADSSummary | null;
}

function formatCr(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
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

  const unspent = Math.max(0, summary.total_sanctioned - summary.total_utilised);

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
          <p className="text-3xl font-black text-orange-500">
            {summary.utilisation_percentage}%
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Fund Utilised</span>
          <span className="font-bold">{formatCr(summary.total_utilised)}</span>
        </div>

        <div className="w-full h-3 rounded-full bg-background overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${summary.utilisation_percentage}%` }}
          />
        </div>
      </div>

      {/* Money: sanctioned / utilised / unspent — unspent is the number that actually matters, so it's called out */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="bg-background rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Sanctioned</p>
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="font-black text-lg sm:text-xl truncate">{formatCr(summary.total_sanctioned)}</p>
        </div>

        <div className="bg-background rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Utilised</p>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-black text-lg sm:text-xl truncate">{formatCr(summary.total_utilised)}</p>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/40 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-widest text-orange-500 font-bold">Unspent</p>
            <PiggyBank className="w-4 h-4 text-orange-500" />
          </div>
          <p className="font-black text-lg sm:text-xl text-orange-500 truncate">{formatCr(unspent)}</p>
        </div>
      </div>

      {/* Projects: kept as a separate row so it doesn't get mixed in with the money stats */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="bg-background rounded-2xl p-4">
          <Building2 className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Projects</p>
          <p className="font-black text-lg">{summary.total_projects}</p>
        </div>

        <div className="bg-background rounded-2xl p-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Completed</p>
          <p className="font-black text-lg">{summary.completed_projects}</p>
        </div>

        <div className="bg-background rounded-2xl p-4">
          <Clock3 className="w-4 h-4 text-amber-500 mb-2" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Ongoing</p>
          <p className="font-black text-lg">{summary.ongoing_projects}</p>
        </div>
      </div>

    </div>
  );
}
