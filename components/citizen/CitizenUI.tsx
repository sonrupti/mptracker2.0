'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PARTY_SYMBOLS } from '@/lib/partysymbols';

/* ── Animated counter ─────────────────────────────────────────── */
export function CountUp({ value, duration = 1.2, suffix = '', decimals = 0 }: { value: number; duration?: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: v => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, value, duration, decimals]);

  return <span ref={ref} className="tabular-nums">{display}{suffix}</span>;
}

/* ── Party logo chip ──────────────────────────────────────────── */
export function PartyLogo({ party, size = 'md' }: { party: string; size?: 'sm' | 'md' | 'lg' }) {
  const src = PARTY_SYMBOLS[party];
  const dim = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-9 h-9' : 'w-6 h-6';
  if (!src) return null;
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full bg-white shrink-0 border border-border/60 shadow-sm overflow-hidden p-0.5', dim)}>
      <img src={src} alt={party} className="w-full h-full object-contain" />
    </span>
  );
}

/* ── Progress bar ─────────────────────────────────────────────── */
export function ProgressBar({ value, max = 100, className, barClassName }: { value: number; max?: number; className?: string; barClassName?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn('h-1.5 w-full bg-border/60 rounded-full overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn('h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full', barClassName)}
      />
    </div>
  );
}

/* ── Benchmark row: this MP/state vs comparison averages ────────── */
export function BenchmarkRow({ label, value, benchmarks, format, max }: {
  label: string;
  value: number;
  benchmarks: { label: string; value: number; color?: string }[];
  format: (v: number) => string | number;
  max: number;
}) {
  const rows = [{ label, value, color: 'bg-indigo-500' }, ...benchmarks.map(b => ({ ...b, color: b.color || 'bg-zinc-400/60' }))];
  return (
    <div className="space-y-2.5">
      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-24 text-right text-[11px] font-bold text-muted-foreground shrink-0 truncate">{row.label}</span>
          <div className="flex-1 h-2 bg-border/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, (row.value / max) * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full rounded-full', row.color)}
            />
          </div>
          <span className="w-12 text-xs font-black text-right tabular-nums shrink-0">{format(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Comparison chip: "Above/Below Average" ──────────────────────── */
export function ComparisonChip({ value, benchmark, higherIsBetter = true }: { value: number; benchmark: number; higherIsBetter?: boolean }) {
  const diff = value - benchmark;
  const isAbove = higherIsBetter ? diff >= 0 : diff <= 0;
  if (Math.abs(diff) < 0.05) {
    return <span className="text-[10px] font-bold text-muted-foreground">On par with average</span>;
  }
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold', isAbove ? 'text-emerald-500' : 'text-rose-500')}>
      {isAbove ? '▲' : '▼'} {isAbove ? 'Above' : 'Below'} Average
    </span>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-border/60 -mx-4 px-4 md:mx-0 md:px-0">
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors shrink-0',
              isActive ? 'text-indigo-500' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {tab.label}
            {isActive && (
              <motion.div layoutId="tab-underline" className="absolute -bottom-px left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Skeleton primitives ─────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-foreground/5 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent',
        className
      )}
    />
  );
}

/* ── Spinner ─────────────────────────────────────────────────── */
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin',
        className
      )}
    />
  );
}

/* ── Full-page loading state ─────────────────────────────────── */
export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <Spinner />
    </div>
  );
}

/* ── Reusable skeleton card ───────────────────────────────────── */
export function MPCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
}

/* ── List row skeleton ────────────────────────────────────────── */
export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl animate-pulse">
      <Skeleton className="w-12 h-6 rounded" />
      <Skeleton className="w-14 h-14 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3 rounded" />
        <Skeleton className="h-3 w-1/4 rounded" />
      </div>
      <Skeleton className="w-12 h-8 rounded-lg shrink-0" />
    </div>
  );
}

/* ── Stat card skeleton ───────────────────────────────────────── */
export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-8 w-16 rounded" />
    </div>
  );
}

/* ── Empty State ──────────────────────────────────────────────── */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-4">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center text-muted-foreground mb-2">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-black text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Error Banner ─────────────────────────────────────────────── */
export function ErrorBanner({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
        <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-black text-foreground">Something went wrong</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{message || 'Unable to load data. Please try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 px-6 py-2.5 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          Try Again
        </button>
      )}
    </div>
  );
}

/* ── Back Button ──────────────────────────────────────────────── */
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
    >
      <span className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </span>
      Back
    </button>
  );
}

/* ── Score badge ──────────────────────────────────────────────── */
export function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color =
    score >= 80 ? 'text-emerald-500'
    : score >= 60 ? 'text-indigo-500'
    : score >= 40 ? 'text-amber-500'
    : 'text-rose-500';

  const sizeClass =
    size === 'sm' ? 'text-lg'
    : size === 'md' ? 'text-2xl'
    : 'text-4xl';

  return <span className={cn('font-black tabular-nums', sizeClass, color)}>{score}</span>;
}

/* ── Section Header ───────────────────────────────────────────── */
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4">
      <div>
        <h2 className="text-xl md:text-2xl font-black tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1 font-medium">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
