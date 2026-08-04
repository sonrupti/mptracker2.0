"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ArrowDownRight, ArrowRight, Sparkles } from "lucide-react";

import type { MPPerformanceHistory } from "@/lib/supabase";

interface Props {
  history: MPPerformanceHistory[];
  indiaAvg: number;
  mpAttendance: number;
}

/* ---------------------------------------------------------------------- */
/*  Small helpers                                                          */
/* ---------------------------------------------------------------------- */

// Interpolate between two hex colors. t = 0 -> c1, t = 1 -> c2
function interpolateColor(c1: string, c2: string, t: number) {
  const a = parseInt(c1.slice(1), 16);
  const b = parseInt(c2.slice(1), 16);
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 700, height: 288 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

/* ---------------------------------------------------------------------- */
/*  Component                                                              */
/* ---------------------------------------------------------------------- */

export default function AttendanceTrend({ history, indiaAvg, mpAttendance }: Props) {
  const data = useMemo(
    () =>
      history.length > 0
        ? history.map((h) => ({
            year: String(h.year),
            attendance: Math.max(0, Math.min(100, h.attendance_rate)),
          }))
        : [{ year: new Date().getFullYear().toString(), attendance: mpAttendance }],
    [history, mpAttendance]
  );

  const trendDirection = useMemo(() => {
    if (data.length < 2) return "stable" as const;
    const last = data[data.length - 1].attendance;
    const prev = data[data.length - 2].attendance;
    return last === prev ? ("stable" as const) : last > prev ? ("up" as const) : ("down" as const);
  }, [data]);

  const latestValue = data[data.length - 1]?.attendance ?? mpAttendance;

  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>();
  const { width, height } = size;

  const pad = { top: 34, right: 22, bottom: 8, left: 40 };
  const plotW = Math.max(width - pad.left - pad.right, 1);
  const plotH = Math.max(height - pad.top - pad.bottom, 1);

  const xScale = (i: number) =>
    pad.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2);
  const yScale = (v: number) => pad.top + (1 - v / 100) * plotH;

  const points = useMemo(
    () => data.map((d, i) => ({ ...d, x: xScale(i), y: yScale(d.attendance) })),
    [data, width, height]
  );

  const [hovered, setHovered] = useState<number | null>(null);

  const COLOR_START = "#fed7aa"; // light peach
  const COLOR_END = "#ea580c"; // deep orange

  const ticks = [0, 25, 50, 75, 100];

  // Direction of the final segment, for the arrowhead
  const arrow = useMemo(() => {
    if (points.length < 2) return null;
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    return { x: p2.x, y: p2.y, angle };
  }, [points]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold">Attendance Trend</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-6">
            Session-wise attendance compared with the national average.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground/80">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            This MP
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground/80">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400/80" />
            National Avg
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              {trendDirection === "up" ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : trendDirection === "down" ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <span className="text-sm font-semibold">—</span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest session</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{latestValue.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Trend</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {trendDirection === "up"
              ? "Improving attendance"
              : trendDirection === "down"
              ? "Slight decline"
              : "Stable performance"}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/*  Chart                                                        */}
      {/* ------------------------------------------------------------- */}
      <div
        ref={containerRef}
        className="relative h-72 rounded-[2rem] bg-background/60 p-3 overflow-hidden"
      >
        <svg width={width} height={height} className="block">
          <defs>
            <filter id="attGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines + Y labels */}
          {ticks.map((t) => {
            const y = yScale(t);
            return (
              <g key={t}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text
                  x={pad.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="var(--muted-foreground)"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* National average reference line */}
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={yScale(indiaAvg)}
            y2={yScale(indiaAvg)}
            stroke="#94a3b8"
            strokeDasharray="6 6"
            strokeWidth={1.5}
          />
          <text
            x={width - pad.right}
            y={yScale(indiaAvg) - 6}
            textAnchor="end"
            fontSize={11}
            fill="#94a3b8"
          >
            National Avg {indiaAvg.toFixed(1)}%
          </text>

          {/* Tapered gradient ribbon line, segment by segment */}
          {points.slice(1).map((p, idx) => {
            const prev = points[idx];
            const t = idx / Math.max(points.length - 2, 1);
            const color = interpolateColor(COLOR_START, COLOR_END, t);
            const strokeWidth = 6 + t * 8; // tapers from thin to thick
            const isLast = idx === points.length - 2;
            return (
              <line
                key={idx}
                x1={prev.x}
                y1={prev.y}
                x2={p.x}
                y2={p.y}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                filter={isLast ? "url(#attGlow)" : undefined}
              />
            );
          })}

          {/* Arrowhead on the final segment */}
          {arrow && (
            <g transform={`translate(${arrow.x}, ${arrow.y}) rotate(${(arrow.angle * 180) / Math.PI})`}>
              <polygon points="0,0 -18,-9 -12,0 -18,9" fill={COLOR_END} filter="url(#attGlow)" />
            </g>
          )}

          {/* Data point dots */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return (
              <g key={i}>
                {isLast && (
                  <circle cx={p.x} cy={p.y} r={10} fill={COLOR_END} opacity={0.35} filter="url(#attGlow)" />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isLast ? 7 : 5}
                  fill={COLOR_END}
                  stroke="var(--background)"
                  strokeWidth={3}
                />
                {/* invisible hit area for hover */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16}
                  fill="transparent"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                />
              </g>
            );
          })}

          {/* Decorative sparkle, bottom right */}
          <foreignObject x={width - pad.right - 18} y={height - 28} width={22} height={22}>
            <Sparkles className="h-4 w-4 text-muted-foreground/50" />
          </foreignObject>
        </svg>

        {/* X axis labels */}
        <div
          className="absolute bottom-1 left-0 right-0 flex justify-between text-xs text-muted-foreground"
          style={{ paddingLeft: pad.left, paddingRight: pad.right }}
        >
          {data.map((d, i) => (
            <span key={i} className={data.length > 1 ? "" : "mx-auto"}>
              {d.year}
            </span>
          ))}
        </div>

        {/* Tooltip */}
        {hovered !== null && points[hovered] && (
          <div
            className="pointer-events-none absolute z-10 rounded-2xl border border-border/60 bg-card p-4 shadow-xl"
            style={{
              left: points[hovered].x,
              top: points[hovered].y,
              transform: "translate(-50%, -120%)",
              minWidth: 160,
            }}
          >
            <p className="text-xs font-semibold text-muted-foreground">{points[hovered].year}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {points[hovered].attendance.toFixed(1)}%
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-orange-500">
              {trendDirection === "up" ? (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Strong increase to {latestValue.toFixed(0)}%
                </>
              ) : trendDirection === "down" ? (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  Decline from {points[hovered].attendance.toFixed(1)}%
                </>
              ) : (
                <>
                  <ArrowRight className="h-3.5 w-3.5" />
                  Stable
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
