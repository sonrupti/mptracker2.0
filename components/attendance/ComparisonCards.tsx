import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const colorMap: Record<string, string> = {
  amber: 'bg-gradient-to-br from-amber-800/10 to-amber-600/5 border-amber-500/20 text-amber-400',
  emerald: 'bg-gradient-to-br from-emerald-800/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  indigo: 'bg-gradient-to-br from-indigo-800/10 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
};

export default function ComparisonCards({ label, value, color = 'indigo', mpValue }: { label: string; value: number; color?: string; mpValue: number }) {
  const cls = colorMap[color] || colorMap.indigo;
  const diff = Number((value - mpValue).toFixed(1));
  const positive = diff >= 0;
  return (
    <motion.div whileHover={{ y: -4 }} className={`rounded-2xl p-4 border border-zinc-900 ${cls} transition-transform`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
        <div className="p-1 rounded bg-black/10">
          {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-extrabold text-foreground">{value}%</p>
          <p className={`text-xs mt-1 ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>{positive ? `+${diff}% vs MP` : `${diff}% vs MP`}</p>
        </div>
        <p className="text-xs text-muted-foreground">{label.includes('National') ? 'Nation' : label}</p>
      </div>
    </motion.div>
  );
}
